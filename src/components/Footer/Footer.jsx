import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="footer-inner">

                {/* Logo + Description */}
                <div className="footer-logo-desc">
                    <div className="footer-logo">
                        <span>WarmHands</span>
                    </div>
                    <p>
                        WarmHands connects donors with local shelters and nonprofits to deliver clothing, essentials, and care where it’s needed most.
                    </p>
                </div>

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
                        <li><a href="#donation-guide">Donation Guide</a></li>
                        <li><a href="#map">Map</a></li>
                    </ul>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
