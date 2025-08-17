// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: '10px' }}>
    <path fill="#4285F4" d="M24 9.5c3.2 0 6.1 1.1 8.3 3.3l6.2-6.2C33.7 3.5 29.1 2 24 2 14.6 2 6.5 7.7 3 16.5l7.5 5.8C12.4 17 17.8 14 24 14z" />
    <path fill="#34A853" d="M46.5 24c0-1.6-.2-3.1-.6-4.5H24v9h12.7c-.5 3-2.9 5.5-6.1 6.4l7.5 5.8c4.3-4 6.9-10 6.9-16.7z" />
    <path fill="#FBBC05" d="M10.5 28.3c-.3-1-.5-2.1-.5-3.3s.2-2.3.5-3.3l-7.5-5.8C.8 20.6 0 22.2 0 24s.8 3.4 2.5 4.8l7.5-5.5z" />
    <path fill="#EA4335" d="M24 44c5.4 0 10-1.8 13.3-4.8l-7.5-5.8c-2.2 1.5-5 2.3-8 2.3-6.1 0-11.3-4.1-13.1-9.7l-7.5 5.8C6.4 40.1 14.5 46 24 46z" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // You can change the default to 'NGO' if you mostly test NGO logins
  const [userType, setUserType] = useState('Donor');
  const [identifier, setIdentifier] = useState('');   // email OR phone for Donor; email for NGO
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const justVerified = new URLSearchParams(location.search).get('verified') === '1';

  function decodeJwt(token) {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return null;
    }
  }

  async function loginTo(url, payload) {
    console.log('[FE] POST', url, payload);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Try to parse JSON; if not, build a fallback error
    let body = {};
    try { body = await res.json(); } catch (_) {}

    console.log('[FE] login response', res.status, body);
    return { ok: res.ok, status: res.status, body };
  }

  async function handleLogin(e) {
    e?.preventDefault?.();
    setError('');

    if (!identifier || !password) {
      setError('Please fill all fields.');
      return;
    }

    try {
      setLoading(true);

      const donorUrl = `${API_BASE}/user/login`;
      const ngoUrl   = `${API_BASE}/ngo/login`;
      const primary  = userType === 'NGO' ? ngoUrl : donorUrl;
      const fallback = userType === 'NGO' ? donorUrl : ngoUrl;

      const payload = { identifier: identifier.trim(), password };

      // Try the selected role first
      let { ok, status, body } = await loginTo(primary, payload);

      // If generic invalid creds, auto-try the other endpoint (helps if the toggle was wrong)
      if (!ok && status === 401 && body?.error === 'Invalid credentials.') {
        console.log('[FE] trying fallback endpoint…');
        const r2 = await loginTo(fallback, payload);
        if (r2.ok) { ok = true; status = r2.status; body = r2.body; }
      }

      if (!ok) {
        throw new Error(body?.error || `Login failed (${status})`);
      }

      const { token } = body || {};
      if (!token) throw new Error('No token returned from server.');

      localStorage.setItem('token', token);

      // Determine role from token (backend sets: "ngo" or "user")
      let role = userType.toLowerCase();
      const decoded = decodeJwt(token);
      if (decoded?.role) role = decoded.role;

      localStorage.setItem('role', role);

      if (role === 'ngo') {
        navigate('/NGOProfile');
      } else if (role === 'user') {
        navigate('/DonorProfile');
      } else {
        navigate('/');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <p className="return-text" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          ← Return Home
        </p>

        <h1 className="welcome-title">Welcome Back to WarmHands!</h1>

        {justVerified && (
          <div className="notice" style={{ color: 'green', marginBottom: 12 }}>
            Your email is verified. Please log in.
          </div>
        )}

        <p className="login-as-label">Log in as:</p>
        <div className="user-type-toggle">
          <button
            className={`user-type-btn ${userType === 'Donor' ? 'active' : ''}`}
            onClick={() => setUserType('Donor')}
            type="button"
          >
            Donor
          </button>
          <button
            className={`user-type-btn ${userType === 'NGO' ? 'active' : ''}`}
            onClick={() => setUserType('NGO')}
            type="button"
          >
            NGO
          </button>
        </div>

        <form onSubmit={handleLogin}>
          <label className="input-label">
            {userType === 'Donor' ? 'Email or Phone' : 'Email'}
          </label>
          <input
            className="login-input"
            type={userType === 'Donor' ? 'text' : 'email'}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={userType === 'Donor' ? 'e.g. user@example.com or +9617...' : 'user@example.com'}
            autoComplete="username"
          />

          <label className="input-label">Password</label>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
            autoComplete="current-password"
          />

          <p className="forgot-password">Forgot your password?</p>

          <button className="login-btn" onClick={handleLogin} disabled={loading} type="submit">
            {loading ? 'Logging in…' : 'LOGIN'}
          </button>
        </form>

        {error && <div style={{ color: 'crimson', marginTop: 10 }}>{error}</div>}

        <p className="signup-prompt">
          Don't have an account{' '}
          <span
            className="signup-link"
            onClick={() => navigate('/signup')}
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
          >
            Sign Up
          </span>
        </p>

        <div className="login-divider">
          <div className="line" />
          <span>Or Login with</span>
          <div className="line" />
        </div>

        <button className="google-btn" onClick={() => alert('Google login not wired yet')}>
          <GoogleIcon />
          Google
        </button>
      </div>

      <div className="login-image" />
    </div>
  );
}
