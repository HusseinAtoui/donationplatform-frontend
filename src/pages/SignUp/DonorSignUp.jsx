import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './DonorSignUp.css';
import { Eye, EyeOff } from 'lucide-react';

const API_BASE = 'https://api.tyebetyebak.org';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: '10px' }}>
    <path fill="#4285F4" d="M24 9.5c3.2 0 6.1 1.1 8.3 3.3l6.2-6.2C33.7 3.5 29.1 2 24 2 14.6 2 6.5 7.7 3 16.5l7.5 5.8C12.4 17 17.8 14 24 14z" />
    <path fill="#34A853" d="M46.5 24c0-1.6-.2-3.1-.6-4.5H24v9h12.7c-.5 3-2.9 5.5-6.1 6.4l7.5 5.8c4.3-4 6.9-10 6.9-16.7z" />
    <path fill="#FBBC05" d="M10.5 28.3c-.3-1-.5-2.1-.5-3.3s.2-2.3.5-3.3l-7.5-5.8C.8 20.6 0 22.2 0 24s.8 3.4 2.5 4.8l7.5-5.5z" />
    <path fill="#EA4335" d="M24 44c5.4 0 10-1.8 13.3-4.8l-7.5-5.8c-2.2 1.5-5 2.3-8 2.3-6.1 0-11.3-4.1-13.1-9.7l-7.5 5.8C6.4 40.1 14.5 46 24 46z" />
  </svg>
);

export default function DonorSignUp() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefillEmail = params.get('email');
    if (prefillEmail) setFormData((s) => ({ ...s, email: prefillEmail }));

    const tokenParam = params.get('token');
    const userParam = params.get('user');

    if (tokenParam && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('token', tokenParam);
        localStorage.setItem('role', 'user');
        localStorage.setItem('userData', JSON.stringify(userData));
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error parsing user data from URL:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userData');
      }
    }
  }, []);

  const handleGoogleSignup = () => {
    window.location.href = `${API_BASE}/user/auth/google/signup`;
  };

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
    if (!formData.firstName.trim() || !formData.lastName.trim()) return 'Please enter your first and last name.';
    if (!formData.email.trim()) return 'Please enter your email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) return 'Please enter a valid email.';
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
    if (v) return setErr(v);

    const payload = {
      email: formData.email.trim(),
      phone: `+${String(formData.phone).replace(/\s+/g, '')}`,
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      location: '',
      avatarUrl: '',
      bio: '',
      password: formData.password,
    };

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/user/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Signup failed.');
      setOkMsg('Account created. Check your email to verify your account.');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-left">
        <div className="scroll-wrapper">
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

          <div className="login-divider" style={{ marginTop: 16 }}>
            <div className="line" />
            <span>Or Sign Up with</span>
            <div className="line" />
          </div>

          <button className="google-btn" onClick={handleGoogleSignup}>
            <GoogleIcon />
            Google
          </button>

          <p className="login-prompt" style={{ marginTop: 16 }}>
            Already have an account?{' '}
            <span className="login-link" onClick={() => navigate('/login')} role="button" tabIndex={0}>
              Login
            </span>
          </p>
        </div>
      </div>
      <div className="login-image" />
    </div>
  );
}
