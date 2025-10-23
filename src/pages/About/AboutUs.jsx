// AboutUs.jsx
import React from 'react';
import './AboutUs.css';

export default function AboutUs() {
  return (
    <div className="about-page">
      {/* Hero */}
      <section className="hero-section">
        <div className="hero-container">
          <span className="hero-tag">About TyebeTyebak</span>
          <h1>Bridging hearts, one donation at a time</h1>
          <p>
            We're students from AUB who built a platform that makes giving transparent, 
            simple, and impactful. No fluff—just real connections between people who want 
            to help and organizations that need support.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="story-section">
        <div className="content-wrapper">
          <div className="story-grid">
            <div className="story-text">
              <h2>How we started</h2>
              <p>
                Summer 2025. A group of AUB students realized something was broken in 
                Lebanon's donation system. People wanted to give, NGOs desperately needed 
                items, but there was no clear way to connect them.
              </p>
              <p>
                With mentorship from Women in Engineering (WIE), we built the first version. 
                Now, as part of the AUB Social Work Club, we're scaling a platform that 
                brings real-time transparency to every donation.
              </p>
              <div className="story-badges">
                <div className="story-badge">
                  <div className="badge-circle">WIE</div>
                  <span>Mentored by</span>
                </div>
                <div className="story-badge">
                  <div className="badge-circle">SWC</div>
                  <span>Supported by</span>
                </div>
              </div>
            </div>
            <div className="story-image">
              <div className="image-placeholder">
                <span className="emoji">🎓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <div className="content-wrapper">
          <h2>How TyebeTyebak works</h2>
          <div className="how-steps">
            <div className="step">
              <div className="step-num">1</div>
              <p>NGOs post real-time item requests</p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <p>You search by category, location, or urgency</p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <p>Drop off items or schedule a pickup</p>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <p>Track your donation from start to finish</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Different */}
      <section className="why-section">
        <div className="content-wrapper">
          <h2>Why we're different</h2>
          <div className="why-grid">
            <div className="why-card">
              <span className="why-icon">👁️</span>
              <h3>Total transparency</h3>
              <p>See exactly where your donation goes, in real-time. No black boxes.</p>
            </div>
            <div className="why-card">
              <span className="why-icon">⚡</span>
              <h3>Instant matching</h3>
              <p>Connect with NGOs who need exactly what you're ready to give.</p>
            </div>
            <div className="why-card">
              <span className="why-icon">📍</span>
              <h3>Local focus</h3>
              <p>Find causes near you or filter by what matters most to you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="philosophy-section">
        <div className="content-wrapper">
          <div className="philosophy-content">
            <h2>Built by students who care</h2>
            <p>
              We're not a corporation. We're not trying to reinvent charity. We're just 
              students who saw inefficiency and built a better system.
            </p>
            <p>
              Every line of code, every design decision, every feature exists to make 
              giving easier and more transparent. Because when donations work the way 
              they should, communities thrive.
            </p>
          </div>
        </div>
      </section>

      {/* Connect */}
      <section className="connect-section">
        <div className="content-wrapper">
          <h2>Stay connected</h2>
          <div className="connect-links">
            <a href="https://www.instagram.com/aubsocialworkclub_/" target="_blank" rel="noopener noreferrer" className="connect-link">
              <span className="link-icon">📱</span>
              <div>
                <div className="link-title">Instagram</div>
                <div className="link-sub">@aubsocialworkclub_</div>
              </div>
            </a>
            <a href="https://www.tyebetyebak.org/" className="connect-link">
              <span className="link-icon">🌐</span>
              <div>
                <div className="link-title">Website</div>
                <div className="link-sub">tyebetyebak.org</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="content-wrapper">
          <h2>Ready to start?</h2>
          <p>Browse active donation requests and see how you can help today.</p>
          <div className="cta-buttons">
            <button className="btn-primary">View Donations</button>
            <button className="btn-secondary">See the Map</button>
          </div>
        </div>
      </section>
    </div>
  );
}
