// src/pages/NGOSignUp/NGOSignUp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './NgoSignUp.css';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import L from "leaflet";
import greyMarkerImage from '../../assets/grey-map-marker.png';
import { isValidLatLng, CoordinatesPicker } from '../../components/CoordinatesPicker/coordinatespicker'

const ngoIcon = new L.Icon({
  iconUrl: greyMarkerImage,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultCenter = [33.8938, 35.5018]; // Beirut

// ✅ unified API base (same style as NGOProfile)
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: '10px' }}>
    <path fill="#4285F4" d="M24 9.5c3.2 0 6.1 1.1 8.3 3.3l6.2-6.2C33.7 3.5 29.1 2 24 2 14.6 2 6.5 7.7 3 16.5l7.5 5.8C12.4 17 17.8 14 24 14z" />
    <path fill="#34A853" d="M46.5 24c0-1.6-.2-3.1-.6-4.5H24v9h12.7c-.5 3-2.9 5.5-6.1 6.4l7.5 5.8c4.3-4 6.9-10 6.9-16.7z" />
    <path fill="#FBBC05" d="M10.5 28.3c-.3-1-.5-2.1-.5-3.3s.2-2.3.5-3.3l-7.5-5.8C.8 20.6 0 22.2 0 24s.8 3.4 2.5 4.8l7.5-5.5z" />
    <path fill="#EA4335" d="M24 44c5.4 0 10-1.8 13.3-4.8l-7.5-5.8c-2.2 1.5-5 2.3-8 2.3-6.1 0-11.3-4.1-13.1-9.7l-7.5 5.8C6.4 40.1 14.5 46 24 46z" />
  </svg>
);

