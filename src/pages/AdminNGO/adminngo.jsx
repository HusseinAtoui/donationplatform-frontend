// src/pages/NGOInventoryAdmin/NGOInventoryAdmin.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
 import './adminngo.css'; // if the CSS file is in the same folder

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";
const CONTENT_BASE = `${API_BASE}/home`; // matches your existing mount

function Section({ title, right, children }) {
  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>{title}</h2>
        <div>{right}</div>
      </div>
      <div className="admin-card">{children}</div>
    </section>
  );
}

function TextInput({ label, name, value, onChange, type="text", placeholder, min }) {
  return (
    <label className="fi">
      <span>{label}</span>
      <input
        className="fi-input"
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        min={min}
      />
    </label>
  );
}

function Select({ label, name, value, onChange, children }) {
  return (
    <label className="fi">
      <span>{label}</span>
      <select className="fi-input" name={name} value={value} onChange={onChange}>
        {children}
      </select>
    </label>
  );
}

export default function AdminNGO() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ngo, setNgo] = useState(null);

  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [acceptances, setAcceptances] = useState([]);

  const [invForm, setInvForm] = useState({
    id: "",
    category: "",
    size: "",
    gender: "",
    location: "",
    count: "",
  });
  const [savingInv, setSavingInv] = useState(false);

  const [activeTab, setActiveTab] = useState("inventory"); // 'inventory' | 'requests' | 'acceptances'

  // ---------------------------
  // Auth + Profile
  // ---------------------------
  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);
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
          throw new Error(body.error || "Failed to load NGO profile");
        }
        const data = await res.json();
        setNgo(data.profile);
      } catch (e) {
        setErr(e.message || "Error loading profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // ---------------------------
  // Fetchers
  // ---------------------------
  const fetchInventory = useCallback(async (ngoId) => {
    try {
      const res = await fetch(`${CONTENT_BASE}/inventory?ngoId=${encodeURIComponent(ngoId)}`);
      if (!res.ok) throw new Error("Failed to load inventory");
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setInventory([]);
    }
  }, []);

  const fetchRequests = useCallback(async (ngoId) => {
    try {
      const res = await fetch(`${CONTENT_BASE}/requests?ngoId=${encodeURIComponent(ngoId)}`);
      if (!res.ok) throw new Error("Failed to load requests");
      const data = await res.json();
      data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRequests(data);
    } catch (e) {
      console.error(e);
      setRequests([]);
    }
  }, []);

  const fetchAcceptances = useCallback(async (ngoId) => {
    try {
      const res = await fetch(`${CONTENT_BASE}/acceptances?ngoId=${encodeURIComponent(ngoId)}`);
      if (!res.ok) throw new Error("Failed to load acceptances");
      const data = await res.json();
      data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setAcceptances(data);
    } catch (e) {
      console.error(e);
      setAcceptances([]);
    }
  }, []);

  // When NGO ready, load all
  useEffect(() => {
    if (!ngo?.id) return;
    fetchInventory(ngo.id);
    fetchRequests(ngo.id);
    fetchAcceptances(ngo.id);
  }, [ngo?.id, fetchInventory, fetchRequests, fetchAcceptances]);

  // ---------------------------
  // Derived: pledges per Request
  // acceptances entries: { id, requestId, donorName, quantity, status }
  // ---------------------------
  const pledgeByRequest = useMemo(() => {
    const map = new Map();
    for (const a of acceptances) {
      const rid = String(a.requestId ?? a.request?.id ?? a.request?._id ?? a.requestId);
      const v = map.get(rid) || { pledged: 0, received: 0 };
      const qty = Number(a.quantity || 0);
      v.pledged += qty;
      if (String(a.status || "").toLowerCase() === "received") v.received += qty;
      map.set(rid, v);
    }
    return map;
  }, [acceptances]);

  // ---------------------------
  // Inventory CRUD
  // ---------------------------
  function onInvChange(e) {
    const { name, value } = e.target;
    setInvForm((s) => ({ ...s, [name]: value }));
  }

  async function saveInventory(e) {
    e.preventDefault();
    if (!ngo?.id) return;
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    const payload = {
      ngoId: ngo.id,
      category: invForm.category.trim(),
      size: invForm.size.trim(),
      gender: invForm.gender.trim(),
      location: invForm.location.trim(),
      count: Number(invForm.count || 0),
    };

    if (!payload.category || !payload.count) {
      alert("Category and count are required.");
      return;
    }

    try {
      setSavingInv(true);
      const isUpdate = !!invForm.id;
      const url = isUpdate
        ? `${CONTENT_BASE}/inventory/${encodeURIComponent(invForm.id)}`
        : `${CONTENT_BASE}/inventory`;
      const method = isUpdate ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save inventory");
      }

      setInvForm({ id: "", category: "", size: "", gender: "", location: "", count: "" });
      await fetchInventory(ngo.id);
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingInv(false);
    }
  }

  function editInventoryRow(row) {
    setInvForm({
      id: row.id || row._id || "",
      category: row.category || "",
      size: row.size || "",
      gender: row.gender || "",
      location: row.location || "",
      count: String(row.count ?? 0),
    });
    setActiveTab("inventory");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteInventoryRow(row) {
    if (!ngo?.id) return;
  if (!window.confirm("Delete this inventory item?")) return;

    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      const id = row.id || row._id;
      const res = await fetch(`${CONTENT_BASE}/inventory/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete inventory item");
      }
      await fetchInventory(ngo.id);
    } catch (e) {
      alert(e.message);
    }
  }

  // ---------------------------
  // Acceptances → Mark Received (moves into inventory)
  // ---------------------------
  async function markAcceptanceReceived(a) {
    if (!ngo?.id) return;
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    // Optional: attach minimal categorization from the linked request
    const req = requests.find(
      r => String(r.requestId ?? r.id ?? r._id) === String(a.requestId ?? a.request?.id ?? a.request?._id)
    );

    try {
      // 1) Mark acceptance received
      const res1 = await fetch(`${CONTENT_BASE}/acceptances/${encodeURIComponent(a.id || a._id)}/receive`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res1.ok) {
        const body = await res1.json().catch(() => ({}));
        throw new Error(body.error || "Failed to mark acceptance as received");
      }

      // 2) Upsert into inventory (+quantity)
      const invPayload = {
        ngoId: ngo.id,
        category: req?.category || "General",
        size: req?.size || "",
        gender: req?.gender || "",
        location: req?.location || ngo.location || "",
        delta: Number(a.quantity || 0), // server can treat 'delta' as increment
      };
      const res2 = await fetch(`${CONTENT_BASE}/inventory`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invPayload),
      });
      if (!res2.ok) {
        const body = await res2.json().catch(() => ({}));
        throw new Error(body.error || "Failed to add items to inventory");
      }

      await Promise.all([fetchAcceptances(ngo.id), fetchInventory(ngo.id)]);
      alert("Marked received and inventory updated.");
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) return <div className="admin-wrap"><div className="admin-card"><p>Loading…</p></div></div>;
  if (err) return <div className="admin-wrap"><div className="admin-card"><p style={{color:"crimson"}}>{err}</p></div></div>;
  if (!ngo) return null;

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <h1>{ngo.name || "NGO"} — Inventory Admin</h1>
        <div className="admin-tabs">
          <button className={activeTab==="inventory"?"tab active":"tab"} onClick={() => setActiveTab("inventory")}>Inventory</button>
          <button className={activeTab==="requests"?"tab active":"tab"} onClick={() => setActiveTab("requests")}>Requests</button>
          <button className={activeTab==="acceptances"?"tab active":"tab"} onClick={() => setActiveTab("acceptances")}>Acceptances</button>
        </div>
      </header>

      {/* Inventory Form */}
      {activeTab==="inventory" && (
        <Section title={invForm.id ? "Edit Inventory Item" : "Add Inventory Item"}>
          <form className="grid-form" onSubmit={saveInventory}>
            <TextInput label="Category*" name="category" value={invForm.category} onChange={onInvChange} placeholder="e.g., Women's Winter Coats" />
            <TextInput label="Size" name="size" value={invForm.size} onChange={onInvChange} placeholder="e.g., S / M / L or 6–12 yrs" />
            <TextInput label="Gender" name="gender" value={invForm.gender} onChange={onInvChange} placeholder="Women / Men / Unisex / Kids" />
            <TextInput label="Location" name="location" value={invForm.location} onChange={onInvChange} placeholder="e.g., Beirut" />
            <TextInput label="Count*" name="count" type="number" min="0" value={invForm.count} onChange={onInvChange} placeholder="e.g., 50" />
            <div className="form-actions">
              <button className="btn" type="submit" disabled={savingInv}>{savingInv ? "Saving…" : (invForm.id ? "Update Item" : "Add Item")}</button>
              {invForm.id && (
                <button type="button" className="btn-outline" onClick={() => setInvForm({ id:"", category:"", size:"", gender:"", location:"", count:"" })}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Section>
      )}

      {/* Inventory Table */}
      {activeTab==="inventory" && (
        <Section title="Current Inventory">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Size</th>
                  <th>Gender</th>
                  <th>Location</th>
                  <th>Count</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 && (
                  <tr><td colSpan={7} className="muted center">No inventory yet.</td></tr>
                )}
                {inventory.map((row) => (
                  <tr key={row.id || row._id}>
                    <td>{row.category || "—"}</td>
                    <td>{row.size || "—"}</td>
                    <td>{row.gender || "—"}</td>
                    <td>{row.location || "—"}</td>
                    <td><strong>{row.count ?? 0}</strong></td>
                    <td>{row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—"}</td>
                    <td className="right">
                      <button className="small" onClick={() => editInventoryRow(row)}>Edit</button>
                      <button className="small danger" onClick={() => deleteInventoryRow(row)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Requests */}
      {activeTab==="requests" && (
        <Section title="Requests Overview">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Count</th>
                  <th>Pledged</th>
                  <th>Received</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Needed By</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 && (
                  <tr><td colSpan={8} className="muted center">No requests yet.</td></tr>
                )}
                {requests.map((r) => {
                  const rid = String(r.requestId ?? r.id ?? r._id);
                  const pledges = pledgeByRequest.get(rid) || { pledged: 0, received: 0 };
                  const total = Number(r.count || 0);
                  const remaining = Math.max(total - pledges.pledged, 0);
                  const urgent = String(r.status || "").toLowerCase() === "urgent";
                  return (
                    <tr key={rid} className={urgent ? "row-urgent": ""}>
                      <td>{r.category || "—"}</td>
                      <td><strong>{total}</strong></td>
                      <td>{pledges.pledged}</td>
                      <td>{pledges.received}</td>
                      <td><strong>{remaining}</strong></td>
                      <td>{r.status || "Standard"}</td>
                      <td>{r.dateNeeded ? new Date(r.dateNeeded).toLocaleDateString() : "—"}</td>
                      <td>{r.location || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Acceptances */}
      {activeTab==="acceptances" && (
        <Section title="Accepted Donations (In-Transit)">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Request</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Accepted At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {acceptances.length === 0 && (
                  <tr><td colSpan={6} className="muted center">No acceptances yet.</td></tr>
                )}
                {acceptances.map((a) => {
                  const rid = String(a.requestId ?? a.request?.id ?? a.request?._id ?? "—");
                  const status = (a.status || "").toLowerCase();
                  return (
                    <tr key={a.id || a._id}>
                      <td>{a.donorName || a.donor?.name || "—"}</td>
                      <td>{rid}</td>
                      <td><strong>{a.quantity ?? 0}</strong></td>
                      <td>{a.status || "accepted"}</td>
                      <td>{a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}</td>
                      <td className="right">
                        {status !== "received" ? (
                          <button className="small" onClick={() => markAcceptanceReceived(a)}>Mark Received → Inventory</button>
                        ) : (
                          <span className="pill ok">Received</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}
