import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUpSelect.css';

export default function UserTypeSelection() {
    const navigate = useNavigate();
    const [selected, setSelected] = useState(null);

    const handleSelect = (type) => {
        setSelected(type);
        setTimeout(() => {
            navigate(`/signup/${type}`);
        }, 100);
    };

    return (
        <div className="signup-select-container">
            <div className="signup-select-left">
                <p className="return-text" onClick={() => navigate('/')}>
                    ← Return Home
                </p>

                <h1 className="welcome-title">Join WarmHands as:</h1>

                <div className="user-type-toggle">
                    <button
                        className={`user-type-btn ${selected === 'donor' ? 'active' : ''}`}
                        onClick={() => handleSelect('donor')}
                    >
                        Donor
                    </button>
                    <button
                        className={`user-type-btn ${selected === 'ngo' ? 'active' : ''}`}
                        onClick={() => handleSelect('ngo')}
                    >
                        NGO
                    </button>
                </div>

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
