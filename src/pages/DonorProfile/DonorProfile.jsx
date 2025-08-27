// src/pages/DonorProfile/DonorProfile.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./DonorProfile.css";
import Footer from "../../components/Footer/Footer";
import {
  Plus,
  Settings,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Camera,
  Heart,
  Gift,
  UserRound,
  LogOut,
  Trash2,
  Pencil,
  ChevronDown,
} from "lucide-react";

// CRA env style; set REACT_APP_API_BASE=http://localhost:4000 (no trailing slash) in frontend .env
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";

/* ------------ Small Chip component (kept) ------------ */
function Chip({ icon: Icon, text }) {
  if (!text) return null;
  return (
    <div className="chip">
      <span className="chip-icon">
        <Icon size={14} />
      </span>
      <span className="chip-text">{text}</span>
    </div>
  );
}

/* ------------ Settings Dropdown (mirrors NGO) ------------ */
function SettingsMenu({
  open,
  onClose,
  onEdit,
  onSignOut,
  onDeleteAccount,
  isDeleting = false,
}) {
  if (!open) return null;
  return (
    <div
      className="settings-menu card"
      role="menu"
      style={{
        position: "absolute",
        right: 0,
        top: "2.25rem",
        zIndex: 10,
        padding: 8,
        minWidth: 200,
      }}
    >
      <button
        className="menu-item"
        onClick={() => {
          onEdit();
          onClose();
        }}
      >
        <Pencil size={16} style={{ marginRight: 8 }} /> Edit Profile
      </button>
      <button
        className="menu-item"
        onClick={() => {
          onSignOut();
          onClose();
        }}
      >
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
        <Trash2 size={16} style={{ marginRight: 8 }} />{" "}
        {isDeleting ? "Deleting…" : "Delete Account"}
      </button>
    </div>
  );
}

