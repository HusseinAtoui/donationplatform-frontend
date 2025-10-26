// src/pages/AdminPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './Admin.css';

const API_BASE = ('http://localhost:4000/api').replace(/\/+$/, '');

export default function AdminPage() {
  // keep same state names used by your UI
  const [ngos, setNgos] = useState([]);              // was dummyNGOs
  const [filter, setFilter] = useState("Pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [noteByEmail, setNoteByEmail] = useState({}); // optional note per NGO (used only on Pending)

  const token = localStorage.getItem('token') || '';

  async function fetchJSON(url, opts = {}) {
    const res = await fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    let body = {};
    try { body = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, body };
  }

  // load list based on current tab; preserve your card shape/fields
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        if (filter === 'Pending') {
          // admin-only list
          const { ok, body, status } = await fetchJSON(`${API_BASE}/ngo/admin/ngos/pending`);
          if (!ok) throw new Error(body?.error || `Failed (${status})`);
          if (!mounted) return;
          const items = (body || []).map(x => ({
            id: x.id || x.email,                      // key fallback
            name: x.name,
            email: x.email,
            phone: x.phone || "",
            location: x.location || "",
            coordinates: x.coordinates ? `${x.coordinates.lat ?? ""}, ${x.coordinates.lng ?? ""}` : "",
            inventorySize: x.inventorySize || "",
            requiredClothing: x.requiredClothing || "",
            bio: x.bio || "",
            summary: x.summary || "",
            logo: x.logoUrl || "https://via.placeholder.com/80",
            status: "Pending",
          }));
          setNgos(items);
        } else {
          // list all NGOs then filter by reviewStatus
          const { ok, body, status } = await fetchJSON(`${API_BASE}/ngo/ngos`);
          if (!ok) throw new Error(body?.error || `Failed (${status})`);
          if (!mounted) return;
          const want = filter.toLowerCase(); // approved|rejected
          const items = (body || [])
            .filter(x => (x.reviewStatus || 'pending').toLowerCase() === want)
            .map(x => ({
              id: x.id || x.email,
              name: x.name,
              email: x.email,
              phone: x.phone || "",
              location: x.location || "",
              coordinates: x.coordinates ? `${x.coordinates.lat ?? ""}, ${x.coordinates.lng ?? ""}` : "",
              inventorySize: x.inventorySize || "",
              requiredClothing: x.requiredClothing || "",
              bio: x.bio || "",
              summary: x.summary || "",
              logo: x.logoUrl || "https://via.placeholder.com/80",
              status: filter, // "Approved" or "Rejected"
            }));
          setNgos(items);
        }
      } catch (e) {
        setErr(e.message || 'Failed to load NGOs.');
        setNgos([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // APPROVE / REJECT while keeping your button handlers & UI
  const handleDecision = async (id, decision) => {
    try {
      const ngo = ngos.find(n => n.id === id);
      if (!ngo) return;

      const endpoint =
        decision === "Approved"
          ? `${API_BASE}/ngo/admin/ngos/${encodeURIComponent(ngo.email)}/approve`
          : `${API_BASE}/ngo/admin/ngos/${encodeURIComponent(ngo.email)}/reject`;

      const note = noteByEmail[ngo.email] || '';
      const { ok, body, status } = await fetchJSON(endpoint, {
        method: 'POST',
        body: JSON.stringify({ note })
      });
      if (!ok) throw new Error(body?.error || `Update failed (${status})`);

      // update row locally so UI reacts immediately
      setNgos(prev => prev.map(n => n.id === id ? { ...n, status: decision } : n));
    } catch (e) {
      alert(e.message || 'Failed to update status.');
    }
  };

  // keep your search logic exactly, just run on the loaded list
  const filteredNGOs = useMemo(() => {
    return ngos.filter((ngo) => {
      const matchesStatus = ngo.status === filter;
      const matchesSearch = Object.values(ngo)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [ngos, filter, searchTerm]);

  return (
    <section className="admin-page">
      <h2 className="admin-title">NGO Management</h2>

      {/* Search Bar */}
      <div className="admin-search">
        <input
          type="text"
          placeholder="Search NGOs by name, email, location, etc..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div className="status-filter">
        {["Pending", "Approved", "Rejected"].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? "active" : ""}`}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {err && <div className="notice" style={{ color: 'crimson', marginBottom: 12 }}>{err}</div>}
      {loading && <p className="no-ngos">Loading…</p>}

      {/* NGO Cards */}
      <div className="admin-table">
        {!loading && filteredNGOs.length === 0 ? (
          <p className="no-ngos">No NGOs found in this category.</p>
        ) : (
          filteredNGOs.map((ngo) => (
            <div key={ngo.id} className="ngo-card">
              <div className="ngo-header">
                <img
                  src={ngo.logo}
                  alt={`${ngo.name} logo`}
                  className="ngo-logo"
                />
                <div>
                  <h3 className="ngo-name">{ngo.name}</h3>
                  <span
                    className={`ngo-status ${ngo.status === "Approved"
                      ? "approved"
                      : ngo.status === "Rejected"
                        ? "rejected"
                        : "pending"
                      }`}
                  >
                    {ngo.status}
                  </span>
                </div>
              </div>

              <div className="ngo-details">
                <p><strong>Email:</strong> {ngo.email}</p>
                <p><strong>Phone:</strong> {ngo.phone}</p>
                <p><strong>Location:</strong> {ngo.location}</p>
                <p><strong>Coordinates:</strong> {ngo.coordinates}</p>
                {ngo.inventorySize && (
                  <p><strong>Inventory Size:</strong> {ngo.inventorySize}</p>
                )}
                {ngo.requiredClothing && (
                  <p><strong>Required Clothing:</strong> {ngo.requiredClothing}</p>
                )}
                {ngo.bio && <p><strong>Bio:</strong> {ngo.bio}</p>}
                {ngo.summary && <p><strong>Summary:</strong> {ngo.summary}</p>}
              </div>

              {filter === "Pending" && (
                <div className="ngo-actions">
                  <textarea
                    className="admin-note"
                    placeholder="Optional note (visible in responses)"
                    value={noteByEmail[ngo.email] || ''}
                    onChange={(e) => setNoteByEmail((m) => ({ ...m, [ngo.email]: e.target.value }))}
                  />
                  <button
                    className="approve-btn"
                    onClick={() => handleDecision(ngo.id, "Approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleDecision(ngo.id, "Rejected")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
