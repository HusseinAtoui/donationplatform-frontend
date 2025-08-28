import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DonationRequestCard from '../../components/DonationRequestCard/DonationRequestCard';
import './Donations.css';

const urgencyOptions = ['All', 'Urgent', 'Standard'];

function extractLocationString(loc) {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    // supports { address, coordinates: { lat, lng } }
    if (loc.address) return loc.address;
    const { coordinates } = loc || {};
    if (coordinates && (coordinates.lat || coordinates.lng)) {
      return `${coordinates.lat ?? ''}, ${coordinates.lng ?? ''}`.trim();
    }
  }
  return '';
}

function AcceptPledgeModal({ open, onClose, onSubmit, request, ngo }) {
  const [quantity, setQuantity] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('dropoff'); // dropoff | pickup | shipping
  const [handoffWindow, setHandoffWindow] = useState('');
  const [handoffLocation, setHandoffLocation] = useState(
    extractLocationString(request?.location) || extractLocationString(ngo?.location) || ''
  );
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const qtyRef = useRef(null);

  // lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuantity('');
      setDeliveryMethod('dropoff');
      setHandoffWindow('');
      setHandoffLocation(
        extractLocationString(request?.location) || extractLocationString(ngo?.location) || ''
      );
      setNote('');
      setBusy(false);
      setErr('');
      // focus first field
      setTimeout(() => qtyRef.current?.focus(), 0);
    }
  }, [open, request, ngo]);

  function onBackdrop(e) {
    if (busy) return; // don’t close while submitting
    if (e.target.classList.contains('modal-backdrop')) onClose();
  }

  function onKeyDown(e) {
    if (busy) return;
    if (e.key === 'Escape') onClose();
  }

  if (!open || !request) return null;

  const total = Number(request.count || 0);
  const pledged = Number(request.pledgedCount || 0);
  const remaining = Math.max(total - pledged, 0);
  const qtyNum = Number(quantity);
  const validQty = qtyNum > 0 && qtyNum <= remaining;

  async function submit() {
    try {
      setErr('');
      if (!validQty) {
        setErr(`Please enter a quantity between 1 and ${remaining}.`);
        return;
      }
      setBusy(true);
      await onSubmit({
        quantity: qtyNum,
        deliveryMethod,
        handoffWindow: handoffWindow.trim() || undefined,
        handoffLocation: handoffLocation.trim() || undefined,
        note: note.trim() || undefined,
      });
    } catch (e) {
      setErr(e.message || 'Failed to accept.');
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop pretty" onMouseDown={onBackdrop} onKeyDown={onKeyDown}>
      <div className="modal-card pretty" role="dialog" aria-modal="true" aria-labelledby="accept-title">
        <div className="modal-head">
          <div className="modal-title-area">
            {ngo?.logoUrl ? (
              <img className="ngo-chip-avatar" src={ngo.logoUrl} alt={ngo?.name || 'NGO'} />
            ) : (
              <div className="ngo-chip-avatar placeholder" aria-hidden="true" />
            )}
            <div>
              <h3 id="accept-title">Accept &amp; Pledge</h3>
              <div className="ngo-chip-name">{ngo?.name || 'NGO'}</div>
            </div>
          </div>
          <button className="icon-btn x" onClick={onClose} aria-label="Close dialog" disabled={busy}>✕</button>
        </div>

        <div className="modal-body">
          <div className="request-brief">
            <div className="brief-row">
              <span className="k">Request</span>
              <span className="v">{request.category || request.description || '—'}</span>
            </div>
            <div className="brief-row">
              <span className="k">Total</span>
              <span className="v">{total}</span>
            </div>
            <div className="brief-row">
              <span className="k">Pledged</span>
              <span className="v">{pledged}</span>
            </div>
            <div className="brief-row">
              <span className="k">Remaining</span>
              <span className="v strong">{remaining}</span>
            </div>
          </div>

          <label className="fi">
            <span>Quantity to pledge*</span>
            <input
              ref={qtyRef}
              className="fi-input"
              type="number"
              inputMode="numeric"
              min={1}
              max={remaining || 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Max ${remaining}`}
              disabled={remaining <= 0 || busy}
            />
          </label>

          <div className="fi">
            <span>Delivery method</span>
            <div className="delivery-options">
              {['dropoff', 'pickup', 'shipping'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={`chip ${deliveryMethod === opt ? 'active' : ''}`}
                  onClick={() => setDeliveryMethod(opt)}
                  disabled={busy}
                >
                  {opt === 'dropoff' && 'Drop-off'}
                  {opt === 'pickup'  && 'NGO Pickup'}
                  {opt === 'shipping' && 'Shipping / Courier'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-2">
            <label className="fi">
              <span>Handoff window (optional)</span>
              <input
                className="fi-input"
                type="text"
                value={handoffWindow}
                onChange={(e) => setHandoffWindow(e.target.value)}
                placeholder="e.g., Sat 10–12 or 2025-09-01 15:00"
                disabled={busy}
              />
            </label>
            <label className="fi">
              <span>Handoff location (optional)</span>
              <input
                className="fi-input"
                type="text"
                value={handoffLocation}
                onChange={(e) => setHandoffLocation(e.target.value)}
                placeholder="e.g., NGO warehouse, Beirut"
                disabled={busy}
              />
            </label>
          </div>

          <label className="fi">
            <span>Note (optional)</span>
            <textarea
              className="fi-input"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add sizes, constraints, who to ask for, etc."
              disabled={busy}
            />
          </label>

          {err && <p className="err" style={{ marginTop: 6 }}>{err}</p>}
        </div>

        <div className="modal-actions">
          <button className="btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button
            className="btn"
            onClick={submit}
            disabled={busy || remaining <= 0 || !validQty}
          >
            {busy ? 'Submitting…' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Donations() {
  const navigate = useNavigate();
  const [selectedUrgency, setSelectedUrgency] = useState('All');
  const [requests, setRequests] = useState([]);
  const [ngos, setNgos] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalReq, setModalReq] = useState(null);
  const [modalNgo, setModalNgo] = useState(null);

  const API_URL = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

  // --- Helpers: safe JSON + fallback fetch to /api/... or /... ---
  const safeJson = async (res) => {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return {};
  };

  async function fetchWithFallback(primaryUrl, fallbackUrl, opts) {
    const r1 = await fetch(primaryUrl, opts);
    if (r1.status !== 404) return { res: r1, data: await safeJson(r1) };
    // try fallback if the primary path (usually with /api) isn’t mounted
    const r2 = await fetch(fallbackUrl, opts);
    return { res: r2, data: await safeJson(r2) };
  }

  async function loadAll() {
    try {
      const [{ res: reqRes, data: reqData }, { res: ngoRes, data: ngoData }] = await Promise.all([
        fetchWithFallback(`${API_URL}/api/home/requests`, `${API_URL}/home/requests`),
        fetchWithFallback(`${API_URL}/api/ngo/ngos`, `${API_URL}/ngo/ngos`),
      ]);
      if (!reqRes.ok || !ngoRes.ok) throw new Error('Failed to fetch');
      setRequests(Array.isArray(reqData) ? reqData : []);
      setNgos(Array.isArray(ngoData) ? ngoData : []);
    } catch (e) {
      setRequests([]);
      setNgos([]);
    }
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  // Map NGO id -> NGO object
  const ngoMap = useMemo(
    () => new Map((ngos || []).map(n => [String(n.id ?? n._id), n])),
    [ngos]
  );

  // Prepare card data
  const cards = useMemo(() => {
    return (requests || []).map(r => {
      const ngoId = String(typeof r.ngoId === 'object' ? (r.ngoId.id ?? r.ngoId._id) : r.ngoId);
      const ngo = ngoMap.get(ngoId) || {};
      const total = Number(r.count || 0);
      const pledged = Number(r.pledgedCount || 0);
      const remaining = Math.max(total - pledged, 0);

      return {
        // original card props
        ngoId,
        ngoName: ngo.name || 'Unknown NGO',
        ngoLogo: ngo.logoUrl || '',
        location: extractLocationString(r.location) || extractLocationString(ngo.location) || '',
        description: r.category || r.description || '',
        status: String(r.status || 'Standard').toLowerCase(),
        // extra for accept flow
        requestId: String(r.requestId ?? r.id ?? r._id),
        count: total,
        pledgedCount: pledged,
        fulfilledCount: Number(r.fulfilledCount || 0),
        remaining,
        _raw: r,
      };
    });
  }, [requests, ngoMap]);

  const filtered = selectedUrgency === 'All'
    ? cards
    : cards.filter((req) => req.status === selectedUrgency.toLowerCase());

  function openAcceptModal(card) {
    if ((card.remaining || 0) <= 0) {
      alert('This request is already fully pledged.');
      return;
    }
    setModalReq(card);
    setModalNgo(ngoMap.get(card.ngoId) || null);
    setModalOpen(true);
  }

  async function doAccept(payload) {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const primary = `${API_URL}/api/home/requests/${encodeURIComponent(modalReq.requestId)}/accept`;
    const fallback = `${API_URL}/home/requests/${encodeURIComponent(modalReq.requestId)}/accept`;

    const { res, data } = await fetchWithFallback(primary, fallback, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (res.status === 403) {
        // Likely: NGO tried to accept its own request or role not allowed
        throw new Error(data?.error || 'Not allowed to accept this request.');
      }
      if (res.status === 404) {
        alert('This request was not found. It may have been removed. Refreshing the list.');
        setModalOpen(false);
        await loadAll();
        return;
      }
      throw new Error(data?.error || 'Failed to accept');
    }
// inside doAccept, after the fetchWithFallback(...) and the !res.ok checks
// Success → if backend tells us exactly where to go, use it
if (data?.nextAction?.type === 'message' && data?.nextAction?.url) {
  setModalOpen(false);
  navigate(data.nextAction.url);
} else {
  // Deep-link to the Messages page with the NGO as the other side
  const url =
    `/messages?withNgo=${encodeURIComponent(String(modalReq.ngoId))}` +
    `&requestId=${encodeURIComponent(String(modalReq.requestId || ""))}` +
    (modalNgo?.name ? `&withName=${encodeURIComponent(modalNgo.name)}` : "") +
    (modalNgo?.logoUrl ? `&withAvatar=${encodeURIComponent(modalNgo.logoUrl)}` : "");

  setModalOpen(false);
  navigate(url);
}

// Optionally refresh lists in the background
await loadAll();

  }

  return (
    <div className="donations-page">
      <div className="donations-header">
        <h1 className="donations-title">Start Donating Now!</h1>
        <div className="urgency-filter">
          <select
            className="urgency-select"
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            aria-label="Filter donation requests by urgency"
          >
            {urgencyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="filter-label">{selectedUrgency}</span>
          <div className="custom-arrow"></div>
        </div>
      </div>

      <div className="donations-grid">
        {filtered.map((req) => (
          <DonationRequestCard
            key={req.requestId}
            {...req}
            onDonate={() => openAcceptModal(req)}
            disabled={req.remaining <= 0}
          />
        ))}
      </div>

      {/* Accept & Pledge Modal */}
      <AcceptPledgeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={doAccept}
        request={modalReq}
        ngo={modalNgo}
      />
    </div>
  );
}
