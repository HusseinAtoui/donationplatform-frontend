import React, { useState, useEffect, useMemo } from 'react';
import DonationRequestCard from '../../components/DonationRequestCard/DonationRequestCard';
import './Donations.css';

const urgencyOptions = ['All', 'Urgent', 'Standard'];

export default function Donations() {
  const [selectedUrgency, setSelectedUrgency] = useState('All');
  const [requests, setRequests] = useState([]);
  const [ngos, setNgos] = useState([]);

  const API_URL = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    async function fetchData() {
      try {
        const [reqRes, ngoRes] = await Promise.all([
          fetch(`${API_URL}/api/home/requests`),
          fetch(`${API_URL}/api/ngo/ngos`),
        ]);
        if (!reqRes.ok || !ngoRes.ok) throw new Error('Failed to fetch');
        const [reqData, ngoData] = await Promise.all([reqRes.json(), ngoRes.json()]);
        setRequests(Array.isArray(reqData) ? reqData : []);
        setNgos(Array.isArray(ngoData) ? ngoData : []);
      } catch (e) {
        setRequests([]);
        setNgos([]);
      }
    }
    fetchData();
  }, [API_URL]);

  // Map NGO id -> NGO object
  const ngoMap = useMemo(
    () => new Map((ngos || []).map(n => [String(n.id ?? n._id), n])),
    [ngos]
  );

  // Keep the same variable name "dummyRequests", but fill from API
  const dummyRequests = useMemo(() => {
    return (requests || []).map(r => {
      const ngoId = String(
        typeof r.ngoId === 'object' ? (r.ngoId.id ?? r.ngoId._id) : r.ngoId
      );
      const ngo = ngoMap.get(ngoId) || {};
      return {
        // Card props
        ngoId,                                   // 👈 needed for the clickable link
        ngoName: ngo.name || 'Unknown NGO',
        ngoLogo: ngo.logoUrl || '',              // 👈 used for the circle avatar
        location: r.location || ngo.location || '',
        description: r.category || r.description || '',
        status: String(r.status || 'Standard').toLowerCase(), // 'urgent' | 'standard'
      };
    });
  }, [requests, ngoMap]);

  const filteredRequests =
    selectedUrgency === 'All'
      ? dummyRequests
      : dummyRequests.filter((req) => req.status === selectedUrgency.toLowerCase());

  return (
    <div className="donations-page">
      <div className="donations-header">
        <h1 className="donations-title">Start Donating Now!</h1>
        <div className="urgency-filter">
          <select
            className="urgency-select"
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            aria-label="Filter donation requests by urgency"
          >
            {urgencyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="filter-label">{selectedUrgency}</span>
          <div className="custom-arrow"></div>
        </div>
      </div>

      <div className="donations-grid">
        {filteredRequests.map((req, index) => (
          <DonationRequestCard
            key={index}
            {...req}
            onDonate={() => alert(`Donating to ${req.ngoName}`)}
          />
        ))}
      </div>
    </div>
  );
}
