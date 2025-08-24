import React from 'react';
import { Link } from 'react-router-dom';
import './DonationRequestCard.css';

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

        {/* Top row: Logo + Name + Donate button */}
        <div className="top-row">
          {ngoId ? (
            <Link to={`/ngo/${ngoId}`} className="ngo-info-link">
              <div
                className="ngo-logo-placeholder"
                style={ngoLogo ? { backgroundImage: `url(${ngoLogo})` } : undefined}
              />
              <span className="ngo-name">{ngoName}</span>
            </Link>
          ) : (
            <div className="ngo-info-link">
              <div className="ngo-logo-placeholder" />
              <span className="ngo-name">{ngoName}</span>
            </div>
          )}

          <button className="donate-button" onClick={onDonate}>Donate</button>
        </div>

        {/* Below row: Location + Description */}
        <div className="bottom-row">
          <p className="ngo-location">📍 {location}</p>
          <p className="donation-description">{description}</p>
        </div>

      </div>

      <div className={`status-banner ${bannerClass}`}>
        {bannerClass === 'urgent' ? 'Urgent' : 'Standard'}
      </div>
    </div>
  );
}
