import React from 'react';
import './NavBar.css';

export default function NavBar() {
    return (
        <header className="navbar">
            <div className="navbar__logo">WarmHands</div>

            <nav className="navbar__menu">
                <a href="/" className="navbar__menu-item active">Home</a>
                <a href="/guide" className="navbar__menu-item">Guide</a>
                <a href="/donations" className="navbar__menu-item">Donations</a>
                <a href="/partners" className="navbar__menu-item">Our Partners</a>
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

                <button className="navbar__login-btn">Login</button>
            </div>
        </header>
    );
}
