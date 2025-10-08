import React, { useState } from 'react';
import './Admin.css';

const dummyNGOs = [
    {
        id: 1,
        name: "Helping Hands Lebanon",
        email: "helpinghands@example.com",
        phone: "+961 71 234 567",
        location: "Beirut, Lebanon",
        coordinates: "33.8938, 35.5018",
        inventorySize: "Medium",
        requiredClothing: "Winter Jackets, Blankets",
        bio: "We support displaced families during winter.",
        summary: "Focusing on rural community aid.",
        logo: "https://via.placeholder.com/80",
        status: "Pending"
    },
    {
        id: 2,
        name: "Bright Future NGO",
        email: "contact@brightfuture.org",
        phone: "+961 76 999 111",
        location: "Tripoli, Lebanon",
        coordinates: "34.4367, 35.8497",
        inventorySize: "Large",
        requiredClothing: "",
        bio: "",
        summary: "Children’s education and essentials support.",
        logo: "https://via.placeholder.com/80",
        status: "Pending"
    }
];

export default function AdminPage() {
    const [ngos, setNgos] = useState(dummyNGOs);

    const handleDecision = (id, decision) => {
        setNgos(prev =>
            prev.map(ngo =>
                ngo.id === id ? { ...ngo, status: decision } : ngo
            )
        );
    };

    return (
        <section className="admin-page">
            <h2 className="admin-title">NGO Management</h2>
            <p className="admin-subtitle">Review, approve, or reject registered NGOs.</p>

            <div className="admin-table">
                {ngos.map((ngo) => (
                    <div key={ngo.id} className="ngo-card">
                        <div className="ngo-header">
                            <img
                                src={ngo.logo}
                                alt={`${ngo.name} logo`}
                                className="ngo-logo"
                            />
                            <div>
                                <h3 className="ngo-name">{ngo.name}</h3>
                                <span
                                    className={`ngo-status ${ngo.status === 'Approved'
                                        ? 'approved'
                                        : ngo.status === 'Rejected'
                                            ? 'rejected'
                                            : 'pending'
                                        }`}
                                >
                                    {ngo.status}
                                </span>
                            </div>
                        </div>

                        <div className="ngo-details">
                            <p><strong>Email:</strong> {ngo.email}</p>
                            <p><strong>Phone:</strong> {ngo.phone}</p>
                            <p><strong>Location:</strong> {ngo.location}</p>
                            <p><strong>Coordinates:</strong> {ngo.coordinates}</p>
                            {ngo.inventorySize && <p><strong>Inventory Size:</strong> {ngo.inventorySize}</p>}
                            {ngo.requiredClothing && <p><strong>Required Clothing:</strong> {ngo.requiredClothing}</p>}
                            {ngo.bio && <p><strong>Bio:</strong> {ngo.bio}</p>}
                            {ngo.summary && <p><strong>Summary:</strong> {ngo.summary}</p>}
                        </div>

                        <div className="ngo-actions">
                            <button
                                className="approve-btn"
                                onClick={() => handleDecision(ngo.id, 'Approved')}
                            >
                                Approve
                            </button>
                            <button
                                className="reject-btn"
                                onClick={() => handleDecision(ngo.id, 'Rejected')}
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
