import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './NgoSignUp.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    bio: '',
    summary: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' }); // clear error on change
  };

  const validatePage1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'NGO Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{6,15}$/.test(formData.phone)) newErrors.phone = 'Phone number is invalid';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // No validation here — just move to page 2
    setCurrentPage(2);
  };

  const handleBack = () => {
    setCurrentPage(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validatePage1()) {
      setCurrentPage(1);
      return;
    }
    console.log('NGO sign-up data:', formData);
    // TODO: submit logic here
  };

  return (
    <div className="signup-container">
      <div className="signup-left">
        <p className="return-text" onClick={() => navigate('/')}>
          ← Back Home
        </p>
        <h1 className="signup-title">Create Your NGO Account</h1>
        <form onSubmit={handleSubmit} className="signup-form" noValidate>
          {/* Page 1 - Required fields */}
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
                onChange={(phone) => setFormData({ ...formData, phone })}
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

            <div className="input-group password-field">
              <input
                className="signup-input"
                type="password"
                name="password"
                placeholder="Password *"
                value={formData.password}
                onChange={handleChange}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby="password-error"
              />
              {errors.password && <div id="password-error" className="error-msg">{errors.password}</div>}
            </div>

            <div className="input-group password-field">
              <input
                className="signup-input"
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleChange}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby="confirmPassword-error"
              />
              {errors.confirmPassword && <div id="confirmPassword-error" className="error-msg">{errors.confirmPassword}</div>}
            </div>
          </div>

          {/* Page 2 - Optional fields */}
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
              <label htmlFor="logoUrl" className="logo-upload-label">Upload Logo (optional)</label>
              <input
                className="signup-input"
                id="logoUrl"
                name="logoUrl"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setFormData({ ...formData, logoUrl: URL.createObjectURL(file) });
                  }
                }}
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
          </div>

          {/* Navigation buttons */}
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
                >
                  <ChevronLeft size={20} />
                </button>
                <button type="submit" className="submit-btn">
                  Submit
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
