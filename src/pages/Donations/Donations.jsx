import React, { useState } from 'react';
import DonationRequestCard from '../../components/DonationRequestCard/DonationRequestCard';
import './Donations.css';

const urgencyOptions = ['All', 'Urgent', 'Standard'];

export default function Donations() {
    const [selectedUrgency, setSelectedUrgency] = useState('All');

    const dummyRequests = [
        {
            ngoName: 'Hope Foundation',
            location: 'Tripoli',
            description: 'Women’s Winter Coats',
            status: 'urgent',
        },
        {
            ngoName: 'Warm Souls',
            location: 'Beirut',
            description: 'Children’s Blankets and Gloves',
            status: 'standard',
        },
    ];

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
