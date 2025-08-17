// src/pages/DonationRequestDetailTest.jsx
import React, { useEffect, useState } from 'react';
import DonationRequestDetail from '../components/DonationRequestDetail/DonationRequestDetail';
import { useNavigate } from 'react-router-dom';

export default function DonationRequestDetailTest() {
  const [requests, setRequests] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const API_URL = 'http://localhost:4000'; // your backend

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all donation requests
        const resRequests = await fetch(`${API_URL}/api/home/requests`);
        if (!resRequests.ok) throw new Error('Failed to fetch donation requests');
        const allRequests = await resRequests.json();
        console.log('Fetched donation requests:', allRequests);
        setRequests(allRequests);

        // Fetch all NGOs
        const resNgos = await fetch(`${API_URL}/api/ngo/ngos`);
        if (!resNgos.ok) throw new Error('Failed to fetch NGOs');
        const allNgos = await resNgos.json();
        console.log('Fetched NGOs:', allNgos);
        setNgos(allNgos);

      } catch (err) {
        console.error(err);
        setError('Failed to load donation requests or NGOs');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleDonationSuccess = (requestId) => {
    console.log('Donation successful for request:', requestId);
    navigate(`/donation-success?donationId=${requestId}`);
  };

  if (loading) return <p>Loading donation requests...</p>;
  if (error) return <p>{error}</p>;
  if (!requests.length) return <p>No donation requests found.</p>;

  return (
    <div>
      {requests.map((donationData) => {
        const ngoData = ngos.find(n => n.id === donationData.ngoId) || {};
        console.log('Mapping request', donationData.requestId, 'to NGO', ngoData.name);
        return (
          <DonationRequestDetail
            key={donationData.requestId}
            ngoData={{
              name: ngoData.name || 'Unknown NGO',
              profilePic: ngoData.logoUrl || 'https://via.placeholder.com/241x235.png?text=NGO+Logo',
              address: ngoData.location || '',
              phone: ngoData.phone || '',
              email: ngoData.email || '',
              hours: ngoData.hours || 'Mon - Fri: 10AM - 6PM',
            }}
            donationData={donationData}
            onDonationSuccess={() => handleDonationSuccess(donationData.requestId)}
          />
        );
      })}
    </div>
  );
}
