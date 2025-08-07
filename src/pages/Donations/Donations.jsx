import React from 'react';
import DonationRequestCard from '../../components/DonationRequestCard/DonationRequestCard';
import './Donations.css';

export default function Donations() {
  const dummyRequests = [
    {
      ngoName: 'Hope Foundation',
      location: 'Tripoli',
      description: 'Women’s Winter Coats',
      urgent: true,
    },
    {
      ngoName: 'Warm Souls',
      location: 'Beirut',
      description: 'Children’s Blankets and Gloves',
      urgent: false,
    },
  ];

  return (
    <div className="donations-page">
      <h1 className="donations-title">Donation Requests</h1>
      <div className="donations-grid">
        {dummyRequests.map((req, index) => (
          <DonationRequestCard key={index} {...req} onDonate={() => alert(`Donating to ${req.ngoName}`)} />
        ))}
      </div>
    </div>
  );
}
