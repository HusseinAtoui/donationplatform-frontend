import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./adminngo.css";

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

function TextInput({ label, name, value, onChange, type = "text", placeholder, min }) {
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
  const [acceptanceFilterRid, setAcceptanceFilterRid] = useState("");

  // Auth + Profile
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

  // Fetchers
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

  // Derived fallback counters from acceptances
  const fallbackByRequest = useMemo(() => {
    const map = new Map();
    for (const a of acceptances) {
      const rid = String(a.requestId ?? a.request?.id ?? a.request?._id ?? a.requestId);
      const v = map.get(rid) || { pledged: 0, received: 0 };
      const qty = Number(a.quantity || 0);
      v.pledged += qty;
      if ((a.status || "").toLowerCase() === "received") v.received += qty;
      map.set(rid, v);
    }
    return map;
  }, [acceptances]);

  // Inventory CRUD
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

  // Acceptances actions
async function markAcceptanceReceived(a) {
  if (!ngo?.id) return;
  const token = localStorage.getItem("token");
  if (!token) return navigate("/login");

  try {
    // Just mark received — backend will also upsert inventory
    const res1 = await fetch(
      `${CONTENT_BASE}/acceptances/${encodeURIComponent(a.id || a._id)}/receive`,
      { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
    );
    const body = await res1.json().catch(() => ({}));
    if (!res1.ok) throw new Error(body.error || "Failed to mark acceptance as received");

    await Promise.all([fetchAcceptances(ngo.id), fetchInventory(ngo.id), fetchRequests(ngo.id)]);
    alert("Marked received and inventory updated.");
  } catch (e) {
    alert(e.message);
  }
}

  async function cancelAcceptance(a) {
    if (!ngo?.id) return;
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    if (!window.confirm("Cancel this acceptance?")) return;

    try {
      const res = await fetch(
        `${CONTENT_BASE}/acceptances/${encodeURIComponent(a.id || a._id)}/cancel`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to cancel acceptance");

      await Promise.all([fetchAcceptances(ngo.id), fetchRequests(ngo.id)]);
    } catch (e) {
      alert(e.message);
    }
  }

  function messageAccepter(a) {
    const type = String(a.accepterType || "").toLowerCase();
    if (type === "ngo") {
      alert("Messaging between NGOs isn’t supported. Ask the donor to accept as a user.");
      return;
    }
    const url = `/messages/start?withUser=${encodeURIComponent(a.accepterId)}&requestId=${encodeURIComponent(
      a.requestId
    )}`;
    navigate(url);
  }

  const filteredAcceptances = useMemo(() => {
    if (!acceptanceFilterRid) return acceptances;
    return acceptances.filter((a) => String(a.requestId) === String(acceptanceFilterRid));
  }, [acceptances, acceptanceFilterRid]);

  if (loading)
    return (
      <div className="admin-wrap">
        <div className="admin-card">
          <p>Loading…</p>
        </div>
      </div>
    );
  if (err)
    return (
      <div className="admin-wrap">
        <div className="admin-card">
          <p style={{ color: "crimson" }}>{err}</p>
        </div>
      </div>
    );
  if (!ngo) return null;

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <h1>{ngo.name || "NGO"} — Inventory Admin</h1>
        <div className="admin-tabs">
          <button
            className={activeTab === "inventory" ? "tab active" : "tab"}
            onClick={() => setActiveTab("inventory")}
          >
            Inventory
          </button>
          <button
            className={activeTab === "requests" ? "tab active" : "tab"}
            onClick={() => setActiveTab("requests")}
          >
            Requests
          </button>
          <button
            className={activeTab === "acceptances" ? "tab active" : "tab"}
            onClick={() => setActiveTab("acceptances")}
          >
            Acceptances
          </button>
        </div>
      </header>

      {/* Inventory Form */}
      {activeTab === "inventory" && (
        <Section title={invForm.id ? "Edit Inventory Item" : "Add Inventory Item"}>
          <form className="grid-form" onSubmit={saveInventory}>
            <TextInput
              label="Category*"
              name="category"
              value={invForm.category}
              onChange={onInvChange}
              placeholder="e.g., Women's Winter Coats"
            />
            <TextInput
              label="Size"
              name="size"
              value={invForm.size}
              onChange={onInvChange}
              placeholder="e.g., S / M / L or 6–12 yrs"
            />
            <TextInput
              label="Gender"
              name="gender"
              value={invForm.gender}
              onChange={onInvChange}
              placeholder="Women / Men / Unisex / Kids"
            />
            <TextInput
              label="Location"
              name="location"
              value={invForm.location}
              onChange={onInvChange}
              placeholder="e.g., Beirut"
            />
            <TextInput
              label="Count*"
              name="count"
              type="number"
              min="0"
              value={invForm.count}
              onChange={onInvChange}
              placeholder="e.g., 50"
            />
            <div className="form-actions">
              <button className="btn" type="submit" disabled={savingInv}>
                {savingInv ? "Saving…" : invForm.id ? "Update Item" : "Add Item"}
              </button>
              {invForm.id && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() =>
                    setInvForm({ id: "", category: "", size: "", gender: "", location: "", count: "" })
                  }
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Section>
      )}

      {/* Inventory Table */}
      {activeTab === "inventory" && (
        <Section title="Current Inventory">
          <div className="table-wrap">
            <table className="table">
<thead>
  <tr>
    <th>Category</th>
    <th>Size</th>
    <th>Gender</th>
    <th>Location</th>
    <th>Requested</th>
    <th>Pledged</th>
    <th>Received</th>
    <th>Open</th>
  </tr>
</thead>
<tbody>
  {inventory.length === 0 && (
    <tr>
      <td colSpan={8} className="muted center">No inventory yet.</td>
    </tr>
  )}
  {inventory.map((row, i) => (
    <tr key={row.id || row._id || i}>
      <td>{row.category || "—"}</td>
      <td>{row.size || "—"}</td>
      <td>{row.gender || "—"}</td>
      <td>{row.location || "—"}</td>
      <td>{row.requested ?? 0}</td>
      <td>{row.pledged ?? 0}</td>
      <td>{row.received ?? 0}</td>
      <td><strong>{row.open ?? 0}</strong></td>
    </tr>
  ))}
</tbody>

            </table>
          </div>
        </Section>
      )}

      {/* Requests */}
      {activeTab === "requests" && (
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={9} className="muted center">
                      No requests yet.
                    </td>
                  </tr>
                )}
                {requests.map((r) => {
                  const rid = String(r.requestId ?? r.id ?? r._id);
                  const total = Number(r.count || 0);
                  const fb = fallbackByRequest.get(rid) || { pledged: 0, received: 0 };
                  const pledged =
                    typeof r.pledgedCount === "number" ? r.pledgedCount : fb.pledged;
                  const received =
                    typeof r.fulfilledCount === "number" ? r.fulfilledCount : fb.received;
                  const remaining = Math.max(total - pledged, 0);
                  const urgent = String(r.status || "").toLowerCase() === "urgent";
                  return (
                    <tr key={rid} className={urgent ? "row-urgent" : ""}>
                      <td>{r.category || "—"}</td>
                      <td>
                        <strong>{total}</strong>
                      </td>
                      <td>{pledged}</td>
                      <td>{received}</td>
                      <td>
                        <strong>{remaining}</strong>
                      </td>
                      <td>{r.status || "Standard"}</td>
                      <td>{r.dateNeeded ? new Date(r.dateNeeded).toLocaleDateString() : "—"}</td>
                      <td>{r.location || "—"}</td>
                      <td className="right">
                        <button
                          className="small"
                          onClick={() => {
                            setAcceptanceFilterRid(rid);
                            setActiveTab("acceptances");
                          }}
                        >
                          View Acceptances
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Acceptances */}
      {activeTab === "acceptances" && (
        <Section
          title="Accepted Donations (In-Transit)"
          right={
            acceptanceFilterRid ? (
              <button className="btn-outline small" onClick={() => setAcceptanceFilterRid("")}>
                Clear Filter
              </button>
            ) : null
          }
        >
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Accepter</th>
                  <th>Type</th>
                  <th>Request</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Handoff</th>
                  <th>Location</th>
                  <th>Accepted At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredAcceptances.length === 0 && (
                  <tr>
                    <td colSpan={10} className="muted center">
                      No acceptances yet.
                    </td>
                  </tr>
                )}
                {filteredAcceptances.map((a) => {
                  const rid = String(a.requestId ?? a.request?.id ?? a.request?._id ?? "—");
                  const status = (a.status || "").toLowerCase();
                  const type = (a.accepterType || a.donorType || "").toLowerCase();
                  const name = a.accepterName || a.donorName || a.donor?.name || "—";
                  return (
                    <tr key={a.id || a._id}>
                      <td>{name}</td>
                      <td className="caps">{type || "user"}</td>
                      <td>{rid}</td>
                      <td>
                        <strong>{a.quantity ?? 0}</strong>
                      </td>
                      <td>{a.status || "accepted"}</td>
                      <td>{a.deliveryMethod || "—"}</td>
                      <td>{a.handoffWindow || "—"}</td>
                      <td>{a.handoffLocation || "—"}</td>
                      <td>{a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}</td>
                      <td className="right">
                        <div className="btn-group">
                          {/* Make Message an outline button */}
                          <button className="btn-outline" onClick={() => messageAccepter(a)}>
                            Message
                          </button>

                          {status !== "received" ? (
                            <>
                              {/* Make Received match Message, with green text/border */}
                              <button
                                className="btn-outline"
                                onClick={() => markAcceptanceReceived(a)}
                              >
                                Received
                              </button>

                              <button className="small danger" onClick={() => cancelAcceptance(a)}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <span className="pill ok">Received</span>
                          )}
                        </div>
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
