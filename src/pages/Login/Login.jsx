import React, { useState } from 'react';
import './Login.css';

export default function Login() {
    const [userType, setUserType] = useState('Donor');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className="login-container">
            <div className="login-left">
                <p className="return-text">← Return</p>
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

                <button className="google-btn">Google</button>
            </div>

            <div className="login-image" />
        </div>
    );
}
