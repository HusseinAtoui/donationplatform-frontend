import React from 'react';
import './DonationRequestCard.css';

export default function DonationRequestCard({ ngoName, location, description, status, onDonate }) {
    return (
        <div className="donation-card">
            <div className="donation-card-content">
                <div className="header-row">
                    <div className="ngo-info">
                        <div className="ngo-logo-placeholder"></div>
                        <div className="ngo-text">
                            <h3 className="ngo-name">{ngoName}</h3>
                            <p className="ngo-location">📍 {location}</p>
                        </div>
                    </div>
                    <button className="donate-button" onClick={onDonate}>Donate</button>
                </div>

                <p className="donation-description">{description}</p>
            </div>

            <div className={`status-banner ${status === 'urgent' ? 'urgent' : 'standard'}`}>
                {status === 'urgent' ? 'Urgent' : 'Standard'}
            </div>
        </div>
    );
}
