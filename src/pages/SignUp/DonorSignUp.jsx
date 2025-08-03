import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DonorSignUp.css';
import { Eye, EyeOff } from 'lucide-react';

export default function DonorSignUp() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
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
                    <div className="name-row">
                        <input
                            name="firstName"
                            placeholder="First Name"
                            onChange={handleChange}
                        />
                        <input
                            name="lastName"
                            placeholder="Last Name"
                            onChange={handleChange}
                        />
                    </div>
                    <input
                        name="email"
                        placeholder="Email"
                        onChange={handleChange}
                    />
                    <input
                        name="phone"
                        placeholder="Phone Number"
                        onChange={handleChange}
                    />
                    <div className="password-field">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Password"
                            onChange={handleChange}
                        />
                        <span
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>
                    <div className="password-field">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            onChange={handleChange}
                        />
                        <span
                            className="toggle-password"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>
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
