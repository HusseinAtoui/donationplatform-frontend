import React, { useEffect, useState } from 'react';
import './OurPartners.css';
import PartnerCard from '../../components/PartnerCard/PartnerCard';
import placeholderLogo from '../../assets/login-illustration.jpg';

export default function OurPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNGOs() {
      try {
        const API_URL =  'http://localhost:4000';
        const res = await fetch(`${API_URL}/api/ngo/ngos`);
        if (!res.ok) throw new Error('Failed to fetch NGOs');
        const data = await res.json();
        setPartners(data);
      } catch (err) {
        console.error(err);
        setError('Could not load partners.');
      } finally {
        setLoading(false);
      }
    }

    fetchNGOs();
  }, []);

  if (loading) return <p>Loading partners...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="partners-page">
      <h1 className="partners-title">Our Partners</h1>
      <div className="partners-grid">
        {partners.map((partner) => {
          // Safely handle location object or string
          let location = '';
          if (partner.location) {
            if (typeof partner.location === 'string') {
              location = partner.location;
            } else if (typeof partner.location === 'object') {
              location = partner.location.address || '';
            }
          }

          return (
            <PartnerCard
              key={partner.id || partner.email} // fallback key
              name={partner.name}
              location={location}
              logo={partner.logoUrl || placeholderLogo}
            />
          );
        })}
      </div>
    </div>
  );
}
