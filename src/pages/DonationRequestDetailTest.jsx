// src/pages/DonationRequestDetailTest.jsx
import React, { useEffect, useState } from "react";
import DonationRequestDetail from "../components/DonationRequestDetail/DonationRequestDetail";
import { useNavigate } from "react-router-dom";

export default function DonationRequestDetailTest() {
  const [requests, setRequests] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_BASE || "http://localhost:4000";

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const resRequests = await fetch(`${API_URL}/api/home/requests`);
        if (!resRequests.ok) throw new Error("Failed to fetch donation requests");
        const allRequests = await resRequests.json();

        const resNgos = await fetch(`${API_URL}/api/ngo/ngos`);
        if (!resNgos.ok) throw new Error("Failed to fetch NGOs");
        const allNgos = await resNgos.json();

        setRequests(allRequests || []);
        setNgos(allNgos || []);
      } catch (err) {
        setError("Failed to load donation requests or NGOs");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [API_URL]);

  const handleDonationSuccess = (requestId) => {
    navigate(`/donation-success?donationId=${encodeURIComponent(requestId)}`);
  };

  if (loading) return <p>Loading donation requests...</p>;
  if (error) return <p>{error}</p>;
  if (!requests.length) return <p>No donation requests found.</p>;

  // Build a simple NGO lookup map
  const ngoMap = new Map(
    (ngos || []).map((n) => [String(n.id ?? n._id), n])
  );

  return (
    <div>
      {requests.map((donationData) => {
        const requestKey = String(donationData.requestId ?? donationData.id ?? donationData._id);
        const ngoId = String(
          typeof donationData.ngoId === "object"
            ? donationData.ngoId.id ?? donationData.ngoId._id
            : donationData.ngoId
        );

        const ngo = ngoMap.get(ngoId) || {};

        return (
          <DonationRequestDetail
            key={requestKey}
            ngoData={{
              name: ngo.name || "Unknown NGO",
              profilePic:
                ngo.logoUrl ||
                "https://via.placeholder.com/241x235.png?text=NGO+Logo",
              address: ngo.location || "",
              phone: ngo.phone || "",
              email: ngo.email || "",
              hours: ngo.hours || "Mon - Fri: 10AM - 6PM",
            }}
            donationData={donationData}
            onDonationSuccess={() => handleDonationSuccess(requestKey)}
          />
        );
      })}
    </div>
  );
}