export default function NGOSignUp() {
  const navigate = useNavigate();

  // Map elements!
  const [showMap, setShowMap] = useState(false);

  // ——— URL param handling only; no forced auth for public signup ———
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const userParam = urlParams.get('user');

    if (tokenParam && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('authToken', tokenParam);
        localStorage.setItem('userData', JSON.stringify(userData));
        // Clean the URL after storing
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error parsing user data from URL:', error);
        // Don’t block signup; just clear any partial junk and continue
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }

    // NOTE: We intentionally do NOT redirect if there's no token.
    // Signup stays publicly accessible.
  }, []);
  // ——— END ———

  // >>> Google signup: added tiny handler to kick off OAuth
  const handleGoogleSignup = () => {
    window.location.href = `${API_BASE}/api/ngo/auth/google/signup`;
  };
  // <<< Google signup

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
    inventorySize: '',
    requiredClothing: '',
    logoUrl: '',
    logoFile: null,
    bio: '',
    summary: '',
    coordinates: { lat: null, lng: null }
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: '', form: '' }));
  };

  const validatePage1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'NGO Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    const phoneDigits = (formData.phone || '').replace(/\D/g, '');
    if (!phoneDigits) newErrors.phone = 'Phone number is required';
    else if (!/^\d{6,15}$/.test(phoneDigits)) newErrors.phone = 'Phone number is invalid';

    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validatePage1()) setCurrentPage(2);
  };

  const handleBack = () => setCurrentPage(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePage1()) {
      setCurrentPage(1);
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, form: '' }));

    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('email', formData.email);
      fd.append('phone', (formData.phone || '').replace(/\D/g, ''));
      fd.append('location', formData.location);
      fd.append('password', formData.password);
      if (formData.inventorySize) fd.append('inventorySize', String(formData.inventorySize));
      if (formData.requiredClothing) fd.append('requiredClothing', formData.requiredClothing);
      if (formData.bio) fd.append('bio', formData.bio);
      if (formData.summary) fd.append('summary', formData.summary);
      if (formData.logoFile) fd.append('logo', formData.logoFile); // must match multer field
      if (formData.coordinates.lat && formData.coordinates.lng) {
        fd.append('coordinates[lat]', formData.coordinates.lat);
        fd.append('coordinates[lng]', formData.coordinates.lng);
      }


      const res = await fetch(`${API_BASE}/ngo/create`, {
        method: 'POST',
        body: fd
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors((prev) => ({ ...prev, form: data.error || 'Signup failed' }));
        setIsSubmitting(false);
        return;
      }

      alert('Signup successful! Please check your email to verify your account.');
      navigate('/login'); // or go to home '/', your call
    } catch (err) {
      console.error('Signup error:', err);
      setErrors((prev) => ({ ...prev, form: 'Network error. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-left">
        <p className="return-text" onClick={() => navigate('/')}>
          ← Back Home
        </p>
        <h1 className="signup-title">Create Your NGO Account</h1>

        <form onSubmit={handleSubmit} className="signup-form" noValidate>
          {errors.form && <div className="error-msg" style={{ marginBottom: 10 }}>{errors.form}</div>}

          {/* Page 1 */}
          <div className={`form-page ${currentPage === 1 ? 'active' : 'hidden'}`}>
            <div className="input-group">
              <input
                className="signup-input"
                name="name"
                placeholder="NGO Name *"
                value={formData.name}
                onChange={handleChange}
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby="name-error"
              />
              {errors.name && <div id="name-error" className="error-msg">{errors.name}</div>}
            </div>

            <div className="input-group">
              <input
                className="signup-input"
                name="email"
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby="email-error"
              />
              {errors.email && <div id="email-error" className="error-msg">{errors.email}</div>}
            </div>

            <div className="input-group phone-container">
              <PhoneInput
                country={'lb'}
                value={formData.phone}
                onChange={(phone) => {
                  setFormData({ ...formData, phone });
                  setErrors((prev) => ({ ...prev, phone: '', form: '' }));
                }}
                inputProps={{
                  name: 'phone',
                  required: true,
                  className: 'phone-input',
                  autoFocus: false,
                  autoComplete: 'tel',
                  placeholder: 'Phone Number *'
                }}
                buttonClass="phone-button"
              />
              {errors.phone && <div className="error-msg">{errors.phone}</div>}
            </div>

            {/* Location input (unchanged) */}
            <div className="input-group">
              <input
                className="signup-input"
                name="location"
                placeholder="Location *"
                value={formData.location}
                onChange={handleChange}
                aria-invalid={errors.location ? "true" : "false"}
                aria-describedby="location-error"
              />
              {errors.location && <div id="location-error" className="error-msg">{errors.location}</div>}
            </div>

            {/* Coordinates picker */}
            <div className="input-group">
              <input
                className="signup-input"
                name="coordinatesDisplay"
                placeholder="Coordinates (click button to select)"
                value={
                  formData.coordinates.lat && formData.coordinates.lng
                    ? `${formData.coordinates.lat.toFixed(5)}, ${formData.coordinates.lng.toFixed(5)}`
                    : ''
                }
              />
              <button
                type="button"
                className="signup-btn"
                onClick={() => setShowMap(true)}
                style={{ marginTop: '5px' }}
              >
                Select Coordinates on Map
              </button>
            </div>

            {/* Password */}
            <div className="input-group password-field">
              <input
                className="signup-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password *"
                value={formData.password}
                onChange={handleChange}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby="password-error"
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPassword(!showPassword); }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
              {errors.password && <div id="password-error" className="error-msg">{errors.password}</div>}
            </div>

            {/* Confirm password */}
            <div className="input-group password-field">
              <input
                className="signup-input"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleChange}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby="confirmPassword-error"
              />
              <span
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowConfirmPassword(!showConfirmPassword); }}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
              {errors.confirmPassword && <div id="confirmPassword-error" className="error-msg">{errors.confirmPassword}</div>}
            </div>
          </div>

          {/* Page 2 */}
          <div className={`form-page ${currentPage === 2 ? 'active' : 'hidden'}`}>
            <div className="input-group">
              <input
                className="signup-input"
                name="inventorySize"
                type="number"
                placeholder="Inventory Size (optional)"
                value={formData.inventorySize}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="input-group">
              <input
                className="signup-input"
                name="requiredClothing"
                placeholder="Required Clothing (optional)"
                value={formData.requiredClothing}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <textarea
                className="signup-input"
                name="bio"
                placeholder="Bio (optional)"
                value={formData.bio}
                onChange={handleChange}
                rows="3"
              />
            </div>
            <div className="input-group">
              <textarea
                className="signup-input"
                name="summary"
                placeholder="Summary (optional)"
                value={formData.summary}
                onChange={handleChange}
                rows="3"
              />
            </div>
            <div className="input-group logo-upload-row">
              <label htmlFor="logoUrl" className="custom-file-label">
                Choose Logo
              </label>
              <input
                id="logoUrl"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  if (file) {
                    setFormData({ ...formData, logoUrl: file.name, logoFile: file });
                    setErrors((prev) => ({ ...prev, form: '' }));
                  }
                }}
                className="real-file-input"
              />
              <span className="file-name-display">
                {formData.logoUrl || 'No file selected'}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="nav-buttons">
            {currentPage === 1 && (
              <button
                type="button"
                className="nav-arrow next-arrow"
                onClick={handleNext}
                aria-label="Go to next page"
              >
                <ChevronRight size={20} />
              </button>
            )}
            {currentPage === 2 && (
              <>
                <button
                  type="button"
                  className="nav-arrow back-arrow"
                  onClick={handleBack}
                  aria-label="Go to previous page"
                  disabled={isSubmitting}
                >
                  <ChevronLeft size={20} />
                </button>

                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </>
            )}
          </div>
        </form>

        {/* Divider and Google button */}
        <div className="login-divider">
          <div className="line" />
          <span>Or Sign Up with</span>
          <div className="line" />
        </div>

        <button
          className="google-btn"
          onClick={handleGoogleSignup}
        >
          <GoogleIcon />
          Google
        </button>
      </div>

      <div className="login-image" />


      {showMap && (
        <CoordinatesPicker
          initialCoordinates={
            isValidLatLng(formData.coordinates)
              ? formData.coordinates
              : defaultCenter
          }
          initialLocation={formData.location}
          onSave={(coords, name) =>
            setFormData({
              ...formData,
              coordinates: coords,
              location: name || formData.location,
            })
          }
          onClose={() => setShowMap(false)}
          markerIcon={ngoIcon}
        />
      )}


    </div>
  );

}
