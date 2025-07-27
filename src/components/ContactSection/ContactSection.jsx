import React from 'react';
import './ContactSection.css';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';

const ContactSection = () => {
  return (
    <section className="contact-container">
      {/* Form side */}
      <div className="contact-form-wrapper">
        <form className="contact-form">
          <div className="form-group-row">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" placeholder="Enter your first name" />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" placeholder="Enter your last name" />
            </div>
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="Enter your email" />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea placeholder="Write your message" />
          </div>
          <button type="submit">Send Message</button>
        </form>
      </div>

      {/* Info side */}
      <div className="contact-info-wrapper">
        <div className="contact-info-text">
          <h2>Feel free to contact us</h2>
          <p>
            Have a question? Want to partner with us? Need help donating or registering your NGO?
            We’d love to hear from you. Whether you’re a donor, an organization, or simply someone who wants to help — we’re here.
          </p>
        </div>

        <div className="contact-info-items">
          <div className="info-item">
            <div className="icon-bg"><FiMapPin /></div>
            <span>8592 Fairground St. Tallahassee, FL 32303</span>
          </div>
          <div className="info-item">
            <div className="icon-bg"><FiMail /></div>
            <span>rgarton@outlook.com</span>
          </div>
          <div className="info-item">
            <div className="icon-bg"><FiPhone /></div>
            <span>+775 378-6348</span>
          </div>
          <div className="info-item">
            <div className="icon-bg"><FiClock /></div>
            <span>Mon - Fri: 10AM - 10PM</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
