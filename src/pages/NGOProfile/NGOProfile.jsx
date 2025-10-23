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
  ChevronDown
} from "lucide-react";
import L from "leaflet";
import { Instagram, Facebook } from "lucide-react";

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
function Avatar({ src, onPick, uploading }) {
  const [fit, setFit] = React.useState("cover"); // default = no gaps

  const handleLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (!w || !h) return;                       // keep "cover" if unknown
    const ratio = w / h;
    // basically square? show it all; otherwise fill the circle
    setFit(ratio > 0.95 && ratio < 1.05 ? "contain" : "cover");
  };

  return (
    <div
      className="avatar-holder"
      style={{
        position: "relative",
        width: "clamp(120px, 18vw, 160px)",
        height: "clamp(120px, 18vw, 160px)",
        borderRadius: "50%",
        padding: "8px",              // ring thickness
        background: "#fff",          // hard white ring so green never shows
        boxSizing: "border-box",
      }}
    >
      <div
        className="avatar-lg"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          overflow: "hidden",
          background: "#fff",        // if PNG has transparency, keep white
          position: "relative",
        }}
      >
        {src ? (
          <img
            src={src}
            alt="NGO avatar"
            onLoad={handleLoad}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: fit,         // "cover" or "contain" chosen at runtime
              objectPosition: "center",
              background: "#fff",
            }}
          />
        ) : (
          <Camera size={28} />
        )}
      </div>

      {/* + button */}
      <button
        type="button"
        className="avatar-add"
        onClick={onPick}
        aria-label="Change NGO picture"
        title={uploading ? "Uploading…" : "Change picture"}
        disabled={uploading}
        style={{
          position: "absolute",
          right: 8,
          bottom: 8,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "#fff",
          border: "2px solid #6eaf86",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 10px 24px rgba(0,0,0,.08)",
        }}
      >
        <Plus size={22} />
      </button>
    </div>
  );
}

