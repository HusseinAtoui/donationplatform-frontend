import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import Select from "react-select";
import axios from "axios";
import greyMarkerImage from '../../assets/grey-map-marker.png';
import redMarkerImage from '../../assets/red-map-marker.png';
import './Map.css';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Default Leaflet marker
const ngoIcon = new L.Icon({
  iconUrl: greyMarkerImage,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const requestIcon = new L.Icon({
  iconUrl: redMarkerImage,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper: normalize address to a string
function addr(v) {
  if (!v) return '—';
  if (typeof v === 'string') return v;
  return v.address || '—';
}

export default function MapView() {
  const [ngos, setNgos] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayType, setDisplayType] = useState("both");
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Safe default if env var missing
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

  const categoryOptions = [
    { value: "jackets", label: "Jackets" },
    { value: "shoes", label: "Shoes" },
    { value: "pants", label: "Pants" },
    { value: "hats", label: "Hats" }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ngosRes, requestsRes] = await Promise.all([
        axios.get(`${apiUrl}/map/ngos`),
        axios.get(`${apiUrl}/map/requests`, {
          params: {
            category: selectedCategories.length
              ? selectedCategories.map(c => c.value).join(",")
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
            onChange={e => setDisplayType(e.target.value)}
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
            options={categoryOptions}
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

          {displayNgos && ngos
            .filter(ngo => ngo.coordinates && !isNaN(ngo.coordinates.lat) && !isNaN(ngo.coordinates.lng))
            .map(ngo => (
              <Marker key={ngo.id || `${ngo.coordinates.lat},${ngo.coordinates.lng}`}
                      position={[ngo.coordinates.lat, ngo.coordinates.lng]}
                      icon={ngoIcon}>
                <Popup>
                  <div className="popup-card">
                    <strong>{ngo.name || 'NGO'}</strong><br />
                    {addr(ngo.location)}<br />
                    {ngo.phone && <>📞 {ngo.phone}</>}<br />
                    <a href={`/ngo/${ngo.id}`} className="popup-link">View NGO Page</a>
                  </div>
                </Popup>
              </Marker>
            ))}

          {displayRequests && requests
            .filter(req => req.coordinates && !isNaN(req.coordinates.lat) && !isNaN(req.coordinates.lng))
            .map(req => (
              <Marker key={req.requestId || `${req.coordinates.lat},${req.coordinates.lng}`}
                      position={[req.coordinates.lat, req.coordinates.lng]}
                      icon={requestIcon}>
                <Popup>
                  <div className="popup-card">
                    <strong>{req.category || 'Request'}</strong><br />
                    Quantity: {req.count ?? '—'}<br />
                    Needed by: {req.dateNeeded || '—'}<br />
                    {req.ngo && (
                      <>
                        NGO: <a href={`/ngo/${req.ngo.id}`} className="popup-link">{req.ngo.name || 'NGO'}</a><br />
                        Location: {addr(req.ngo.location)}<br />
                        {req.ngo.phone && <>📞 {req.ngo.phone}</>}
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      )}
    </div>
  );
}
