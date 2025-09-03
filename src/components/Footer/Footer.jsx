import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-inner">
        {/* Logo + Description */}
        <div className="footer-logo-desc">
          <div className="footer-logo">
            <span>TyebeTyebak</span>
          </div>
          <p>
            TyebeTyebak connects donors with local shelters and nonprofits to deliver clothing, essentials, and care where it’s needed most.
          </p>
        </div>

        {/* Links Wrapper */}
        <div className="footer-links-wrapper">
          {/* Company Links */}
          <div className="footer-links-group">
            <h3>Company</h3>
            <ul>
              <li><a href="#what-we-do">What do we do</a></li>
              <li><a href="#about-us">About Us</a></li>
              <li><a href="#contact-us">Contact Us</a></li>
            </ul>
          </div>

          {/* Customer Service Links */}
          <div className="footer-links-group">
            <h3>Customer Service</h3>
            <ul>
              <li><Link to="/guide">Donation Guide</Link></li>
              <li><Link to="/map">Map</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
