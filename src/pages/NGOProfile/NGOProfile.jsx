// src/pages/NGOProfile/NGOProfile.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./NGOProfile.css";
import Footer from "../../components/Footer/Footer";
import {
  Plus,
  Settings,
  MapPin,
  Phone,
  Mail,
  Clock,
  Camera,
  Package,
  LogOut,
  Trash2,
  Pencil,
  ChevronDown,
  Globe
} from "lucide-react";
import L from "leaflet";
import greyMarkerImage from '../../assets/grey-map-marker.png';
import redMarkerImage from '../../assets/red-map-marker.png';
import { isValidLatLng, CoordinatesPicker } from '../../components/CoordinatesPicker/coordinatespicker'
import { clothingCategories } from "../../constants/clothingcategories";

const ngoIcon = new L.Icon({
  iconUrl: greyMarkerImage,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
// put this above your return (or inside component scope)
const todayStr = new Date().toISOString().slice(0, 10);

const requestIcon = new L.Icon({
  iconUrl: redMarkerImage,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultCenter = [33.8938, 35.5018]; // Beirut

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";
const CONTENT_BASE = `${API_BASE}/home`; // must match Express mount

function Chip({ icon: Icon, text, title }) {
  if (!text) return null;
  return (
    <div className="chip" title={title || text}>
      <span className="chip-icon">
        <Icon size={14} />
      </span>
      <span className="chip-text">{text}</span>
    </div>
  );
}

/* ------------ Request Card (matches donation-card look) ------------ */
function RequestCard({ req }) {
  const status = (req.status || "Standard").trim();
  const urgent = status.toLowerCase() === "urgent";
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);

  const metaPieces = [];
  if (req.gender) metaPieces.push(req.gender);
  if (req.size) metaPieces.push(`Size ${req.size}`);
  if (req.ageRange) metaPieces.push(`Age ${req.ageRange}`);
  if (req.dateNeeded)
    metaPieces.push(
      `Needed by ${new Date(req.dateNeeded).toLocaleDateString()}`
    );
  const meta = metaPieces.join(" • ");

  return (
    <div className={`card req-card ${urgent ? "urgent" : ""}`}>
      <div className="req-top">
        <div className="req-left">
          <div className="req-avatar" />
          <div className="req-title">
            <div className="req-name">{req.category || "Request"}</div>
            <div className="req-sub">
              <MapPin size={14} />
              <span>{req.location || "—"}</span>
            </div>
          </div>
        </div>
        <div className="req-count-chip">{req.count ?? 0}</div>
      </div>

      {meta && <div className="req-desc">{meta}</div>}

      <div className={`req-status ${urgent ? "danger" : "ok"}`}>
        {statusText}
      </div>
    </div>
  );
}

/* ------------ Settings Dropdown ------------ */
function SettingsMenu({
  open,
  onClose,
  onEdit,
  onSignOut,
  onDeleteAccount,
  isDeleting = false
}, ref) {
  if (!open) return null;
  return (
    <div
      ref={ref}
      className="settings-menu card"
      role="menu"
      style={{ position: "absolute", right: 0, top: "2.25rem", zIndex: 10, padding: 8, minWidth: 200 }}
    >
      {/* Renamed to Edit Profile and keeps opening the modal */}
      <button className="menu-item" onClick={() => { onEdit(); onClose(); }}>
        <Pencil size={16} style={{ marginRight: 8 }} /> Edit Profile
      </button>
      <button className="menu-item" onClick={() => { onSignOut(); onClose(); }}>
        <LogOut size={16} style={{ marginRight: 8 }} /> Sign Out
      </button>
      <hr className="menu-sep" />
      <button
        className="menu-item danger"
        disabled={isDeleting}
        onClick={() => {
          onClose();
          onDeleteAccount();
        }}
      >
        <Trash2 size={16} style={{ marginRight: 8 }} /> {isDeleting ? 'Deleting…' : 'Delete Account'}
      </button>
    </div>
  );
}
const SettingsMenuWithRef = React.forwardRef(SettingsMenu);
/* ------------ Edit Profile Modal (map-only location, email verify, no chip order/logo url, no horizontal scroll) ------------ */
function EditProfileModal({ open, onClose, profile, onSave }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",                         // set from map picker only
    summary: "",
    coordinates: { lat: null, lng: null}, // internal only; not displayed
    workingHours: "",
    social: { website: "", instagram: "", facebook: "" },
  });

  // Email verification UI (visible only when email is changed)
  const [emailChanged, setEmailChanged] = useState(false);
  const [verifSending, setVerifSending] = useState(false);
  const [verifSent, setVerifSent] = useState(false);
  const [verifCode, setVerifCode] = useState("");
  const [verifConfirming, setVerifConfirming] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [saving, setSaving] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (open && profile) {
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: (typeof profile.location === "string"
          ? profile.location
          : (profile.location?.address || "")) || "",
        summary: profile.summary || profile.bio || "",
        coordinates: profile.coordinates || { lat: null, lng: null },
        workingHours: profile.workingHours || "",
        social: profile.social || { website: "", instagram: "", facebook: "" },
      });

      // reset email verification state each time the modal opens
      setEmailChanged(false);
      setVerifSending(false);
      setVerifSent(false);
      setVerifCode("");
      setVerifConfirming(false);
      setEmailVerified(false);
    }
  }, [open, profile]);

  function update(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));

    if (name === "email") {
      const changed = (value || "").trim() && (value || "").trim() !== (profile?.email || "");
      setEmailChanged(changed);
      if (!changed) {
        setVerifSent(false);
        setVerifCode("");
        setEmailVerified(false);
      }
    }
  }
  function updateSocial(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, social: { ...s.social, [name]: value } }));
  }

  // Adjust these endpoints to your backend if they differ
  async function requestEmailChange() {
    try {
      setVerifSending(true);
      const res = await fetch(`${API_BASE}/auth/email/change/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: form.email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send verification code");
      }
      setVerifSent(true);
      alert("Verification code sent to the new email.");
    } catch (e) {
      alert(e.message);
    } finally {
      setVerifSending(false);
    }
  }

  async function confirmEmailChange() {
    try {
      if (!verifCode.trim()) {
        alert("Enter the verification code.");
        return;
      }
      setVerifConfirming(true);
      const res = await fetch(`${API_BASE}/auth/email/change/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifCode.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Invalid or expired code");
      }
      setEmailVerified(true);
      alert("Email verified. Save Changes to apply.");
    } catch (e) {
      alert(e.message);
    } finally {
      setVerifConfirming(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // If user changed email but hasn't verified, keep old email
      const outgoing = {
        name: form.name?.trim(),
        // apply new email only if verified
        email: (!emailChanged || emailVerified) ? form.email?.trim() : (profile?.email || ""),
        phone: form.phone?.trim(),
        location: form.location?.trim(),
        summary: form.summary ?? "",
        coordinates: form.coordinates ?? null,
        workingHours: form.workingHours || "",
        social: form.social || { website: "", instagram: "", facebook: "" },
      };

      await onSave(outgoing);
      onClose();
    } catch (err) {
      alert(err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ overflowX: "hidden" }}>
      <div
        className="modal card edit-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editProfileTitle"
        style={{
          maxWidth: "720px",
          width: "min(720px, 92vw)",
          overflowX: "hidden", // prevent horizontal movement
        }}
      >
        <div className="modal-header">
          <h2 id="editProfileTitle">Edit NGO Profile</h2>
          <button className="icon-btn close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          <div className="form-grid">
            <div>
              <label>Name</label>
              <input name="name" value={form.name} onChange={update} placeholder="Your organization name" />
            </div>

            <div>
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={update} placeholder="name@ngo.org" />
              {emailChanged && (
                <div style={{ marginTop: 8 }}>
                  {!verifSent ? (
                    <button
                      type="button"
                      className="btn"
                      onClick={requestEmailChange}
                      disabled={verifSending}
                    >
                      {verifSending ? "Sending code…" : "Send verification code"}
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={verifCode}
                        onChange={(e) => setVerifCode(e.target.value)}
                        placeholder="Enter code"
                      />
                      <button
                        type="button"
                        className="btn"
                        onClick={confirmEmailChange}
                        disabled={verifConfirming}
                      >
                        {verifConfirming ? "Verifying…" : "Verify"}
                      </button>
                    </div>
                  )}
                  {emailVerified && (
                    <p className="muted" style={{ marginTop: 6, color: "green" }}>
                      Email verified ✓
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={update} placeholder="+961 ..." />
            </div>
            <div>
              <label>Website</label>
              <input
                name="website"
                value={form.social.website}
                onChange={updateSocial}
                placeholder="https://…"
              />
            </div>

            {/* Location: map-only (read-only input just displays chosen place name) */}
            <div className="col-span-2">
              <label>Location</label>
              <input
                name="location"
                value={form.location}
                readOnly
                placeholder="Pick on map"
              />
              <button
                type="button"
                className="btn"
                style={{ marginTop: 8 }}
                onClick={() => setShowMap(true)}
              >
                Select on Map
              </button>
            </div>

            <div className="col-span-2">
              <label>Summary / Bio</label>
              <textarea
                rows={4}
                name="summary"
                value={form.summary}
                onChange={update}
                placeholder="Mission, activities, impact…"
              />
            </div>

            <div className="col-span-2">
              <label>Working Hours</label>
              <input
                name="workingHours"
                value={form.workingHours}
                onChange={update}
                placeholder="e.g., Mon–Fri 10:00–18:00"
              />
            </div>

<div>
  <label>Instagram</label>
  <input
    name="instagram"
    value={form.social.instagram}
    onChange={updateSocial}
    placeholder="URL or @handle"
  />
</div>

<div>
  <label>Facebook</label>
  <input
    name="facebook"
    value={form.social.facebook}
    onChange={updateSocial}
    placeholder="URL or @handle"
  />
</div>
    </div>


          <div className="modal-actions">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

          {/* Map picker writes back coords + human-readable name */}
          {showMap && (
            <CoordinatesPicker
              initialCoordinates={
                isValidLatLng(form.coordinates)
                  ? form.coordinates
                  : defaultCenter
              }
              initialLocation={form.location}
              onSave={(coords, name) =>
                setForm((prev) => ({
                  ...prev,
                  coordinates: coords,
                  location: name || prev.location,
                }))
              }
              onClose={() => setShowMap(false)}
              markerIcon={ngoIcon}
            />
          )}
        </form>
      </div>
    </div>
  );
}


function formatLocationForChip(loc) {
  const s = (typeof loc === 'string' ? loc : (loc?.address || '')).trim();
  if (!s) return '';
  const beforeComma = s.split(',')[0]?.trim();
  let display = beforeComma || s.split(/\s+/)[0] || '';
  if (display.length > 30) display = display.slice(0, 30).trim() + '…';
  return display;
}

function fmtDateTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return Number.isNaN(+d) ? "—" : d.toLocaleString();
}

export default function NGOProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState(null);

  // posts
  const [posts, setPosts] = useState([]);
  const [postLoading, setPostLoading] = useState(false);
  const [newText, setNewText] = useState("");
  const [newFiles, setNewFiles] = useState([]);
  const [creatingPost, setCreatingPost] = useState(false);

  const [showMap, setShowMap] = useState(false);

  // requests
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [creatingReq, setCreatingReq] = useState(false);
  const [reqForm, setReqForm] = useState({
    category: "",
    count: "",
    gender: "",
    status: "Standard", // or "Urgent"
    dateNeeded: "",
    location: "",
    size: "",
    ageRange: "",
    coordinates: { lat: null, lng: null }
  });

  // avatar preview (local only)
  const [avatarSrc, setAvatarSrc] = useState(null);
  const fileRef = useRef(null);

  // settings & modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null); // NEW: ref-based outside click
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ---- Avatar uploading state and function ----
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function uploadAvatar(file) {
    if (!profile?.id || !file) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setUploadingAvatar(true);

      // simple client checks to improve UX
      const MAX_MB = 5;
      if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed.');
      if (file.size > MAX_MB * 1024 * 1024) throw new Error(`Max ${MAX_MB}MB per image`);

      const form = new FormData();
      form.append('logo', file); // multer expects "logo" field name

      const res = await fetch(
        `${API_BASE}/ngo/update/${encodeURIComponent(profile.id)}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to upload profile picture');
      }

      // Refresh profile to pull the new logoUrl
      const me = await fetch(`${API_BASE}/ngo/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (me.ok) {
        const data = await me.json().catch(() => ({}));
        if (data?.profile) setProfile(data.profile);
      }
    } catch (e) {
      alert(e.message || 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  }

  const pickFile = () => fileRef.current?.click();
  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    // local preview
    const url = URL.createObjectURL(file);
    setAvatarSrc((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return url;
    });

    // upload to backend
    uploadAvatar(file);

    e.target.value = '';
  };

  useEffect(() => {
    return () => {
      if (avatarSrc?.startsWith("blob:")) URL.revokeObjectURL(avatarSrc);
    };
  }, [avatarSrc]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/ngo/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403 || res.status === 404) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          navigate('/login', { replace: true });
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load profile');
        }

        const data = await res.json();
        if (!cancelled) setProfile(data.profile);
      } catch (e) {
        // show an inline error, but DO NOT loop-redirect
        if (!cancelled) setErr(e.message || 'Error loading profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- run once

  // Fetch posts for THIS NGO only
  const fetchPostsForNgo = useCallback(async (ngoId) => {
    try {
      setPostLoading(true);
      const res = await fetch(
        `${CONTENT_BASE}/posts?ngoId=${encodeURIComponent(ngoId)}`
      );
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();

      // Defensive sort by createdAt
      data.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setPostLoading(false);
    }
  }, []);

  // Fetch requests for THIS NGO only
  const fetchRequestsForNgo = useCallback(async (ngoId) => {
    try {
      setReqLoading(true);
      const res = await fetch(
        `${CONTENT_BASE}/requests?ngoId=${encodeURIComponent(ngoId)}`
      );
      if (!res.ok) throw new Error("Failed to load requests");
      const data = await res.json();
      data.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setReqLoading(false);
    }
  }, []);

  // When profile.id is available, load this NGO's posts + requests
  useEffect(() => {
    if (profile?.id) {
      fetchPostsForNgo(profile.id);
      fetchRequestsForNgo(profile.id);
    }
  }, [profile?.id, fetchPostsForNgo, fetchRequestsForNgo]);

  async function handleCreatePost(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!newText.trim() && newFiles.length === 0) {
      alert("Please add text or at least one image.");
      return;
    }

    // Simple file validation (UX only; enforce on server too)
    const MAX_MB = 5;
    for (const f of newFiles) {
      if (!f.type.startsWith("image/")) {
        alert("Only images are allowed.");
        return;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        alert(`Each image must be ≤ ${MAX_MB}MB`);
        return;
      }
    }

    try {
      setCreatingPost(true);

      const form = new FormData();
      form.append("text", newText.trim());
      for (const f of newFiles) form.append("images", f);

      const res = await fetch(`${CONTENT_BASE}/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // do NOT set Content-Type
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create post");
      }

      setNewText("");
      setNewFiles([]);
      if (profile?.id) await fetchPostsForNgo(profile.id);
    } catch (e) {
      alert(e.message);
    } finally {
      setCreatingPost(false);
    }
  }

  function updateReqField(e) {
    const { name, value } = e.target;
    setReqForm((s) => ({ ...s, [name]: value }));
  }

  async function handleCreateRequest(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const payload = {
      category: reqForm.category.trim(),
      count: Number(reqForm.count || 0),
      gender: reqForm.gender.trim(),
      status: reqForm.status.trim(), // "Standard" | "Urgent"
      dateNeeded: reqForm.dateNeeded, // "YYYY-MM-DD"
      location: reqForm.location.trim(),
      size: reqForm.size.trim(),
      ageRange: reqForm.ageRange.trim(),
      coordinates: reqForm.coordinates,
    };

    // NEW: stronger front-end validation for UX (server must also validate)
    const errors = [];
    if (!payload.category) errors.push("Category is required");
    if (!Number.isInteger(payload.count) || payload.count <= 0) errors.push("Count must be a positive integer");
    if (!payload.status) errors.push("Status is required");
    if (!payload.dateNeeded || Number.isNaN(Date.parse(payload.dateNeeded))) errors.push("Valid date is required");
    if (!payload.location) errors.push("Location is required");
    if (errors.length) {
      alert(errors[0]);
      return;
    }

    try {
      setCreatingReq(true);

      const res = await fetch(`${CONTENT_BASE}/requests`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create request");
      }

      // Clear and refresh
      setReqForm({
        category: "",
        count: "",
        gender: "",
        status: "Standard",
        dateNeeded: "",
        location: "",
        size: "",
        ageRange: "",
        coordinates: { lat: null, lng: null },
      });

      if (profile?.id) await fetchRequestsForNgo(profile.id);
    } catch (e) {
      alert(e.message);
    } finally {
      setCreatingReq(false);
    }
  }

  // ---- Settings actions ----
  function handleSignOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  }

  async function handleDeleteAccount() {
    const sure = window.confirm(
      "Delete account? This action cannot be undone."
    );
    if (!sure) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`${API_BASE}/ngo/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete account");
      }
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      navigate("/signup"); // or /login
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveProfile(updates) {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const payload = {
      name: updates.name?.trim(),
      email: updates.email?.trim(),
      phone: updates.phone?.trim(),
      location: updates.location?.trim(),
      summary: updates.summary ?? "",
      logoUrl: updates.logoUrl?.trim(),
      coordinates: updates.coordinates ?? null,

      // NEW: extra editable fields (optional for backend)
      workingHours: updates.workingHours || "",
      social: updates.social || { website: "", instagram: "", facebook: "" },
      chipOrder: Array.isArray(updates.chipOrder) && updates.chipOrder.length
        ? updates.chipOrder
        : ["location", "phone", "email", "hours"],
    };

    const res = await fetch(`${API_BASE}/ngo/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 202) {
      alert("We sent a verification link to your new email. Please confirm it to finish updating your account email.");
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to update profile");
    }

    const data = await res.json(); // assume { profile: {...} } or updated fields
    // Merge conservatively
    setProfile((p) => ({ ...p, ...(data.profile || payload) }));
  }

  // close settings when clicking outside (use ref instead of query selectors)
  useEffect(() => {
    function onDocClick(e) {
      const btn = document.querySelector(".Settings");
      const clickedInside =
        (btn && btn.contains(e.target)) ||
        (settingsRef.current && settingsRef.current.contains(e.target));
      if (!clickedInside) setSettingsOpen(false);
    }
    if (settingsOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [settingsOpen]);

  if (loading) {
    return (
      <div className="page">
        <section className="wrap">
          <div className="card">
            <p>Loading profile…</p>
          </div>
        </section>
      </div>
    );
  }

  if (err) {
    return (
      <div className="page">
        <section className="wrap">
          <div className="card">
            <p style={{ color: "crimson" }}>{err}</p>
            <button className="btn" onClick={() => navigate("/login")}>
              Go to Login
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (!profile) return null;

  const {
    name,
    email,
    phone,
    location,
    logoUrl,
    bio,
    summary,
    workingHours = "",
    social = {},
    chipOrder = ["location", "phone", "email", "hours"]
  } = profile;
  const avatar = avatarSrc || logoUrl || null;

  // ---- FIX: always render a trimmed string for location (profile only) ----
  const rawLocation =
    typeof location === "string" ? location : (location?.address || "");
  const displayLocation = formatLocationForChip(rawLocation);

  // Build chips dynamically (nothing hardcoded)
  const chipMap = {
    location: <Chip key="loc" icon={MapPin} text={displayLocation} title={rawLocation} />,
    phone: <Chip key="ph" icon={Phone} text={phone} />,
    email: <Chip key="em" icon={Mail} text={email} />,
    hours: workingHours ? <Chip key="hr" icon={Clock} text={workingHours} /> : null,
  };
  const chips = chipOrder.map(k => chipMap[k]).filter(Boolean);

  return (
    <div className="page">
      {/* Cover */}
      <section className="wrap">
        <div className="cover" />

        {/* Header card */}
        <div className="card header-card" style={{ position: "relative" }}>
          <div className="avatar-holder">
            <div className="avatar-lg">
              {avatar ? <img src={avatar} alt="NGO avatar" /> : <Camera size={28} />}
            </div>
            <button
              type="button"
              className="avatar-add"
              onClick={pickFile}
              aria-label="Change NGO picture"
              title={uploadingAvatar ? "Uploading…" : "Change picture"}
              disabled={uploadingAvatar}
            >
              <Plus size={50} strokeWidth={3} />
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={onAvatarChange}
            />
          </div>

          <div className="header-actions" style={{ position: "relative" }}>
            {/* Changed: top button now goes to Admin page */}
            <button
              className="EDITbtn"
              onClick={() => navigate('/adminngo')}
              title="Admin"
            >
              Admin
            </button>

            <button
              className="Settings"
              aria-label="settings"
              onClick={() => setSettingsOpen((v) => !v)}
              title="Settings"
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <Settings size={16} />
              <ChevronDown size={14} />
            </button>

            <SettingsMenuWithRef
              ref={settingsRef}
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              onEdit={() => setEditOpen(true)}   // dropdown "Edit Profile" opens modal
              onSignOut={handleSignOut}
              onDeleteAccount={handleDeleteAccount}
              isDeleting={deleting}
            />
          </div>

          <div className="header-main">
            <div className="title-row">
              <h1>{name || "NGO"}</h1>
            </div>

            <div className="contact-row">
              {chips}
            </div>


          </div>
        </div>
      </section>

      {/* About */}
      <section className="wrap">
        <div className="card">
          <h2>About</h2>
          <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
            {summary ||
              bio ||
              "Write about the NGO here. Mission, services, and key details for donors."}
          </p>
        </div>
      </section>

      {/* Requests */}
      <section className="wrap">
        <div className="posts-head">
          <h2>Requests</h2>
        </div>
<form
  className="card request-card"
  onSubmit={handleCreateRequest}
  style={{ marginBottom: 16, padding: 0 }}
>
  {/* Header */}
  <div className="request-card__head">
    <div className="request-card__title">
      <Package size={18} />
      <h3>Create a Request</h3>
    </div>
    <p className="request-card__hint">
      Fill the essentials, then refine. You can always edit later.
    </p>
  </div>

  {/* Body */}
  <div className="request-card__body">
    <div className="rq-grid">
      {/* Category */}
      <label className="rq-field">
        <span className="rq-label">Category<span className="rq-req">*</span></span>
        <select
          className="rq-input"
          name="category"
          value={reqForm.category}
          onChange={updateReqField}
        >
          <option value="">Select a category</option>
          {clothingCategories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <span className="rq-help">What type of items are needed?</span>
      </label>

      {/* Count */}
      <label className="rq-field">
        <span className="rq-label">Count<span className="rq-req">*</span></span>
        <input
          className="rq-input"
          name="count"
          type="number"
          min="1"
          value={reqForm.count}
          onChange={updateReqField}
          placeholder="e.g. 50"
        />
        <span className="rq-help">How many items are required?</span>
      </label>

      {/* Gender */}
      <label className="rq-field">
        <span className="rq-label">Gender</span>
        <input
          className="rq-input"
          name="gender"
          value={reqForm.gender}
          onChange={updateReqField}
          placeholder="Women / Men / Unisex / Kids"
        />
      </label>

      {/* Size */}
      <label className="rq-field">
        <span className="rq-label">Size</span>
        <input
          className="rq-input"
          name="size"
          value={reqForm.size}
          onChange={updateReqField}
          placeholder="S–XL / 6–12 yrs"
        />
      </label>

      {/* Status (pill toggle) */}
      <div className="rq-field">
        <span className="rq-label">Status<span className="rq-req">*</span></span>
        <div className="rq-toggle">
          <button
            type="button"
            className={`rq-toggle__btn ${reqForm.status === 'Standard' ? 'is-active' : ''}`}
            onClick={() => updateReqField({ target: { name: 'status', value: 'Standard' } })}
          >
            Standard
          </button>
          <button
            type="button"
            className={`rq-toggle__btn ${reqForm.status === 'Urgent' ? 'is-active' : ''}`}
            onClick={() => updateReqField({ target: { name: 'status', value: 'Urgent' } })}
          >
            Urgent
          </button>
        </div>
        <span className="rq-help">Urgent requests are highlighted for donors.</span>
      </div>

      {/* Needed By */}
      <label className="rq-field">
        <span className="rq-label">Needed By<span className="rq-req">*</span></span>
        <input
          className="rq-input"
          name="dateNeeded"
          type="date"
          value={reqForm.dateNeeded}
          onChange={updateReqField}
          min={todayStr} 
        />
        <span className="rq-help">Deadline helps donors prioritize.</span>
      </label>

      {/* Location + pick on map inline */}
      <div className="rq-field rq-col-2">
        <span className="rq-label">Location<span className="rq-req">*</span></span>
        <div className="rq-inline">
          <input
            className="rq-input"
            name="location"
            value={reqForm.location}
            onChange={updateReqField}
            placeholder="e.g. Beirut"
                onClick={() => setShowMap(true)}
          />

        </div>
        <span className="rq-help">Searchable place name donors will recognize.</span>
      </div>


      {/* Map picker */}
      {showMap && (
        <CoordinatesPicker
          initialCoordinates={
            isValidLatLng(reqForm.coordinates) ? reqForm.coordinates : defaultCenter
          }
          initialLocation={reqForm.location}
          onSave={(coords, name) =>
            setReqForm((prev) => ({
              ...prev,
              coordinates: coords,
              location: name || prev.location,
            }))
          }
          onClose={() => setShowMap(false)}
          markerIcon={requestIcon}
        />
      )}
    </div>
  </div>

  {/* Sticky footer actions */}
  <div className="request-card__footer">
    <button className="btn ghost" type="button" onClick={() =>
      setReqForm({
        category: "", count: "", gender: "", status: "Standard",
        dateNeeded: "", location: "", size: "", ageRange: "",
        coordinates: { lat: null, lng: null }
      })
    }>
      Clear
    </button>
    <button className="btn" type="submit" disabled={creatingReq}>
      {creatingReq ? "Creating…" : "Create Request"}
    </button>
  </div>
</form>

        {/* Requests list — horizontal row */}
        <div className="requests-row">
          {reqLoading && <div className="card"><p>Loading requests…</p></div>}
          {!reqLoading && requests.length === 0 && (
            <div className="card"><p className="muted">No requests yet.</p></div>
          )}
          {!reqLoading && requests.map((r) => (
            <RequestCard key={r.requestId || r.id} req={r} />
          ))}
        </div>
      </section>

      {/* Posts */}
      <section className="wrap">
        <div className="posts-head">
          <h2>Posts</h2>
        </div>

        {/* Create Post */}
        <form className="card" onSubmit={handleCreatePost} style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Create a Post</h3>
          <textarea
            className="signup-input"
            rows={3}
            placeholder="Share an update…"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
            style={{ margin: "8px 0" }}
          />
          <button className="btn" type="submit" disabled={creatingPost}>
            {creatingPost ? "Posting…" : "Post"}
          </button>
        </form>

        <div className="stack">
          {postLoading && (
            <div className="card">
              <p>Loading posts…</p>
            </div>
          )}

          {!postLoading && posts.length === 0 && (
            <div className="card">
              <p className="muted">No posts yet.</p>
            </div>
          )}

          {!postLoading &&
            posts.map((p) => (
              <div key={p.postId || p.id} className="card post">
                <div className="post-top">
                  <div className="post-id">
                    <div className="avatar-sm" />
                    <div className="org">{name || "NGO"}</div>
                  </div>
                  <div className="date">
                    {fmtDateTime(p.createdAt)}
                  </div>
                </div>

                {/* Render text as plain text to avoid XSS */}
                <p className="muted" style={{ whiteSpace: "pre-wrap" }}>{p.text || ""}</p>

                {!!p.images?.length && (
                  <div className="grid">
                    {p.images.map((url, i) => (
                      <div key={i} className="ph">
                        <img
                          src={url}
                          alt={`post-${i}`}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 8,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </section>

      <Footer />

      {/* Edit Profile Modal (opened from dropdown now) */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
