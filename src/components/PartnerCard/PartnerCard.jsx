import React from 'react';
import { Link } from 'react-router-dom';
import './PartnerCard.css';

// Always produce a short, chip-friendly location
function formatLocationForChip(loc) {
  if (!loc) return '';
  // Try common shapes
  const s = (
    typeof loc === 'string'
      ? loc
      : loc.address || loc.formattedAddress || loc.label || loc.city || loc.name || ''
  ).trim();

  if (!s) return '';

  // Prefer chunk before first comma; else first word
  const beforeComma = s.split(',')[0]?.trim();
  let display = beforeComma || s.split(/\s+/)[0] || '';

  // Hard cap just in case
  if (display.length > 30) display = display.slice(0, 30).trim() + '…';
  return display;
}

export default function PartnerCard({ id, name, location, logo }) {
  const formattedLocation = formatLocationForChip(location);

  const inner = (
    <div className="partner-card">
      <img
        src={logo || '/placeholder-logo.png'}
        alt={`${name} logo`}
        className="partner-logo"
      />
      <div className="partner-info">
        <h3 className="partner-name">{name}</h3>

        {formattedLocation && (
          <p className="partner-location">
            <span className="pin" aria-hidden>📍</span>
            <span className="loc-text">{formattedLocation}</span>
          </p>
        )}
      </div>
    </div>
  );

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
