import React, { useState } from 'react';
import emailjs from 'emailjs-com';
import './ContactSection.css';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';

const SERVICE_ID = 'your_service_id';
const TEMPLATE_ID = 'your_template_id';
const PUBLIC_KEY = 'your_public_key';

const ContactSection = () => {
  const [formData, setFormData] = useState({ first: '', last: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        first_name: formData.first,
        last_name: formData.last,
        email: formData.email,
        message: formData.message,
      },
      PUBLIC_KEY
    )
    .then(() => {
      setStatus('Message sent successfully!');
      setFormData({ first: '', last: '', email: '', message: '' });
    })
    .catch(() => {
      setStatus('Failed to send message. Please try again.');
    });
  };

  return (
    <section className="contact-container" id="contact-us">
      <div className="contact-form-wrapper">
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="first"
                value={formData.first}
                onChange={handleChange}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="last"
                value={formData.last}
                onChange={handleChange}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Write your message"
              required
            />
          </div>
          <button type="submit">Send Message</button>
          {status && <p className="status">{status}</p>}
        </form>
      </div>

      <div className="contact-info-wrapper">
        <div className="contact-info-text">
          <h2>Feel free to contact us</h2>
          <p>
            Have a question? Want to partner with us? Need help donating or registering your NGO?
            We’d love to hear from you.
          </p>
        </div>
        <div className="contact-info-items">
          <div className="info-item"><div className="icon-bg"><FiMapPin /></div><span>American University of Beirut</span></div>
          <div className="info-item"><div className="icon-bg"><FiMail /></div><span>tyebtyebak@gmail.com</span></div>
          <div className="info-item"><div className="icon-bg"><FiPhone /></div><span>+961 81 917 649</span></div>
          <div className="info-item"><div className="icon-bg"><FiClock /></div><span>Mon - Fri: 10AM - 10PM</span></div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
