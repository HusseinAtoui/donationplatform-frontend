import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const GoogleIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 48 48"
        style={{ marginRight: '10px' }}
    >
        <path fill="#4285F4" d="M24 9.5c3.2 0 6.1 1.1 8.3 3.3l6.2-6.2C33.7 3.5 29.1 2 24 2 14.6 2 6.5 7.7 3 16.5l7.5 5.8C12.4 17 17.8 14 24 14z" />
        <path fill="#34A853" d="M46.5 24c0-1.6-.2-3.1-.6-4.5H24v9h12.7c-.5 3-2.9 5.5-6.1 6.4l7.5 5.8c4.3-4 6.9-10 6.9-16.7z" />
        <path fill="#FBBC05" d="M10.5 28.3c-.3-1-.5-2.1-.5-3.3s.2-2.3.5-3.3l-7.5-5.8C.8 20.6 0 22.2 0 24s.8 3.4 2.5 4.8l7.5-5.5z" />
        <path fill="#EA4335" d="M24 44c5.4 0 10-1.8 13.3-4.8l-7.5-5.8c-2.2 1.5-5 2.3-8 2.3-6.1 0-11.3-4.1-13.1-9.7l-7.5 5.8C6.4 40.1 14.5 46 24 46z" />
    </svg>
);

export default function Login() {
    const navigate = useNavigate();
    const [userType, setUserType] = useState('Donor');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className="login-container">
            <div className="login-left">
                <p className="return-text" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>← Return</p>
                <h1 className="welcome-title">Welcome Back to WarmHands!</h1>

                <p className="login-as-label">Login in as:</p>
                <div className="user-type-toggle">
                    <button
                        className={`user-type-btn ${userType === 'Donor' ? 'active' : ''}`}
                        onClick={() => setUserType('Donor')}
                    >
                        Donor
                    </button>
                    <button
                        className={`user-type-btn ${userType === 'NGO' ? 'active' : ''}`}
                        onClick={() => setUserType('NGO')}
                    >
                        NGO
                    </button>
                </div>

                <label className="input-label">Email</label>
                <input
                    className="login-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <label className="input-label">Password</label>
                <input
                    className="login-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <p className="forgot-password">Forgot your password?</p>

                <button className="login-btn">LOGIN</button>

                <div className="login-divider">
                    <div className="line" />
                    <span>Or Login with</span>
                    <div className="line" />
                </div>

                <button className="google-btn">
                    <GoogleIcon />
                    Google
                </button>
            </div>

            <div className="login-image" />
        </div>
    );
}
