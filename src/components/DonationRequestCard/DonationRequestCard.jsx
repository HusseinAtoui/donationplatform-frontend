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
        <div className="top-row">
          <div className="ngo-info-flex">
            <div
              className="ngo-logo-placeholder"
              style={ngoLogo ? { backgroundImage: `url(${ngoLogo})` } : undefined}
            />
            <h3 className="ngo-name">{ngoName}</h3>
          </div>

          <button className="donate-button" onClick={onDonate}>
            Donate
          </button>
        </div>

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
