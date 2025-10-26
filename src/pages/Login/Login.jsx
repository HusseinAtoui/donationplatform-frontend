// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import './Login.css';

const API_BASE = ('http://localhost:4000/api').replace(/\/+$/, '');

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
  const [searchParams] = useSearchParams();

  // actor comes from reset links: ?actor=ngo | user
  const actorParam = (searchParams.get('actor') || '').toLowerCase();
  const [actorHint, setActorHint] = useState(actorParam);

  const resetToken = searchParams.get('token') || '';
  const tokenLooksJwt = resetToken && resetToken.split('.').length === 3;
  const initialIsReset = !!resetToken && (!tokenLooksJwt || !!actorParam);
  const [view, setView] = useState(initialIsReset ? 'reset' : 'login');

  // Login form state
  const [userType, setUserType] = useState('Donor'); // 'Donor' | 'NGO'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot form state
  const [fpEmail, setFpEmail] = useState('');
  const [fpMsg, setFpMsg] = useState('');
  const [fpStatus, setFpStatus] = useState('idle'); // 'idle' | 'ok' | 'error'
  const [fpLoading, setFpLoading] = useState(false);

  // Reset form state
  const [rpPassword, setRpPassword] = useState('');
  const [rpMsg, setRpMsg] = useState('');
  const [rpLoading, setRpLoading] = useState(false);

  // Notices from URL (read once per render via useSearchParams; no params object)
  const justVerified     = searchParams.get('verified') === '1';
  const verifyParam      = searchParams.get('verify');
  const verifyNeeded     = verifyParam === '1' || verifyParam === 'needed';
  const emailChanged     = searchParams.get('emailChanged') === '1';
  const resetSent        = searchParams.get('reset') === '1';
  const loggedOut        = searchParams.get('loggedOut') === '1';
  const accountDeleted   = searchParams.get('deleted') === '1';
  const awaitingApproval = searchParams.get('awaitingApproval') === '1';
  const rejected         = searchParams.get('rejected') === '1';

  useEffect(() => {
    // persist actor from link and keep view in sync if token/actor changes
    if (actorParam) setActorHint(actorParam);
    const looksJwt = resetToken && resetToken.split('.').length === 3;
    setView(resetToken && (!looksJwt || !!actorParam) ? 'reset' : 'login');
  }, [resetToken, actorParam]);

  // Handle OAuth redirect (?token=<JWT>&user=...)
  useEffect(() => {
    // ✅ Build URLSearchParams INSIDE the effect; depend on location.search only.
    const sp = new URLSearchParams(location.search);
    const tokenFromOAuth = sp.get('token');
    const userJson = sp.get('user');
    const mightBeJwt = tokenFromOAuth && tokenFromOAuth.split('.').length === 3;

        if (mightBeJwt) {
      try {
        localStorage.setItem('token', tokenFromOAuth);
        const decoded = decodeJwt(tokenFromOAuth);
        let role = (decoded?.role || 'user').toLowerCase();
        if (role === 'user') role = 'donor';
        localStorage.setItem('role', role);

        if (userJson) {
          const user = JSON.parse(decodeURIComponent(userJson));
          localStorage.setItem('userData', JSON.stringify(user));
        }

        const to =
          role === 'ngo'   ? '/ngoprofile' :
          role === 'donor' ? '/donorprofile' :
          role === 'admin' ? '/admin'    : '/';
        navigate(to, { replace: true });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userData');
      }
    }
  }, [location.search, navigate]);

  // If already authenticated, route them to their dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const decoded = decodeJwt(token);
    let role = (decoded?.role || localStorage.getItem('role') || '').toLowerCase();
    if (role === 'user') role = 'donor';
  if (role === 'ngo') navigate('/ngoprofile', { replace: true });
  else if (role === 'donor') navigate('/donorprofile', { replace: true });
  else if (role === 'admin') navigate('/admin', { replace: true });
  }, [navigate]);

  async function loginTo(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    let body = {};
    try { body = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, body };
  }

  // ----- Forgot Password -----
  async function handleForgot(e) {
    e?.preventDefault?.();
    setFpMsg('');
    setFpStatus('idle');

    if (!fpEmail) {
      setFpMsg('Please enter your email.');
      setFpStatus('error');
      return;
    }

    try {
      setFpLoading(true);
      // Try NGO first, then User. We return a generic success message either way.
      const ngoRes = await fetch(`${API_BASE}/ngo/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail.trim().toLowerCase() }),
      });
      if (!ngoRes.ok) {
        await fetch(`${API_BASE}/user/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: fpEmail.trim().toLowerCase() }),
        }).catch(() => {});
      }
      setFpMsg('If the email exists, a reset link has been sent.');
      setFpStatus('ok');
    } catch {
      setFpMsg('Network error. Please try again.');
      setFpStatus('error');
    } finally {
      setFpLoading(false);
    }
  }

  // ----- Login (Donor/NGO; Admin piggybacks on NGO) -----
  async function handleLogin(e) {
    e?.preventDefault?.();
    setError('');

    if (!identifier || !password) {
      setError('Please fill all fields.');
      return;
    }

    try {
      setLoading(true);

      if (userType === 'Donor') {
        // normal donor route
        const { ok, status, body } = await loginTo(`${API_BASE}/user/login`, {
          identifier: identifier.trim(),
          password
        });
        if (!ok) throw new Error(body?.error || `Login failed (${status})`);
        const { token } = body || {};
        if (!token) throw new Error('No token returned from server.');
        localStorage.setItem('token', token);
        const decoded = decodeJwt(token);
        let role = (decoded?.role || 'donor').toLowerCase();
        if (role === 'user') role = 'donor';
        localStorage.setItem('role', role);
        navigate('/donorprofile');
        return;
      }

      // userType === 'NGO' → try NGO first
      const payload = { identifier: identifier.trim(), password };

      let r = await loginTo(`${API_BASE}/ngo/login`, payload);

      // If NGO login returns 401 for ANY reason, transparently try ADMIN login
      if (!r.ok && r.status === 401) {
        const admin = await loginTo(`${API_BASE}/ngo/admin/login`, {
          email: identifier.trim().toLowerCase(),
          password
        });

        if (admin.ok) {
          const { token } = admin.body || {};
          if (!token) throw new Error('No token returned from server.');
          localStorage.setItem('token', token);
          localStorage.setItem('role', 'admin');
          navigate('/admin');
          return;
        }

        // (optional) last fallback: maybe the user picked NGO but is a donor
        r = await loginTo(`${API_BASE}/user/login`, payload);
      }

      if (!r.ok) {
        // bubble up helpful NGO review messages
        if (r.status === 403 && r.body?.error) throw new Error(r.body.error);
        throw new Error(r.body?.error || `Login failed (${r.status})`);
      }

      // Successful NGO login
      const { token } = r.body || {};
      if (!token) throw new Error('No token returned from server.');
      localStorage.setItem('token', token);
      const decoded = decodeJwt(token);
      let role = (decoded?.role || 'ngo').toLowerCase();
      localStorage.setItem('role', role);
      navigate('/ngoprofile');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ----- Reset Password -----
  async function handleReset(e) {
    e.preventDefault();
    setRpMsg('');

    if (!resetToken) { setRpMsg('Missing or invalid reset token.'); return; }
    if (!rpPassword) { setRpMsg('Please enter a new password.'); return; }

    try {
      setRpLoading(true);

      let endpoints = [];
      if (actorHint === 'ngo') endpoints = [`${API_BASE}/ngo/reset-password`];
      else if (actorHint === 'user') endpoints = [`${API_BASE}/user/reset-password`];
      else endpoints = [`${API_BASE}/ngo/reset-password`, `${API_BASE}/user/reset-password`];

      let success = false, lastError = '';
      for (const url of endpoints) {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, password: rpPassword }),
        });
        let data = {};
        try { data = await res.json(); } catch {}
        if (res.ok) { success = true; break; }
        else lastError = data?.error || 'Reset failed.';
      }

      if (success) {
        setRpMsg('Password reset successful! Redirecting to login…');
        setTimeout(() => { setView('login'); navigate('/login', { replace: true }); }, 1500);
      } else {
        setRpMsg(lastError || 'Reset failed.');
      }
    } catch {
      setRpMsg('Network error.');
    } finally {
      setRpLoading(false);
    }
  }

  // ----- UI -----
  return (
    <div className="login-container">
      <div className="login-left">
        <p className="return-text" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          ← Return Home
        </p>

        <h1 className="welcome-title">
          {view === 'login' ? 'Welcome Back to TyebeTyebak!' : ' '}
        </h1>

        {/* Notices */}
        {view === 'login' && (justVerified || verifyNeeded || emailChanged || resetSent || loggedOut || accountDeleted || awaitingApproval || rejected) && (
          <div className="notice-stack" style={{ marginBottom: 12 }}>
            {justVerified     && <div className="notice" style={{ color: 'green'  }}>Your email is verified. Please log in.</div>}
            {verifyNeeded     && <div className="notice" style={{ color: 'orange' }}>We sent a verification link to your email. Please verify to continue.</div>}
            {emailChanged     && <div className="notice" style={{ color: 'green'  }}>Your email was updated successfully. Please log in with the new email.</div>}
            {resetSent        && <div className="notice" style={{ color: 'green'  }}>Password reset link sent. Check your inbox.</div>}
            {loggedOut        && <div className="notice" style={{ color: 'green'  }}>You’ve been logged out.</div>}
            {accountDeleted   && <div className="notice" style={{ color: 'green'  }}>Your account was deleted.</div>}
            {awaitingApproval && <div className="notice" style={{ color: 'orange' }}>Your NGO application is awaiting admin approval.</div>}
            {rejected         && <div className="notice" style={{ color: 'crimson' }}>Your NGO application was rejected.</div>}
          </div>
        )}

        {/* ===== Views ===== */}
        {view === 'login' && (
          <>
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
              <label className="input-label">{userType === 'Donor' ? 'Email or Phone' : 'Email'}</label>
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

              <p className="forgot-password" role="button" tabIndex={0} onClick={() => setView('forgot')}>
                Forgot your password?
              </p>
              <button className="login-btn" disabled={loading} type="submit">
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

            {/* Google OAuth for Donor/NGO only (admins use email+password via NGO tab) */}
            <button
              className="google-btn"
              onClick={() => {
                const url = userType === 'NGO'
                  ? `${API_BASE}/ngo/auth/google/login`
                  : `${API_BASE}/user/auth/google/login`;
                window.location.href = url;
              }}
            >
              <GoogleIcon /> Google
            </button>
          </>
        )}

        {view === 'forgot' && (
          <div className="auth-card">
            <h2 className="forgot-heading">Forgot Password</h2>
            <p className="subtle-text">Enter your email and we’ll send you a secure reset link.</p>

            <form onSubmit={handleForgot}>
              <label className="input-label">Email</label>

              {/* FLEX wrapper = perfect vertical centering */}
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6zm2 .5v.4l8 5 8-5v-.4L12 11 4 6.5z" />
                </svg>
                <input
                  className="login-input"
                  type="email"
                  value={fpEmail}
                  onChange={(e) => setFpEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              {fpMsg && (
                <div className={`alert ${fpStatus === 'ok' ? 'alert-success' : 'alert-error'}`}>
                  {fpMsg}
                </div>
              )}

              <div className="stack gap-8">
                <button className="login-btn" type="submit" disabled={fpLoading}>
                  {fpLoading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </div>

              <p className="ghost-link" onClick={() => setView('login')}>
                Back To Login
              </p>
            </form>
          </div>
        )}

        {view === 'reset' && (
          <div className="auth-card">
            <h2 className="forgot-heading">Reset Password</h2>
            <p className="subtle-text">Set a new password for your account.</p>
            <form onSubmit={handleReset}>
              <label className="input-label">New Password</label>
              <input
                className="login-input"
                type="password"
                value={rpPassword}
                onChange={(e) => setRpPassword(e.target.value)}
                placeholder="Enter a new password"
                required
              />

              {rpMsg && (
                <div className={`alert ${rpMsg.startsWith('Password reset successful') ? 'alert-success' : 'alert-error'}`}>
                  {rpMsg}
                </div>
              )}

              <button className="login-btn" type="submit" disabled={rpLoading}>
                {rpLoading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="login-image" />
    </div>
  );
}

