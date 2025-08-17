// src/components/DonationRequestCard/DonationRequestCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './DonationRequestCard.css';

export default function DonationRequestCard({
  ngoId,           // 👈 make sure this is passed by the parent
  ngoName,
  location,
  description,
  status = 'standard',
  onDonate,
  ngoLogo,         // optional (url)
}) {
  const bannerClass = String(status).toLowerCase() === 'urgent' ? 'urgent' : 'standard';

  return (
    <div className="donation-card">
      <div className="donation-card-content">
        <div className="header-row">
          {ngoId ? (
            <Link to={`/ngo/${ngoId}`} className="ngo-info-link" aria-label={`View ${ngoName} profile`}>
              <div
                className="ngo-logo-placeholder"
                style={ngoLogo ? { backgroundImage: `url(${ngoLogo})` } : undefined}
              />
              <div className="ngo-text">
                <h3 className="ngo-name">{ngoName}</h3>
                <p className="ngo-location">📍 {location}</p>
              </div>
            </Link>
          ) : (
            <div className="ngo-info-link">
              <div className="ngo-logo-placeholder" />
              <div className="ngo-text">
                <h3 className="ngo-name">{ngoName}</h3>
                <p className="ngo-location">📍 {location}</p>
              </div>
            </div>
          )}

          <button className="donate-button" onClick={onDonate}>Donate</button>
        </div>

        <p className="donation-description">{description}</p>
      </div>

      <div className={`status-banner ${bannerClass}`}>
        {bannerClass === 'urgent' ? 'Urgent' : 'Standard'}
      </div>
    </div>
  );
}
