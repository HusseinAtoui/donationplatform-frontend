import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import Select from "react-select";
import axios from "axios";

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function NGOMap() {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withRequests, setWithRequests] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const apiUrl = process.env.REACT_APP_API_URL;

  const categoryOptions = [
    { value: "jackets", label: "Jackets" },
    { value: "shoes", label: "Shoes" },
    { value: "pants", label: "Pants" },
    { value: "hats", label: "Hats" }
  ];

  const fetchNgos = async () => {
    try {
      setLoading(true);
      const params = {};
      if (withRequests) {
        params.withRequests = "true";
        params.categories =
          selectedCategories.length > 0
            ? selectedCategories.map(c => c.value).join(",")
            : "any";
      }
      const res = await axios.get(`${apiUrl}/map/ngos`, { params });
      setNgos(res.data);
    } catch (err) {
      console.error("Error fetching NGOs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNgos();
  }, []);

  return (
    <div style={{ height: "100vh", position: "relative" }}>
      {/* Floating Filter Panel */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "white",
          padding: "0.5rem 1rem",
          borderRadius: "9999px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          zIndex: 1000,
          flexWrap: "wrap"
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={withRequests}
            onChange={() => setWithRequests(!withRequests)}
          />
          With Requests
        </label>

        {withRequests && (
          <Select
            isMulti
            options={categoryOptions}
            value={selectedCategories}
            onChange={setSelectedCategories}
            placeholder="Categories..."
            styles={{
              container: base => ({
                ...base,
                minWidth: "200px",
                flexGrow: 1
              })
            }}
          />
        )}

        <button
          onClick={fetchNgos}
          style={{
            background: "#007bff",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "9999px",
            cursor: "pointer"
          }}
        >
          Filter
        </button>
      </div>

      {loading ? (
        <p style={{ padding: "1rem" }}>Loading NGOs...</p>
      ) : (
        <MapContainer
          center={[33.8938, 35.5018]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          whenReady={() => console.log("Map is ready")}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {ngos
            .filter(ngo => {
              const isValid = ngo.location?.coordinates &&
                             !isNaN(ngo.location.coordinates.lat) && 
                             !isNaN(ngo.location.coordinates.lng);
              if (!isValid) {
                console.log('Invalid NGO location:', ngo);
              }
              return isValid;
            })
            .map(ngo => {
              console.log('Rendering NGO marker:', ngo.name, ngo.location.coordinates);
              return (
                <Marker
                  key={ngo.id}
                  position={[
                    ngo.location.coordinates.lat,
                    ngo.location.coordinates.lng
                  ]}
                  eventHandlers={{
                    click: () => console.log('Marker clicked:', ngo.name)
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <strong>{ngo.name}</strong>
                      <br />
                      {ngo.location.address}
                      <br />
                      {ngo.phone && <span>📞 {ngo.phone}</span>}
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