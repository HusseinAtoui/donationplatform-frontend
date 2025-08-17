// src/pages/DonorProfile/DonorProfile.jsx
import React, { useRef, useState, useEffect } from "react";
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
  UserRound
} from "lucide-react";

// CRA env style; set REACT_APP_API_BASE=http://localhost:4000 (no trailing slash) in frontend .env
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";

export default function DonorProfile() {
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState(null);

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
          setErr("Not authenticated. Please log in.");
          // optional: window.location.href = "/login";
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          setErr("Your session expired or you do not have access. Please log in.");
          // optional: window.location.href = "/login";
          setLoading(false);
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Failed to load profile (HTTP ${res.status}).`);
        }

        const data = await res.json(); // { profile: { ... } }
        setProfile(data.profile || null);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derived display values
  const name = profile?.name || "Donor Name";
  const email = profile?.email || "donor@example.com";
  const phone = profile?.phone || "+961 71 234 567";
  const address = profile?.location || "Beirut, Lebanon";
  const bio = profile?.bio || "Brief bio about the donor. What they care about, preferred donation types, and any relevant notes for NGOs coordinating pickups.";
  const createdAt = profile?.createdAt ? new Date(profile.createdAt) : null;
  const memberSince = createdAt
    ? createdAt.toLocaleString(undefined, { month: "short", year: "numeric" })
    : "—";
  const availability = "Weekdays after 5 PM"; // adjust when you add this to profile
  const serverAvatar = profile?.avatarUrl || null;
  const shownAvatar = avatarSrc || serverAvatar;

  return (
    <main className="page">
      <section className="wrap">
        <div className="cover" />

        <div className="card header-card">
          {/* Avatar */}
          <div className="avatar-holder">
            <div className="avatar-lg">
              {shownAvatar ? (
                <img src={shownAvatar} alt="Donor avatar" />
              ) : (
                <Camera size={28} />
              )}
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
          <div className="header-actions">
            <button className="EDITbtn">Edit</button>
            <button className="Settings" aria-label="settings">
              <Settings size={18} />
            </button>
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

        {/* Loading / Error */}
        {loading && (
          <div className="card">
            <p className="muted">Loading profile…</p>
          </div>
        )}
        {err && !loading && (
          <div className="card">
            <p className="error-text">{err}</p>
          </div>
        )}
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
          <h3 className="section-title"><Heart /> Donation Preferences</h3>
          <div className="tags">
            <span className="tag">Clothing</span>
            <span className="tag">Food</span>
            <span className="tag">Hygiene Kits</span>
            <span className="tag">Children</span>
            <span className="tag">Winter Items</span>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title"><UserRound /> Profile Details</h3>
          <ul className="kv-list">
            <li><span>Member Since</span><strong>{memberSince}</strong></li>
            <li><span>Preferred Contact</span><strong>Email</strong></li>
            <li><span>Pickup Radius</span><strong>Up to 10 km</strong></li>
            <li><span>Languages</span><strong>Arabic, English</strong></li>
          </ul>
        </div>
      </section>

      {/* Notes */}
      <section className="wrap">
        <div className="card">
          <h3 className="section-title"><Gift /> Notes</h3>
          <p className="muted">
            Add any special instructions here (e.g., building access, preferred pickup times).
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Chip({ icon: Icon, text }) {
  return (
    <div className="chip">
      <span className="chip-icon"><Icon size={14} /></span>
      <span className="chip-text">{text}</span>
    </div>
  );
}
