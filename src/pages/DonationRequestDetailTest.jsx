// src/pages/DonationRequestDetailTest.jsx
import React from 'react';
import DonationRequestDetail from '../components/DonationRequestDetail/DonationRequestDetail';

export default function DonationRequestDetailTest() {
  const ngoData = {
    name: 'Hope Foundation',
    profilePic: 'https://via.placeholder.com/241x235.png?text=NGO+Logo',
    address: '8592 Fairground St. Tallahassee, FL 32303',
    phone: '+1 775-378-6348',
    email: 'contact@hopefoundation.org',
    hours: 'Mon - Fri: 10AM - 6PM',
  };

  const donationData = {
    description: 'Women’s Winter Coats needed to support the community during cold months.',
    status: 'urgent',
    category: 'clothing',
    count: 120,
    gender: 'female',
    dateNeeded: '2025-09-15',
    location: 'Tallahassee, FL',
    size: 'Medium to Large',
    ageRange: '18-45',
  };

  return <DonationRequestDetail ngoData={ngoData} donationData={donationData} />;
}
