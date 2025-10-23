import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import Select from "react-select";
import axios from "axios";
import "./Map.css";
import { clothingCategories } from "../../constants/clothingcategories";

// -----------------------------
// Helper: normalize address to a string
function addr(v) {
  if (!v) return "—";
  if (typeof v === "string") return v;
  return v.address || "—";
}

// -----------------------------
// SVG Pin Icon Factory (DivIcon)
const makePinIcon = ({
  fill = "#DC2626", // main color
  stroke = "#FFFFFF", // outline
  size = 36 // width; height scales (≈ 1.45x)
} = {}) => {
  const html = `
    <svg width="${size}" height="${size * 1.45}" viewBox="0 0 36 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <!-- pin body -->
      <path d="M18 1c9.389 0 17 7.611 17 17 0 11.5-17 35-17 35S1 29.5 1 18C1 8.611 8.611 1 18 1z"
            fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <!-- inner dot -->
      <circle cx="18" cy="18" r="6" fill="white" opacity="0.9"/>
    </svg>
  `;
  return new L.DivIcon({
    className: "tt-pin",
    html,
    iconSize: [size, size * 1.45],
    iconAnchor: [size / 2, size * 1.35], // tip of the pin
    popupAnchor: [0, -size * 1.2]
  });
};

// Color presets
const iconNGO = makePinIcon({ fill: "#111827", stroke: "#FFFFFF" });       // black
const iconRequestUrgent = makePinIcon({ fill: "#DC2626", stroke: "#FFFFFF" }); // red
const iconRequestNormal = makePinIcon({ fill: "#16A34A", stroke: "#FFFFFF" }); // green

// -----------------------------
// Urgency helper
// Uses req.isUrgent/urgent when present; otherwise urgent if dateNeeded <= 3 days from now.
const isRequestUrgent = (req) => {
  if (typeof req.isUrgent === "boolean") return req.isUrgent;
  if (typeof req.urgent === "boolean") return req.urgent;

  if (req.dateNeeded) {
    const now = new Date();
    const needed = new Date(req.dateNeeded);
    const days = Math.floor((needed - now) / (24 * 60 * 60 * 1000));
    return days <= 3;
  }
  return false;
};

// -----------------------------

export default function MapView() {
  const [ngos, setNgos] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayType, setDisplayType] = useState("both");
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Safe default if env var missing
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ngosRes, requestsRes] = await Promise.all([
        axios.get(`${apiUrl}/map/ngos`),
        axios.get(`${apiUrl}/map/requests`, {
          params: {
            category: selectedCategories.length
              ? selectedCategories.map((c) => c.value).join(",")
              : "any"
          }
        })
      ]);
      setNgos(ngosRes.data || []);
      setRequests(requestsRes.data || []);
    } catch (err) {
      console.error("Error fetching map data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories]);

  const displayNgos = displayType === "ngos" || displayType === "both";
  const displayRequests = displayType === "requests" || displayType === "both";

  return (
    <div className="map-page">
      <div className="map-filters">
        <label className="map-display-label">
          Display:
          <select
            value={displayType}
            onChange={(e) => setDisplayType(e.target.value)}
            className="map-display-select"
          >
            <option value="both">NGOs & Requests</option>
            <option value="ngos">NGOs</option>
            <option value="requests">Requests</option>
          </select>
        </label>

        {displayType === "requests" && (
          <Select
            isMulti
            options={clothingCategories.map((c) => ({
              value: c.value,
              label: c.label
            }))}
            value={selectedCategories}
            onChange={setSelectedCategories}
            placeholder="Filter categories..."
            className="map-category-select"
          />
        )}
      </div>

      {loading ? (
        <p className="map-loading">Loading map data...</p>
      ) : (
        <MapContainer
          center={[33.8938, 35.5018]}
          zoom={12}
          className="map-container"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomControl position="bottomright" />

          {/* NGOs (black pins) */}
          {displayNgos &&
            ngos
              .filter(
                (ngo) =>
                  ngo.coordinates &&
                  !isNaN(ngo.coordinates.lat) &&
                  !isNaN(ngo.coordinates.lng)
              )
              .map((ngo) => (
                <Marker
                  key={ngo.id || `${ngo.coordinates.lat},${ngo.coordinates.lng}`}
                  position={[ngo.coordinates.lat, ngo.coordinates.lng]}
                  icon={iconNGO}
                  riseOnHover
                  riseOffset={250}
                >
                  <Popup>
                    <div className="popup-card">
                      <strong>{ngo.name || "NGO"}</strong>
                      <br />
                      {addr(ngo.location)}
                      <br />
                      {ngo.phone && <>📞 {ngo.phone}</>}
                      <br />
                      <a href={`/ngo/${ngo.id}`} className="popup-link">
                        View NGO Page
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}

          {/* Requests (red if urgent, green otherwise) */}
          {displayRequests &&
            requests
              .filter(
                (req) =>
                  req.coordinates &&
                  !isNaN(req.coordinates.lat) &&
                  !isNaN(req.coordinates.lng)
              )
              .map((req) => {
                const icon = isRequestUrgent(req)
                  ? iconRequestUrgent
                  : iconRequestNormal;

                return (
                  <Marker
                    key={
                      req.requestId ||
                      `${req.coordinates.lat},${req.coordinates.lng}`
                    }
                    position={[req.coordinates.lat, req.coordinates.lng]}
                    icon={icon}
                    riseOnHover
                    riseOffset={250}
                  >
                    <Popup>
                      <div className="popup-card">
                        <strong>{req.category || "Request"}</strong>
                        <br />
                        Quantity: {req.count ?? "—"}
                        <br />
                        Needed by: {req.dateNeeded || "—"}
                        <br />
                        {req.ngo && (
                          <>
                            NGO:{" "}
                            <a
                              href={`/ngo/${req.ngo.id}`}
                              className="popup-link"
                            >
                              {req.ngo.name || "NGO"}
                            </a>
                            <br />
                            Location: {addr(req.ngo.location)}
                            <br />
                            {req.ngo.phone && <>📞 {req.ngo.phone}</>}
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
        </MapContainer>
      )}
    </div>
  );
}
