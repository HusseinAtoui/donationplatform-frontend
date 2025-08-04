import React from 'react';
import './OurPartners.css';
import PartnerCard from '../../components/PartnerCard/PartnerCard';
import loginIllustration from '../../assets/login-illustration.jpg'; // import image

export default function OurPartners() {
  // Dummy NGO data
  const partners = [
    {
      name: 'Hope Foundation',
      location: 'Beirut, Lebanon',
      logo: loginIllustration, // use imported image
    },
    {
      name: 'Warm Souls',
      location: 'Tripoli, Lebanon',
      logo: '/logos/warm-souls.png',
    },
    {
      name: 'Hearts United',
      location: 'Saida, Lebanon',
      logo: '', // fallback to placeholder
    },
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
          />
        ))}
      </div>
    </div>
  );
}
