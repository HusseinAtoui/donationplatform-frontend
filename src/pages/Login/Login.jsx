// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

// Normalize base to avoid trailing slashes
const API_BASE = (process.env.REACT_APP_API_BASE || 'http://localhost:4000/api').replace(/\/+$/, '');

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: '10px' }}>
    <path fill="#4285F4" d="M24 9.5c3.2 0 6.1 1.1 8.3 3.3l6.2-6.2C33.7 3.5 29.1 2 24 2 14.6 2 6.5 7.7 3 16.5l7.5 5.8C12.4 17 17.8 14 24 14z" />
    <path fill="#34A853" d="M46.5 24c0-1.6-.2-3.1-.6-4.5H24v9h12.7c-.5 3-2.9 5.5-6.1 6.4l7.5 5.8c4.3-4 6.9-10 6.9-16.7z" />
    <path fill="#FBBC05" d="M10.5 28.3c-.3-1-.5-2.1-.5-3.3s.2-2.3.5-3.3l-7.5-5.8C.8 20.6 0 22.2 0 24s.8 3.4 2.5 4.8l7.5-5.5z" />
    <path fill="#EA4335" d="M24 44c5.4 0 10-1.8 13.3-4.8l-7.5-5.8c-2.2 1.5-5 2.3-8 2.3-6.1 0-11.3-4.1-13.1-9.7l-7.5 5.8C6.4 40.1 14.5 46 24 46z" />
  </svg>
);

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [userType, setUserType] = useState('Donor'); // 'Donor' | 'NGO'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ---- Notices from URL params ----
  const params = new URLSearchParams(location.search);
  const justVerified = params.get('verified') === '1';
  const verifyParam = params.get('verify');
  const verifyNeeded = verifyParam === '1' || verifyParam === 'needed';
  const emailChanged = params.get('emailChanged') === '1';
  const resetSent = params.get('reset') === '1';
  const loggedOut = params.get('loggedOut') === '1';
  const accountDeleted = params.get('deleted') === '1';

  // Handle OAuth redirect (?token=&user=) from backend and store session
  useEffect(() => {
    const tokenFromOAuth = params.get('token');
    const userJson = params.get('user');

    if (tokenFromOAuth) {
      try {
        localStorage.setItem('token', tokenFromOAuth);

        const decoded = decodeJwt(tokenFromOAuth);
        // backend may use "user" or "donor" — normalize to "donor"
        let role = (decoded?.role || 'user').toLowerCase();
        if (role === 'user') role = 'donor';
        localStorage.setItem('role', role);

        if (userJson) {
          const user = JSON.parse(decodeURIComponent(userJson));
          localStorage.setItem('userData', JSON.stringify(user));
        }

        const to = role === 'ngo' ? '/ngoprofile'
          : role === 'donor' ? '/donorprofile'
            : '/';
        navigate(to, { replace: true });
      } catch (e) {
        console.error('OAuth parse error:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userData');
      }
    }
  }, [location.search, navigate, params]);

  // If already authenticated, route the user to the correct profile
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = decodeJwt(token);
    let role = (decoded?.role || localStorage.getItem('role') || '').toLowerCase();
    if (role === 'user') role = 'donor';

    if (role === 'ngo') {
      navigate('/ngoprofile', { replace: true });
    } else if (role === 'donor') {
      navigate('/donorprofile', { replace: true });
    }
  }, [navigate]);

  async function loginTo(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let body = {};
    try { body = await res.json(); } catch (_) { }
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
      const ngoUrl = `${API_BASE}/ngo/login`;
      const primary = userType === 'NGO' ? ngoUrl : donorUrl;
      const fallback = userType === 'NGO' ? donorUrl : ngoUrl;

      const payload = { identifier: identifier.trim(), password };

      let { ok, status, body } = await loginTo(primary, payload);

      if (!ok && status === 401 && body?.error === 'Invalid credentials.') {
        const r2 = await loginTo(fallback, payload);
        if (r2.ok) { ok = true; status = r2.status; body = r2.body; }
      }

      if (!ok) throw new Error(body?.error || `Login failed (${status})`);

      const { token } = body || {};
      if (!token) throw new Error('No token returned from server.');

      localStorage.setItem('token', token);

      const decoded = decodeJwt(token);
      let role = (decoded?.role || userType).toLowerCase();
      if (role === 'user') role = 'donor';
      localStorage.setItem('role', role);

      if (role === 'ngo') {
        navigate('/ngoprofile');
      } else if (role === 'donor') {
        navigate('/donorprofile');
      } else {
        navigate('/');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function getGoogleAuthUrl() {
    return userType === 'NGO'
      ? `${API_BASE}/ngo/auth/google/login`
      : `${API_BASE}/user/auth/google/login`;
  }

  function handleGoogleLogin() {
    window.location.href = getGoogleAuthUrl();
  }

  function goToSignup() {
    navigate('/signup');
  }


  return (
    <div className="login-container">
      <div className="login-left">
        <p className="return-text" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          ← Return Home
        </p>

        <h1 className="welcome-title">Welcome Back to TyebeTyebak!</h1>

        {/* ---- Success notices from URL flags ---- */}
        {(justVerified || verifyNeeded || emailChanged || resetSent || loggedOut || accountDeleted) && (
          <div className="notice-stack" style={{ marginBottom: 12 }}>
            {justVerified && (
              <div className="notice" style={{ color: 'green' }}>
                Your email is verified. Please log in.
              </div>
            )} {verifyNeeded && (
              <div className="notice" style={{ color: 'orange' }}>
                We sent a verification link to your email. Please verify to continue.
              </div>
            )}
            {emailChanged && (
              <div className="notice" style={{ color: 'green' }}>
                Your email was updated successfully. Please log in with the new email.
              </div>
            )}
            {resetSent && (
              <div className="notice" style={{ color: 'green' }}>
                Password reset link sent. Check your inbox.
              </div>
            )}
            {loggedOut && (
              <div className="notice" style={{ color: 'green' }}>
                You’ve been logged out.
              </div>
            )}
            {accountDeleted && (
              <div className="notice" style={{ color: 'green' }}>
                Your account was deleted.
              </div>
            )}
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


          <p className="forgot-password" role="button" tabIndex={0} onClick={() => navigate('/forgot-password')}>
            Forgot your password?
          </p>
          <button className="login-btn" onClick={handleLogin} disabled={loading} type="submit">
            {loading ? 'Logging in…' : 'LOGIN'}
          </button>
        </form>

        {error && <div style={{ color: 'crimson', marginTop: 10 }}>{error}</div>}

        <p className="signup-prompt">
          Don't have an account{' '}
          <span
            className="signup-link"
            onClick={goToSignup}
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

        <button className="google-btn" onClick={handleGoogleLogin}>
          <GoogleIcon />
          Google
        </button>
      </div>

      <div className="login-image" />
    </div>
  );
}
