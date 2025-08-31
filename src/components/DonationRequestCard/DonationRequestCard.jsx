import React from 'react';
import { Link } from 'react-router-dom';
import './DonationRequestCard.css';

// ---- NEW: location formatter ----
function formatLocationForChip(loc) {
  const s = (typeof loc === 'string' ? loc : (loc?.address || '')).trim();
  if (!s) return '';
  const beforeComma = s.split(',')[0]?.trim();
  let display = beforeComma || s.split(/\s+/)[0] || '';
  if (display.length > 30) display = display.slice(0, 30).trim() + '…';
  return display;
}

export default function DonationRequestCard({
  ngoId,
  ngoName,
  location,
  description,
  status = 'standard',
  onDonate,
  ngoLogo,
}) {
  const bannerClass = String(status).toLowerCase() === 'urgent' ? 'urgent' : 'standard';

  return (
    <div className="donation-card">
      <div className="donation-card-content">
        <div className="top-row">
          <div className="ngo-info-flex">
            <div
              className="ngo-logo-placeholder"
              style={ngoLogo ? { backgroundImage: `url(${ngoLogo})` } : undefined}
            />
            {/* NGO Name wraps naturally now */}
            <h3 className="ngo-name">{ngoName}</h3>
          </div>

          <button className="donate-button" onClick={onDonate}>
            Donate
          </button>
        </div>

        <div className="bottom-row">
          <p className="ngo-location">📍 {formatLocationForChip(location)}</p>
          <p className="donation-description">{description}</p>
        </div>
      </div>

      <div className={`status-banner ${bannerClass}`}>
        {bannerClass === 'urgent' ? 'Urgent' : 'Standard'}
      </div>
    </div>
  );
}
