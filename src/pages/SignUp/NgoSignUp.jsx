import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './NgoSignUp.css';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

// ✅ unified API base (same style as NGOProfile)
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

export default function NGOSignUp() {
  const navigate = useNavigate();

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
    summary: ''
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

      // ✅ use API_BASE
      const res = await fetch(`${API_BASE}/api/ngo/create`, {
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
      navigate('/');
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
                aria-invalid={errors.name ? 'true' : 'false'}
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
                aria-invalid={errors.email ? 'true' : 'false'}
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

            <div className="input-group">
              <input
                className="signup-input"
                name="location"
                placeholder="Location *"
                value={formData.location}
                onChange={handleChange}
                aria-invalid={errors.location ? 'true' : 'false'}
                aria-describedby="location-error"
              />
              {errors.location && <div id="location-error" className="error-msg">{errors.location}</div>}
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
      </div>

      <div className="login-image" />
    </div>
  );
}
