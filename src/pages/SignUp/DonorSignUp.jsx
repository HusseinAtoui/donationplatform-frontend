import React, { useState } from 'react';
import './DonorSignUp.css';

export default function DonorSignUp() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Donor sign-up data:', formData);
  };

  return (
    <div className="signup-container">
      <h2>Donor Sign Up</h2>
      <form onSubmit={handleSubmit} className="signup-form">
        <input name="firstName" placeholder="First Name" onChange={handleChange} />
        <input name="lastName" placeholder="Last Name" onChange={handleChange} />
        <input name="email" placeholder="Email" onChange={handleChange} />
        <input name="phone" placeholder="Phone Number" onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} />
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}
