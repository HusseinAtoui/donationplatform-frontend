// src/components/MapPicker.jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const isValidLatLng = (c) =>
  c && Number.isFinite(c.lat) && Number.isFinite(c.lng);

// 🔹 SearchBar
function SearchBar({ onSelect, currentCoordinates }) {
  const map = useMap();
  const searchRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (searchRef.current) {
      L.DomEvent.disableClickPropagation(searchRef.current);
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      let data = await res.json();

      // pick reference point
      let refLat, refLng;
      if (currentCoordinates?.lat && currentCoordinates?.lng) {
        refLat = currentCoordinates.lat;
        refLng = currentCoordinates.lng;
      } else {
        const center = map.getCenter();
        refLat = center.lat;
        refLng = center.lng;
      }

      // sort results by distance
      data.sort((a, b) => {
        const distA = Math.hypot(parseFloat(a.lat) - refLat, parseFloat(a.lon) - refLng);
        const distB = Math.hypot(parseFloat(b.lat) - refLat, parseFloat(b.lon) - refLng);
        return distA - distB;
      });

      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const handleSelect = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);

    onSelect({ lat, lng, label: place.display_name });
    map.setView([lat, lng], 14);

    setQuery("");
    setResults([]);
  };

  return (
    <div className="map-searchbar" ref={searchRef}>
      <form
  onSubmit={(e) => {
    e.preventDefault();
    handleSearch(e);
  }}
  className="map-search-form"
>
        <input
          type="text"
          value={query}
          placeholder="Search location"
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
    type="submit"
    onClick={(e) => {
      e.preventDefault();
      handleSearch(e);
    }}
  >Go</button>
      </form>

      {results.length > 0 && (
        <ul className="map-search-results">
          {results.map((place) => (
            <li key={place.place_id} onClick={() => handleSelect(place)}>
              {place.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 🔹 LocationMarker (same as NGOSignUp)
function LocationMarker({ onSelect, coordinates, markerIcon }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onSelect({ lat, lng });
    },
  });

  return coordinates?.lat ? (
    <Marker position={[coordinates.lat, coordinates.lng]} icon={markerIcon} />
  ) : null;
}

// 🔹 Main Reusable CoordinatesPicker
function CoordinatesPicker({ initialCoordinates, initialLocation, onSave, onClose, markerIcon }) {
  const [coordinates, setCoordinates] = useState(initialCoordinates);
  const [locationName, setLocationName] = useState(initialLocation || "");

  const handleSelect = ({ lat, lng, label }) => {
    const updatedCoords = { lat, lng };
    setCoordinates(updatedCoords);
    
    if (!locationName && label) {
        setLocationName(label);
        onSave(updatedCoords, label);
    } else {
        onSave(updatedCoords, locationName);
    }
  };


  const handleSave = () => {
    onSave(coordinates, locationName);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="map-card" onClick={(e) => e.stopPropagation()}>
        <h3>Select Coordinates</h3>
        <div
          className="map-wrapper"
          ref={(el) => {
            if (el) L.DomEvent.disableClickPropagation(el);
          }}
        >
          <MapContainer
            center={
              isValidLatLng(coordinates)
                ? [coordinates.lat, coordinates.lng]
                : [33.8938, 35.5018]
            }
            zoom={12}
            style={{ width: "100%", height: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            <SearchBar
              currentCoordinates={coordinates}
              onSelect={handleSelect}
            />
            <LocationMarker
              onSelect={handleSelect}
              coordinates={coordinates}
              markerIcon={markerIcon}
            />

            <div
              style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
                zIndex: 1000,
              }}
            >
              <button
                type="button"
                className="map-btn"
                onClick={handleSave}
                ref={(el) => {
                    if (el) L.DomEvent.disableClickPropagation(el);
                }}
              >
                Done
              </button>
            </div>
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export { isValidLatLng, CoordinatesPicker };
