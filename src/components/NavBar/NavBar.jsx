import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './NavBar.css';

export default function NavBar() {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);

    const closeMobileMenu = () => setMobileMenuOpen(false);

    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isMobileMenuOpen]);

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <header className="navbar">
                <div className="navbar__logo">WarmHands</div>

                {/* Desktop + mobile menu */}
                <nav className={`navbar__menu ${isMobileMenuOpen ? 'navbar__menu--open' : ''}`}>
                    <Link to="/" className={`navbar__menu-item ${isActive('/') ? 'active' : ''}`} onClick={closeMobileMenu}>Home</Link>
                    <Link to="/guide" className={`navbar__menu-item ${isActive('/guide') ? 'active' : ''}`} onClick={closeMobileMenu}>Guide</Link>
                    <Link to="/map" className={`navbar__menu-item ${isActive('/map') ? 'active' : ''}`} onClick={closeMobileMenu}>Map</Link>
                    <Link to="/donations" className={`navbar__menu-item ${isActive('/donations') ? 'active' : ''}`} onClick={closeMobileMenu}>Donations</Link>
                    <Link to="/our-partners" className={`navbar__menu-item ${isActive('/our-partners') ? 'active' : ''}`} onClick={closeMobileMenu}>Our Partners</Link>
              
                </nav>

                {/* Right side: login + hamburger */}
                <div className="navbar__actions">
                    <Link to="/login" className="navbar__login-icon" aria-label="Login">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="7" r="4" />
                            <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
                        </svg>
                    </Link>

                    <button className={`navbar__hamburger ${isMobileMenuOpen ? 'open' : ''}`} onClick={toggleMobileMenu} aria-label="Toggle navigation menu">
                        <span className="hamburger__line"></span>
                        <span className="hamburger__line"></span>
                        <span className="hamburger__line"></span>
                    </button>
                </div>
            </header>

            {/* Overlay always closes menu when clicked */}
            {isMobileMenuOpen && <div className="navbar__overlay" onClick={closeMobileMenu}></div>}
        </>
    );
}
