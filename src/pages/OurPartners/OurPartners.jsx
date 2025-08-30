import React, { useEffect, useState, useMemo } from 'react';
import './OurPartners.css';
import PartnerCard from '../../components/PartnerCard/PartnerCard';
import placeholderLogo from '../../assets/login-illustration.jpg';

export default function OurPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    async function fetchNGOs() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}/ngo/ngos`);
        if (!res.ok) throw new Error('Failed to fetch NGOs');
        const data = await res.json();

        setPartners(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError('Could not load partners.');
      } finally {
        setLoading(false);
      }
    }
    fetchNGOs();
  }, [API_URL]);

  const normalized = useMemo(() => {
    return (partners || []).map((p) => {
      const id = String(p.id ?? p._id ?? '');
      // Normalize location (string or object)
      let location = '';
      if (p.location) {
        if (typeof p.location === 'string') {
          location = p.location;
        } else if (typeof p.location === 'object') {
          location =
            p.location.address ??
            [p.location.city, p.location.country].filter(Boolean).join(', ') ??
            '';
        }
      }
      return {
        id,
        name: p.name || 'NGO',
        location,
        logo: p.logoUrl || placeholderLogo,
      };
    });
  }, [partners]);

  if (loading) return <p>Loading partners...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="partners-page">
      <h1 className="partners-title">Our Partners</h1>
      <div className="partners-grid">
        {normalized.map((partner) => (
          <PartnerCard
            key={partner.id || partner.name} // stable key
            id={partner.id}                  // used for linking to /ngo/:id
            name={partner.name}
            location={partner.location}
            logo={partner.logo}
          />
        ))}
      </div>
    </div>
  );
}
