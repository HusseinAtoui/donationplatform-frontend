import React from 'react';
import './AboutUs.css';
import Footer from '../../components/Footer/Footer';

export default function AboutUs() {
  return (
    <div className="about-page">
      {/* Hero */}
      <section className="hero-section">
        <div className="hero-container">
          <span className="hero-tag">About TyebeTyebak</span>
          <h1>Bridging hearts, one donation at a time</h1>
          <p>
            TyebeTyebak is a student-led initiative from AUB dedicated to making giving simple,
            transparent, and meaningful. We connect donors with NGOs in real time, ensuring every
            contribution directly reaches those who need it most.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="story-section">
        <div className="content-wrapper">
          <div className="story-text">
            <h2>Our Story</h2>
            <p>
              In the summer of 2025, a group of AUB students recognized a gap in Lebanon’s donation
              system—people wanted to help, NGOs needed support, but there was no easy way to connect them.
            </p>
            <p>
              With mentorship from Women in Engineering (WIE) and the support of the AUB Social Work Club (SWC),
              we built TyebeTyebak: a platform that bridges communities through trust and transparency.
            </p>
            <p>
              Today, we continue to grow with one goal in mind—turning generosity into impact,
              one donation at a time.
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
        </div>
      </section>

      {/* SWC Section */}
      <section className="swc-section">
        <div className="content-wrapper">
          <h2>The AUB Social Work Club</h2>
          <p>
            The <strong>Social Work Club (SWC)</strong> at the American University of Beirut is one of the most active
            student-led organizations dedicated to service, empathy, and social change. SWC provides a platform
            for students to initiate projects that address real issues in Lebanese communities—empowering
            them to lead with both heart and action.
          </p>
          <p>
            Our partnership with SWC allows TyebeTyebak to operate under a strong framework of community engagement
            and transparency. Through this collaboration, students from various majors contribute their skills,
            creativity, and time to build a sustainable donation network that truly makes a difference.
          </p>
          <div className="swc-highlight">
            <div className="swc-quote">
              <p>
                “The Social Work Club believes in collective effort—when compassion meets innovation,
                real change begins.”
              </p>
              <span>— AUB Social Work Club</span>
            </div>
            <a
              href="https://www.instagram.com/aubsocialworkclub_/"
              target="_blank"
              rel="noopener noreferrer"
              className="swc-link"
            >
              Follow SWC on Instagram
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
