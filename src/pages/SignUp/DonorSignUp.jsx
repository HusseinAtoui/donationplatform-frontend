// src/pages/DonorSignUp.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './DonorSignUp.css';
import { Eye, EyeOff } from 'lucide-react';

const API_BASE = 'http://localhost:4000';

export default function DonorSignUp() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const handleChange = (e) => {
    setErr('');
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const validate = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return 'Please enter your first and last name.';
    }
    if (!formData.email.trim()) return 'Please enter your email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      return 'Please enter a valid email.';
    if (!formData.phone) return 'Please enter your phone number.';
    if (formData.password.length < 8) return 'Password must be at least 8 characters.';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setOkMsg('');

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    const payload = {
      email: formData.email.trim(),
      phone: `+${String(formData.phone).replace(/\s+/g, '')}`, // E.164-ish
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      location: '',
      avatarUrl: '',
      bio: '',
      password: formData.password,
    };

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/user/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Signup failed.');
      }

      setOkMsg('Account created. Check your email to verify your account.');
      // Optionally route to a “check your email” page:
      // navigate('/verify-email');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-left">
        <p className="return-text" onClick={() => navigate('/')} role="button" tabIndex={0}>
          ← Back Home
        </p>

        <h1 className="signup-title">Create Your Donor Account</h1>

        {err && <div className="error-banner" role="alert">{err}</div>}
        {okMsg && <div className="success-banner" role="status">{okMsg}</div>}

        <form onSubmit={handleSubmit} className="signup-form" noValidate>
          <div className="name-row">
            <input
              name="firstName"
              placeholder="First Name"
              autoComplete="given-name"
              onChange={handleChange}
              value={formData.firstName}
              required
            />
            <input
              name="lastName"
              placeholder="Last Name"
              autoComplete="family-name"
              onChange={handleChange}
              value={formData.lastName}
              required
            />
          </div>

          <input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            onChange={handleChange}
            value={formData.email}
            required
          />

          <div className="input-group phone-containerDONOR">
            <PhoneInput
              country="lb"
              value={formData.phone}
              onChange={(phone) => setFormData((s) => ({ ...s, phone }))}
              inputProps={{
                name: 'phone',
                required: true,
                className: 'phone-input',
                autoComplete: 'tel',
                placeholder: 'Phone Number',
              }}
              buttonClass="phone-button"
            />
          </div>

          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              value={formData.password}
              autoComplete="new-password"
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword((s) => !s)}
              role="button"
              tabIndex={0}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              value={formData.confirmPassword}
              autoComplete="new-password"
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowConfirmPassword((s) => !s)}
              role="button"
              tabIndex={0}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
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
