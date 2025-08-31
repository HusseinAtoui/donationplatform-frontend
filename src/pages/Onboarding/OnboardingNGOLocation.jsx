// src/pages/Onboarding/OnboardingNGOLocation.jsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './OnboardingNGOLocation.css';

// leaflet icons (keep default look)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

// --- helpers ---
function ClickPicker({ onPick }) {
  useMapEvents({
    click(e) { onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); }
  });
  return null;
}

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (typeof center?.lat === 'number' && typeof center?.lng === 'number') {
      map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
    }
  }, [center, map]);
  return null;
}

function haversineKm(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function splitDisplayName(name = '') {
  const parts = String(name).split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length <= 1) return { primary: name, secondary: '' };
  return { primary: parts[0], secondary: parts.slice(1).join(', ') };
}

export default function OnboardingNGOLocation() {
  const navigate = useNavigate();

  // single source of truth for the location text (manual or from search)
  const [location, setLocation] = useState('');
  // map coordinates
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [saving, setSaving] = useState(false);

  // ---- Search state ----
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [openList, setOpenList] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const boxRef = useRef(null);
  const abortRef = useRef(null);

  const defaultCenter = useMemo(() => ({ lat: 33.8938, lng: 35.5018 }), []);
  const [origin, setOrigin] = useState(defaultCenter); // user location for proximity sorting

  // pull token & user from URL once
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    const user = url.searchParams.get('user');

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('role', 'ngo');
    }
    if (user) {
      try {
        const u = JSON.parse(decodeURIComponent(user));
        if (typeof u.location === 'string') setLocation(u.location);
        if (u?.coordinates && typeof u.coordinates.lat === 'number' && typeof u.coordinates.lng === 'number') {
          setCoords({ lat: Number(u.coordinates.lat), lng: Number(u.coordinates.lng) });
        }
      } catch {}
    }

    // clean query
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  // get user's approximate position to bias & sort results
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords || {};
        if (typeof latitude === 'number' && typeof longitude === 'number') {
          setOrigin({ lat: latitude, lng: longitude });
        }
      },
      () => { /* ignore errors, keep default */ },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 }
    );
  }, []);

  // debounced geocode search (Nominatim) based on `location`
  useEffect(() => {
    const query = location.trim();
    if (!query) {
      setResults([]);
      setOpenList(false);
      setActiveIdx(-1);
      return;
    }

    setSearching(true);
    setOpenList(true);

    const handle = setTimeout(async () => {
      try {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', query);
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('limit', '8');
        // Prefer local language mix
        const headers = {
          'Accept': 'application/json',
          'Accept-Language': 'en,ar;q=0.8'
        };
        // Provide a bias toward user's location (not a hard filter)
        if (origin?.lat && origin?.lng) {
          url.searchParams.set('lat', String(origin.lat));
          url.searchParams.set('lon', String(origin.lng));
        }

        const resp = await fetch(url.toString(), { signal: controller.signal, headers });
        const data = await resp.json();

        const cleaned = (Array.isArray(data) ? data : []).map(r => {
          const lat = parseFloat(r.lat);
          const lng = parseFloat(r.lon);
          const name = r.display_name || '';
          const countryCode = r.address?.country_code?.toLowerCase?.() || '';
          const isLebanon =
            countryCode === 'lb' || /(^|,\s*)lebanon(\s*,|$)/i.test(name);
          return {
            id: r.place_id,
            name,
            lat, lng,
            isLebanon,
            distKm: haversineKm(origin, { lat, lng })
          };
        });

        // Sort: Lebanon first, then by distance
        cleaned.sort((a, b) =>
          (b.isLebanon - a.isLebanon) || ((a.distKm ?? 1e9) - (b.distKm ?? 1e9))
        );

        setResults(cleaned);
        setActiveIdx(cleaned.length ? 0 : -1);
      } catch (e) {
        if (e?.name !== 'AbortError') {
          console.error('geocode error:', e);
          setResults([]);
        }
      } finally {
        setSearching(false);
      }
    }, 400); // debounce

    return () => clearTimeout(handle);
  }, [location, origin]);

  // close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpenList(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function selectResult(r) {
    if (!r) return;
    setCoords({ lat: r.lat, lng: r.lng });
    setLocation(r.name || '');
    setOpenList(false);
    setActiveIdx(-1);
  }

  function onSearchKey(e) {
    if (!openList || !results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectResult(results[activeIdx] || results[0]);
    } else if (e.key === 'Escape') {
      setOpenList(false);
    }
  }

  async function save() {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const finalLocation = (location || '').trim();
    const latOk = typeof coords.lat === 'number' && !Number.isNaN(coords.lat);
    const lngOk = typeof coords.lng === 'number' && !Number.isNaN(coords.lng);

    if (!finalLocation || !latOk || !lngOk) {
      alert('Please select a result or click the map so both location and coordinates are set.');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/ngo/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ location: finalLocation, coordinates: coords })
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || 'Failed to save');
      }
      navigate('/ngoprofile');
    } catch (e) {
      alert(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // active option id for aria-activedescendant
  const activeOptionId =
    openList && activeIdx >= 0 && results[activeIdx]
      ? `geo-opt-${results[activeIdx].id}`
      : undefined;

  return (
    <div className="page">
      <section className="wrap">
        <div className="card">
          <h2>Complete Your NGO Profile</h2>
          <p className="muted">Please add your location before continuing.</p>

          {/* ONE FIELD: search or type */}
          <label className="input-label" htmlFor="location-combobox">Search or type your location</label>
          <div className="geo-search" ref={boxRef}>
            <input
              id="location-combobox"
              className="signup-input"
              placeholder="e.g. American University of Beirut, Ras Beirut…"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => location.trim() && setOpenList(true)}
              onKeyDown={onSearchKey}
              // ARIA combobox on the input
              role="combobox"
              aria-expanded={openList}
              aria-controls="geo-suggest"
              aria-activedescendant={activeOptionId}
              aria-autocomplete="list"
              aria-haspopup="listbox"
            />
            {openList && (
              <ul id="geo-suggest" className="geo-results" role="listbox">
                {searching && (
                  <li
                    className="geo-item muted loading"
                    role="option"
                    aria-selected="false"
                    aria-busy="true"
                    id="geo-opt-loading"
                  >
                    <span className="dot-spinner" aria-hidden="true" />
                    Searching…
                  </li>
                )}
                {!searching && !results.length && location.trim() && (
                  <li
                    className="geo-item muted"
                    role="option"
                    aria-selected="false"
                    id="geo-opt-empty"
                  >
                    No results
                  </li>
                )}
                {!searching && results.map((r, i) => {
                  const { primary, secondary } = splitDisplayName(r.name);
                  const km = Number.isFinite(r.distKm) ? r.distKm : null;
                  return (
                    <li
                      key={r.id}
                      id={`geo-opt-${r.id}`}
                      role="option"
                      aria-selected={i === activeIdx}
                      className={`geo-item ${i === activeIdx ? 'active' : ''}`}
                      onMouseEnter={() => setActiveIdx(i)}
                      onMouseDown={(e) => e.preventDefault()} // prevent input blur before click
                      onClick={() => selectResult(r)}
                      title={r.name}
                    >
                      <div className="geo-primary">
                        {primary} {r.isLebanon ? '🇱🇧' : ''}
                      </div>
                      <div className="geo-secondary">
                        {secondary}
                        {km !== null && (
                          <span className="geo-distance"> · {km < 1 ? `${(km*1000)|0} m` : `${km.toFixed(1)} km`}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <p className="coords-hint">Tip: pick from results or click on the map to fine-tune the pin.</p>

          {/* Map */}
          <label className="input-label">Coordinates (pick on map)</label>
          <div style={{ height: 8 }} />
          <div style={{ height: 360 }}>
            <div className="map-box">
              <MapContainer
                center={
                  (typeof coords.lat === 'number' && typeof coords.lng === 'number')
                    ? [coords.lat, coords.lng]
                    : [origin.lat, origin.lng] // start near the user if available
                }
                zoom={12}
                style={{ height: '100%', width: '100%', borderRadius: 8 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {typeof coords.lat === 'number' && typeof coords.lng === 'number' && (
                  <Marker position={[coords.lat, coords.lng]} />
                )}
                <ClickPicker onPick={setCoords} />
                <FlyTo center={coords} />
              </MapContainer>
            </div>
          </div>

          <div style={{ marginTop: 8, fontSize: 12, opacity: .8 }}>
            {typeof coords.lat === 'number'
              ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
              : 'Not selected'}
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="btn" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
