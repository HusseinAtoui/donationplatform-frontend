import React from 'react';
import './PartnerCard.css';

export default function PartnerCard({ name, location, logo, description }) {
  return (
    <div className="partner-card">
      <img
        src={logo || '/placeholder-logo.png'}
        alt={`${name} logo`}
        className="partner-logo"
      />
      <h3 className="partner-name">{name}</h3>
      {location && <p className="partner-location">{location}</p>}
      {description && <p className="partner-description">{description}</p>}
    </div>
  );
}
