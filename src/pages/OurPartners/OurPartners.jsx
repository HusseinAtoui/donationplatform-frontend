import React from 'react';
import './OurPartners.css';
import PartnerCard from '../../components/PartnerCard/PartnerCard';

export default function OurPartners() {
  // Dummy NGO data
  const partners = [
    {
      name: 'Hope Foundation',
      location: 'Beirut, Lebanon',
      logo: '/logos/hope.png',
      description: 'Supporting families with essential needs.'
    },
    {
      name: 'Warm Souls',
      location: 'Tripoli, Lebanon',
      logo: '/logos/warm-souls.png',
      description: 'Distributing winter clothing to those in need.'
    },
    {
      name: 'Hearts United',
      location: 'Saida, Lebanon',
      logo: '', // fallback to placeholder
      description: 'Focused on healthcare and shelter.'
    }
  ];

  return (
    <div className="partners-page">
      <h1 className="partners-title">Our Partners</h1>
      <div className="partners-grid">
        {partners.map((partner, index) => (
          <PartnerCard
            key={index}
            name={partner.name}
            location={partner.location}
            logo={partner.logo}
            description={partner.description}
          />
        ))}
      </div>
    </div>
  );
}
