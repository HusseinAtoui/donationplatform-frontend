import React from 'react';
import { Link } from 'react-router-dom';
import './PartnerCard.css';

export default function PartnerCard({ id, name, location, logo }) {
  const inner = (
    <div className="partner-card">
      <img
        src={logo || '/placeholder-logo.png'}
        alt={`${name} logo`}
        className="partner-logo"   // 👈 keep <img> and this class
      />
      <div className="partner-info">
        <h3 className="partner-name">{name}</h3>
        {location && <p className="partner-location">📍 {location}</p>}
      </div>
    </div>
  );

  // If we have an id, click → /ngo/:id; otherwise just render the card
  return id ? (
    <Link
      to={`/ngo/${encodeURIComponent(id)}`}
      className="link-reset"
      aria-label={`View ${name} profile`}
    >
      {inner}
    </Link>
  ) : (
    inner
  );
}
