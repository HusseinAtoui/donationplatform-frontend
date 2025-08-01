import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DonorSignUp.css';

export default function DonorSignUp() {
    const navigate = useNavigate();
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
            <div className="signup-left">
                <p className="return-text" onClick={() => navigate('/')}>
                    ← Back Home
                </p>
                <h1 className="signup-title">Create Your Donor Account</h1>
                <form onSubmit={handleSubmit} className="signup-form">
                    <input name="firstName" placeholder="First Name" onChange={handleChange} />
                    <input name="lastName" placeholder="Last Name" onChange={handleChange} />
                    <input name="email" placeholder="Email" onChange={handleChange} />
                    <input name="phone" placeholder="Phone Number" onChange={handleChange} />
                    <input name="password" type="password" placeholder="Password" onChange={handleChange} />
                    <button type="submit">Sign Up</button>
                </form>
                <p className="login-prompt">
                    Already have an account?{' '}
                    <span
                        className="login-link"
                        onClick={() => navigate('/login')}
                        role="button"
                        tabIndex={0}
                    >
                        Login
                    </span>
                </p>
            </div>

            <div className="login-image" />
        </div>
    );
}
