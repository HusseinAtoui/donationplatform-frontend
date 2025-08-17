// src/pages/NGOProfile/NGOProfile.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NGOProfile.css";
import Footer from "../../components/Footer/Footer";
import { Plus, Settings, MapPin, Phone, Mail, Clock, Camera } from "lucide-react";

const API_BASE = "http://localhost:4000/api";

function Chip({ icon: Icon, text }) {
  if (!text) return null;
  return (
    <div className="chip">
      <span className="chip-icon"><Icon size={14} /></span>
      <span className="chip-text">{text}</span>
    </div>
  );
}

export default function NGOProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState(null);

  // avatar preview (local only)
  const [avatarSrc, setAvatarSrc] = useState(null);
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

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setErr("");

        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await fetch(`${API_BASE}/ngo/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load profile");
        }

        const data = await res.json(); // { profile: { ... } }
        setProfile(data.profile);
      } catch (e) {
        setErr(e.message || "Error loading profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="page">
        <section className="wrap">
          <div className="card"><p>Loading profile…</p></div>
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
            <button className="btn" onClick={() => navigate("/login")}>Go to Login</button>
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
  } = profile;

  const avatar = avatarSrc || logoUrl || null;

  // Local-only demo posts (static)
  const posts = [
    { id: 1, org: name, date: "2025-08-10", description: "description………………", images: ["#", "#", "#"] },
    { id: 2, org: name, date: "2025-08-01", description: "description………………", images: ["#", "#"] },
  ];

  return (
    <div className="page">
      {/* Cover */}
      <section className="wrap">
        <div className="cover" />

        {/* Header card */}
        <div className="card header-card">
          <div className="avatar-holder">
            <div className="avatar-lg">
              {avatar ? <img src={avatar} alt="NGO avatar" /> : <Camera size={28} />}
            </div>

            {/* Local preview only */}
            <button
              type="button"
              className="avatar-add"
              onClick={pickFile}
              aria-label="Change NGO picture"
              title="Change picture"
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

          <div className="header-actions">
            <button className="EDITbtn" onClick={() => alert("Edit profile not wired yet")}>Edit</button>
            <button className="Settings" aria-label="settings" onClick={() => alert("Settings not wired yet")}>
              <Settings size={16} />
            </button>
          </div>

          <div className="header-main">
            <div className="title-row">
              <h1>{name || "NGO"}</h1>
            </div>

            <div className="contact-row">
              <Chip icon={MapPin} text={location} />
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
            {summary || bio || "Write about the NGO here. Mission, services, and key details for donors."}
          </p>
        </div>
      </section>

      {/* Posts (static demo) */}
      <section className="wrap">
        <div className="posts-head">
          <h2>Posts</h2>
          <button className="btn" onClick={() => alert("Add Post UI not wired yet")}>
            Add Post <Plus size={16} style={{ marginLeft: 6 }} />
          </button>
        </div>

        <div className="stack">
          {posts.map((p) => (
            <div key={p.id} className="card post">
              <div className="post-top">
                <div className="post-id">
                  <div className="avatar-sm" />
                  <div className="org">{p.org || name || "NGO"}</div>
                </div>
                <div className="date">{p.date}</div>
              </div>

              <p className="muted">{p.description}</p>

              <div className="grid">
                {p.images.map((_, i) => <div key={i} className="ph" />)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