function Chip({ icon: Icon, text, title }) {
  if (!text) return null;
  return (
    <div className="chip" title={text}>
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
}) {
  if (!open) return null;
  return (
    <div className="settings-menu card" role="menu" style={{ position: "absolute", right: 0, top: "2.25rem", zIndex: 10, padding: 8, minWidth: 200 }}>
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

/* ------------ Edit Profile Modal ------------ */
function EditProfileModal({ open, onClose, profile, onSave }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    logoUrl: "",
    coordinates: { lat: null, lng: null }
  });
  const [saving, setSaving] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (open && profile) {
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location?.address || profile.location || "",
        summary: profile.summary || profile.bio || "",
        logoUrl: profile.logoUrl || "",
        coordinates: profile.coordinates || { lat: null, lng: null }
      });
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
const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE}/ngo/auth/email/change/request`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  },
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

    const token = localStorage.getItem('token');

const res = await fetch(`${API_BASE}/ngo/auth/email/change/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ code: verifCode.trim() }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Invalid or expired code");
    }

    setEmailVerified(true);
    alert("Email verified! You’ll be signed out to refresh your session.");
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.assign('/login');

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
      await onSave(form);
      onClose();
    } catch (err) {
      alert(err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal card edit-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Edit NGO Profile</h2>
          <button className="icon-btn close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          <div className="form-grid">
            <div>
              <label>Name</label>
              <input name="name" value={form.name} onChange={update} />
            </div>
            <div>
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={update} />
            </div>
            <div>
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={update} />
            </div>
            <div>
              <label>Location</label>
              <input name="location" value={form.location} onChange={update} />
            </div>
            <div>
              <label className="input-label">Coordinates</label>
              <input
                className="signup-input"
                value={
                  form.coordinates?.lat && form.coordinates?.lng
                    ? `${form.coordinates.lat.toFixed(4)}, ${form.coordinates.lng.toFixed(4)}`
                    : ""
                }
                placeholder="Not selected"
              />
              <button
                type="button"
                className="btn"
                style={{ marginTop: 8 }}
                onClick={() => setShowMap(true)}
              >
                Select Coordinates on Map
              </button>
            </div>
            <div className="col-span-2">
              <label>Logo URL</label>
              <input name="logoUrl" value={form.logoUrl} onChange={update} placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <label>Summary / Bio</label>
              <textarea rows={4} name="summary" value={form.summary} onChange={update} placeholder="Mission, activities, impact…" />
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

          {showMap && (
            <CoordinatesPicker
              initialCoordinates={
                isValidLatLng(form.coordinates)
                  ? form.coordinates
                  : defaultCenter
              }
              initialLocation={form.location}
              onSave={(coords, name) =>
                setForm({
                  ...form,
                  coordinates: coords,
                  location: name || form.location,
                })
              }
              onClose={() => setShowMap(false)}
              markerIcon={ngoIcon}
            />
          )}
        </form>
      </div>
    </div>
  );
}function formatLocationForChip(loc) {
  const s = (typeof loc === 'string' ? loc : (loc?.address || '')).trim();
  if (!s) return '';

  // Prefer the chunk before the first comma
  const beforeComma = s.split(',')[0]?.trim();
  let display = beforeComma || s.split(/\s+/)[0] || '';

  // Hard cap in case the first chunk is still super long (rare)
  if (display.length > 30) display = display.slice(0, 30).trim() + '…';
  return display;
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
    if (!newText.trim()) return;

    try {
      setCreatingPost(true);

      const form = new FormData();
      form.append("text", newText);
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

    if (
      !payload.category ||
      !payload.count ||
      !payload.status ||
      !payload.dateNeeded ||
      !payload.location
    ) {
      alert(
        "Please fill the required fields (category, count, status, date, location)."
      );
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
 
      phone: updates.phone?.trim(),
      location: updates.location?.trim(),
      summary: updates.summary ?? "",
      logoUrl: updates.logoUrl?.trim(),
      coordinates: updates.coordinates ?? null,
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

  // close settings when clicking outside (simple capture)
  useEffect(() => {
    function onDocClick(e) {
      const btn = document.querySelector(".Settings");
      const menu = document.querySelector(".settings-menu");
      if (!btn || !menu) return;
      const clickedInside = btn.contains(e.target) || menu.contains(e.target);
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

  const { name, email, phone, location, logoUrl, bio, summary } = profile;
  const avatar = avatarSrc || logoUrl || null;

  // ---- FIX: always render a string for location ----
  // ---- FIX: always render a trimmed string for location (profile only) ----
const rawLocation =
  typeof location === "string" ? location : (location?.address || "");
const displayLocation = formatLocationForChip(rawLocation);


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

            <SettingsMenu
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
              <Chip icon={MapPin} text={displayLocation} />
              <Chip icon={Phone} text={phone} />
              <Chip icon={Mail} text={email} />
              <Chip icon={Clock} text={"Mon – Fri: 10AM – 6PM"} />
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
      <section className="wrap">
  <div className="card">
    <h2>Contact & Hours</h2>
    <div className="contact-info" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {workingHours && (
        <p>
          <Clock size={16} style={{ marginRight: 8 }} />
          <strong>Working Hours:</strong> {workingHours}
        </p>
      )}
      {social?.website && (
        <p>
          <Globe size={16} style={{ marginRight: 8 }} />
          <a href={social.website.startsWith('http') ? social.website : `https://${social.website}`}
             target="_blank" rel="noreferrer">
            {social.website.replace(/^https?:\/\//, '')}
          </a>
        </p>
      )}
      {social?.instagram && (
        <p>
          <Instagram size={16} style={{ marginRight: 8 }} />
          <a href={social.instagram.startsWith('http')
            ? social.instagram
            : `https://instagram.com/${social.instagram.replace(/^@/, '')}`}
            target="_blank" rel="noreferrer">
            @{social.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/^@/, '')}
          </a>
        </p>
      )}
      {social?.facebook && (
        <p>
          <Facebook size={16} style={{ marginRight: 8 }} />
          <a href={social.facebook.startsWith('http') ? social.facebook : `https://${social.facebook}`}
             target="_blank" rel="noreferrer">
            {social.facebook.replace(/^https?:\/\//, '')}
          </a>
        </p>
      )}
    </div>
  </div>
</section>


      {/* Requests */}
      <section className="wrap">
        <div className="posts-head">
          <h2>Requests</h2>
        </div>

        {/* Create Request */}
        <form
          className="card create-request-card"
          onSubmit={handleCreateRequest}
          style={{ marginBottom: 16 }}
        >
          <h3 style={{ marginBottom: 8 }}>
            <Package size={18} style={{ verticalAlign: "text-bottom" }} /> Create a Request
          </h3>

          <div className="grid-two">
            <div>
              <label className="input-label">Category*</label>
              <select
                className="signup-input"
                name="category"
                value={reqForm.category}
                onChange={updateReqField}
              >
                <option value="">Select a category</option>
                {clothingCategories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">Count*</label>
              <input
                className="signup-input"
                name="count"
                type="number"
                min="1"
                value={reqForm.count}
                onChange={updateReqField}
                placeholder="e.g. 50"
              />
            </div>

            <div>
              <label className="input-label">Gender</label>
              <input
                className="signup-input"
                name="gender"
                value={reqForm.gender}
                onChange={updateReqField}
                placeholder="e.g. Women / Men / Unisex / Kids"
              />
            </div>

            <div>
              <label className="input-label">Status*</label>
              <select
                className="signup-input"
                name="status"
                value={reqForm.status}
                onChange={updateReqField}
              >
                <option>Standard</option>
                <option>Urgent</option>
              </select>
            </div>

            <div>
              <label className="input-label">Needed By*</label>
              <input
                className="signup-input"
                name="dateNeeded"
                type="date"
                value={reqForm.dateNeeded}
                onChange={updateReqField}
              />
            </div>

            <div>
              <label className="input-label">Location*</label>
              <input
                className="signup-input"
                name="location"
                value={reqForm.location}
                onChange={updateReqField}
                placeholder="e.g. Beirut"
              />
            </div>

            <div>
              <label className="input-label">Coordinates</label>
              <input
                className="signup-input"
                value={
                  reqForm.coordinates?.lat && reqForm.coordinates?.lng
                    ? `${reqForm.coordinates.lat.toFixed(4)}, ${reqForm.coordinates.lng.toFixed(4)}`
                    : ""
                }
                placeholder="Not selected"
              />
              <button
                type="button"
                className="btn"
                style={{ marginTop: 8 }}
                onClick={() => setShowMap(true)}
              >
                Select Coordinates on Map
              </button>
            </div>

            <div>
              <label className="input-label">Size</label>
              <input
                className="signup-input"
                name="size"
                value={reqForm.size}
                onChange={updateReqField}
                placeholder="e.g. S-XL / 6-12 yrs"
              />
            </div>

            <div>
              <label className="input-label">Age Range</label>
              <input
                className="signup-input"
                name="ageRange"
                value={reqForm.ageRange}
                onChange={updateReqField}
                placeholder="e.g. 6-12"
              />
            </div>

            {showMap && (
              <CoordinatesPicker
                initialCoordinates={
                  isValidLatLng(reqForm.coordinates)
                    ? reqForm.coordinates
                    : defaultCenter
                }
                initialLocation={reqForm.location}
                onSave={(coords, name) =>
                  setReqForm({
                    ...reqForm,
                    coordinates: coords,
                    location: name || reqForm.location,
                  })
                }
                onClose={() => setShowMap(false)}
                markerIcon={requestIcon}
              />
            )}
          </div>

          <button className="btn" type="submit" disabled={creatingReq}>
            {creatingReq ? "Creating…" : "Create Request"}
          </button>
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
                    {new Date(p.createdAt || Date.now()).toLocaleString()}
                  </div>
                </div>

                <p className="muted">{p.text}</p>

                {!!p.images?.length && (
                  <div className="grid">
                    {p.images.map((url, i) => (
                      <div key={i} className="ph">
                        <img
                          src={url}
                          alt={`post-${i}`}
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