/* ------------ Edit Profile Modal (donor) ------------ */
function EditProfileModal({ open, onClose, profile, onSave }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    avatarUrl: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && profile) {
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location:
          (typeof profile.location === "string"
            ? profile.location
            : profile.location?.address) || "",
        avatarUrl: profile.avatarUrl || "",
        bio: profile.bio || "",
      });
    }
  }, [open, profile]);

  function update(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
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
        /* Make this a positioning context for the close button */
        style={{ position: "relative" }}
      >
        {/* Small close "X" pinned to the upper-right of the modal/tab */}
        <button
          aria-label="Close"
          title="Close"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: 9999,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            lineHeight: 1,
            fontSize: 16,
            display: "grid",
            placeItems: "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          ✕
        </button>

        <div className="modal-header" style={{ paddingRight: 36 }}>
          <h2>Edit Donor Profile</h2>
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
            <div className="col-span-2">
              <label>Avatar URL</label>
              <input
                name="avatarUrl"
                value={form.avatarUrl}
                onChange={update}
                placeholder="https://..."
              />
            </div>
            <div className="col-span-2">
              <label>Bio</label>
              <textarea
                rows={4}
                name="bio"
                value={form.bio}
                onChange={update}
                placeholder="What you care about, preferred donation types…"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DonorProfile() {
  const navigate = useNavigate();

  const [avatarSrc, setAvatarSrc] = useState(null); // local preview (blob URL)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState(null);

  // settings & modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileRef = useRef(null);
  const pickFile = () => fileRef.current?.click();

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setAvatarSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
    e.target.value = "";
  };

  // Revoke any blob URL on unmount or when it changes
  useEffect(() => {
    return () => {
      if (avatarSrc?.startsWith("blob:")) URL.revokeObjectURL(avatarSrc);
    };
  }, [avatarSrc]);

  // Fetch donor profile
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await fetch(`${API_BASE}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/login");
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data?.error || `Failed to load profile (HTTP ${res.status}).`
          );
        }

        const data = await res.json(); // { profile: { ... } }
        setProfile(data.profile || null);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

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

  // ---- Settings actions ----
  function handleSignOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  }

  async function handleDeleteAccount() {
    const sure = window.confirm("Delete account? This action cannot be undone.");
    if (!sure) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`${API_BASE}/api/user/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete account");
      }
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      navigate("/signup");
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
      avatarUrl: updates.avatarUrl?.trim(),
      bio: updates.bio ?? "",
    };

    const res = await fetch(`${API_BASE}/api/user/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 202) {
      alert(
        "We sent a verification link to your new email. Please confirm it to finish updating your account email."
      );
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to update profile");
    }

    const data = await res.json(); // assume { profile: {...} } or updated fields
    setProfile((p) => ({ ...p, ...(data.profile || payload) }));
  }

  // Derived display values with sensible fallbacks
  const name = profile?.name || "Donor Name";
  const email = profile?.email || "donor@example.com";
  const phone = profile?.phone || "+961 71 234 567";
  const address =
    (typeof profile?.location === "string"
      ? profile?.location
      : profile?.location?.address) || "Beirut, Lebanon";
  const bio =
    profile?.bio ||
    "Brief bio about the donor. What they care about, preferred donation types, and any relevant notes for NGOs coordinating pickups.";
  const createdAt = profile?.createdAt ? new Date(profile.createdAt) : null;
  const memberSince = createdAt
    ? createdAt.toLocaleString(undefined, { month: "short", year: "numeric" })
    : "—";
  const availability = "Weekdays after 5 PM"; // adjust when you add this to profile
  const serverAvatar = profile?.avatarUrl || null;
  const shownAvatar = avatarSrc || serverAvatar;

  if (loading) {
    return (
      <div className="page">
        <section className="wrap">
          <div className="card">
            <p className="muted">Loading profile…</p>
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
            <p className="error-text">{err}</p>
            <button className="btn" onClick={() => navigate("/login")}>
              Go to Login
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <main className="page">
      <section className="wrap">
        <div className="cover" />

        <div className="card header-card" style={{ position: "relative" }}>
          {/* Avatar */}
          <div className="avatar-holder">
            <div className="avatar-lg">
              {shownAvatar ? <img src={shownAvatar} alt="Donor avatar" /> : <Camera size={28} />}
            </div>

            <button
              type="button"
              className="avatar-add"
              onClick={pickFile}
              aria-label="Change photo"
              title="Change photo"
            >
              <Plus strokeWidth={3} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={onAvatarChange}
            />
          </div>

          {/* Actions (top-right) */}
          <div className="header-actions" style={{ position: "relative" }}>
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
              onEdit={() => setEditOpen(true)}
              onSignOut={handleSignOut}
              onDeleteAccount={handleDeleteAccount}
              isDeleting={deleting}
            />
          </div>

          {/* Header main */}
          <div className="header-main">
            <div className="title-row">
              <h1>{name}</h1>
            </div>

            <div className="contact-row">
              <Chip icon={MapPin} text={address} />
              <Chip icon={Phone} text={phone} />
              <Chip icon={Mail} text={email} />
              <Chip icon={Calendar} text={availability} />
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="wrap">
        <div className="card">
          <h2>About</h2>
          <p className="muted">{bio}</p>
        </div>
      </section>

      {/* Preferences & Details */}
      <section className="wrap two-col">
        <div className="card">
          <h3 className="section-title">
            <Heart /> Donation Preferences
          </h3>
          <div className="tags">
            <span className="tag">Clothing</span>
            <span className="tag">Food</span>
            <span className="tag">Hygiene Kits</span>
            <span className="tag">Children</span>
            <span className="tag">Winter Items</span>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">
            <UserRound /> Profile Details
          </h3>
          <ul className="kv-list">
            <li>
              <span>Member Since</span>
              <strong>{memberSince}</strong>
            </li>
            <li>
              <span>Preferred Contact</span>
              <strong>Email</strong>
            </li>
            <li>
              <span>Pickup Radius</span>
              <strong>Up to 10 km</strong>
            </li>
            <li>
              <span>Languages</span>
              <strong>Arabic, English</strong>
            </li>
          </ul>
        </div>
      </section>

      {/* Notes */}
      <section className="wrap">
        <div className="card">
          <h3 className="section-title">
            <Gift /> Notes
          </h3>
          <p className="muted">
            Add any special instructions here (e.g., building access, preferred pickup times).
          </p>
        </div>
      </section>

      <Footer />

      {/* Edit Profile Modal (opened from dropdown) */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </main>
  );
}
