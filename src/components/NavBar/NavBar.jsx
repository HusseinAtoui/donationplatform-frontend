import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './NavBar.css';

export default function NavBar() {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);

    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMobileMenuOpen]);

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <header className="navbar">
                <div className="navbar__logo">WarmHands</div>

                <nav className={`navbar__menu ${isMobileMenuOpen ? 'navbar__menu--open' : ''}`}>
                    <Link to="/" className={`navbar__menu-item ${isActive('/') ? 'active' : ''}`}>Home</Link>
                    <Link to="/guide" className={`navbar__menu-item ${isActive('/guide') ? 'active' : ''}`}>Guide</Link>
                    <Link to="/map" className={`navbar__menu-item ${isActive('/map') ? 'active' : ''}`}>Map</Link>
                    <Link to="/donations" className={`navbar__menu-item ${isActive('/donations') ? 'active' : ''}`}>Donations</Link>
                    <Link to="/our-partners" className={`navbar__menu-item ${isActive('/our-partners') ? 'active' : ''}`}>Our Partners</Link>
                           {/* ✅ Add visible text for Donor Profile */}
          <Link to="/DonorProfile" 
                className={`navbar__menu-item ${isActive('/DonorProfile') ? 'active' : ''}`}>
            Donor Profile
          </Link>

          {/* ✅ Add a link to the NGO Profile page */}
          <Link to="/NGOProfile" 
                className={`navbar__menu-item ${isActive('/NGOProfile') ? 'active' : ''}`}>
            NGO Profile
          </Link>
                </nav>

                <div className="navbar__actions">
                    <div className="navbar__search-wrapper">
                        <input type="text" placeholder="Search Donations..." />
                        <button className="navbar__search-btn" aria-label="Search">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="16"
                                width="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="7" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </button>
                    </div>

                    <Link to="/login" className="navbar__login-icon" aria-label="Login">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24"
                            width="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="7" r="4" />
                            <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
                        </svg>
                    </Link>

                    <button
                        className="navbar__hamburger"
                        onClick={toggleMobileMenu}
                        aria-label="Toggle navigation menu"
                    >
                        <span className="hamburger__line"></span>
                        <span className="hamburger__line"></span>
                        <span className="hamburger__line"></span>
                    </button>
                </div>
            </header>

            {isMobileMenuOpen && <div className="navbar__overlay" onClick={toggleMobileMenu}></div>}
        </>
    );
}
