// src/pages/NGOPublicProfile/NGOPublicProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import "./NGOPublicProfile.css"; // optional styling

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";
const CONTENT_BASE = `${API_BASE}/home`;

/* --- NEW: shorten/normalize location text --- */
function formatLocationForChip(loc) {
  const s = (typeof loc === 'string' ? loc : (loc?.address || '')).trim();
  if (!s) return '';
  const beforeComma = s.split(',')[0]?.trim();
  let display = beforeComma || s.split(/\s+/)[0] || '';
  if (display.length > 30) display = display.slice(0, 30).trim() + '…';
  return display;
}

// Helper: normalize address to a string (full), and short form for chip
function fullAddr(v) {
  if (!v) return "—";
  if (typeof v === "string") return v;
  return v.address || "—";
}
function shortAddr(v) {
  const out = formatLocationForChip(v);
  return out || "—";
}

function Chip({ icon: Icon, text }) {
  if (!text) return null;
  return (
    <div className="chip">
      <span className="chip-icon"><Icon size={14} /></span>
      <span className="chip-text">{text}</span>
    </div>
  );
}

function RequestCard({ req }) {
  const status = (req.status || "Standard").trim();
  const urgent = status.toLowerCase() === "urgent";
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);

  const metaPieces = [];
  if (req.gender) metaPieces.push(req.gender);
  if (req.size) metaPieces.push(`Size ${req.size}`);
  if (req.ageRange) metaPieces.push(`Age ${req.ageRange}`);
  if (req.dateNeeded)
    metaPieces.push(`Needed by ${new Date(req.dateNeeded).toLocaleDateString()}`);
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
              {/* --- NEW: shortened location here --- */}
              <span>{shortAddr(req.location)}</span>
            </div>
          </div>
        </div>
        <div className="req-count-chip">{req.count ?? 0}</div>
      </div>
      {meta && <div className="req-desc">{meta}</div>}
      <div className={`req-status ${urgent ? "danger" : "ok"}`}>{statusText}</div>
    </div>
  );
}

export default function NGOPublicProfile() {
  const { id } = useParams();
  const [ngo, setNgo] = useState(null);
  const [requests, setRequests] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // Fetch NGO info
        let res = await fetch(`${API_BASE}/ngo/${id}`);
        let ngoData;
        if (res.ok) {
          ngoData = await res.json();
        } else {
          // Fallback to list (if direct endpoint not available)
          const resAll = await fetch(`${API_BASE}/ngo/ngos`);
          if (!resAll.ok) throw new Error("Failed to fetch NGO");
          const all = await resAll.json();
          ngoData = all.find((n) => String(n.id ?? n._id) === String(id));
          if (!ngoData) throw new Error("NGO not found");
        }
        setNgo(ngoData);

        // Fetch NGO posts
        const postRes = await fetch(`${CONTENT_BASE}/posts?ngoId=${encodeURIComponent(id)}`);
        if (postRes.ok) setPosts(await postRes.json());

        // Fetch NGO requests
        const reqRes = await fetch(`${CONTENT_BASE}/requests?ngoId=${encodeURIComponent(id)}`);
        if (reqRes.ok) setRequests(await reqRes.json());

      } catch (e) {
        setErr(e.message || "Failed to load NGO");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="wrap"><p>Loading…</p></div>;
  if (err) return <div className="wrap"><p style={{ color: "crimson" }}>{err}</p></div>;
  if (!ngo) return null;

  return (
    <div className="page">
      {/* Header */}
      <section className="wrap">
        <div className="card header-card">
          <div className="avatar-holder">
            <div className="avatar-lg">
              {ngo.logoUrl ? <img src={ngo.logoUrl} alt="NGO logo" /> : <div className="avatar-placeholder" />}
            </div>
          </div>

          <div className="header-main">
            {/* --- NEW: give name a class to wrap nicely --- */}
            <h1 className="ngo-title">{ngo.name}</h1>
            <div className="contact-row">
              {/* --- NEW: use shortened location in chip --- */}
              <Chip icon={MapPin} text={shortAddr(ngo.location)} />
              <Chip icon={Phone} text={ngo.phone} />
              <Chip icon={Mail} text={ngo.email} />
              <Chip icon={Clock} text={"Mon – Fri: 10AM – 6PM"} />
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="wrap">
        <div className="card">
          <h2>About</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {ngo.summary || ngo.bio || "Information about this NGO is not provided."}
          </p>
        </div>
      </section>

      {/* Requests — FIRST */}
      <section className="wrap">
        <div className="posts-head"><h2>Active Requests</h2></div>
        {requests.length === 0 ? (
          <div className="card"><p className="muted">No requests at the moment.</p></div>
        ) : (
          <div className="requests-row">
            {requests.map((r) => (
              <RequestCard key={r.requestId || r.id} req={r} />
            ))}
          </div>
        )}
      </section>

      {/* Posts — AFTER */}
      <section className="wrap">
        <div className="posts-head"><h2>Posts</h2></div>

        {posts.length === 0 ? (
          <div className="card"><p className="muted">No posts yet.</p></div>
        ) : (
          posts.map((p) => (
            <div key={p.postId || p.id} className="card post">
              <div className="post-header">
                <strong>{ngo.name}</strong>
              </div>

              <p>{p.text}</p>

              {p.images?.length > 0 && (
                <div className="grid">
                  {p.images.map((url, i) => (
                    <div key={i} className="ph">
                      <img
                        src={url}
                        alt={`post-${i}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="post-date" style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
                Posted on {new Date(p.createdAt || Date.now()).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
