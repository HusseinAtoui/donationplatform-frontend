import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutSection.css';
import AboutIllustration from '../../assets/login-illustration.jpg';

const AboutSection = () => {
    const navigate = useNavigate();

    const handleLearnMore = () => {
        navigate('/about');
    };

    return (
        <section className="about-section" id="about-us">
            <div className="about-content">
                <div className="about-text">
                    <h2>About Us</h2>
                    <p className="about__description">
                        At TyebeTyebak, we believe generosity shouldn’t be complicated —
                        and help shouldn’t feel out of reach. We're a community-powered
                        platform that connects your gently used clothing and essentials with local shelters,
                        nonprofits, and families in need. Whether it’s a winter coat, a school bag, or a care kit
                        — we help turn what you already have into real support for someone nearby.
                        Every donation tells someone: you matter. Our mission is simple: make giving easier,
                        more personal, and deeply human.
                    </p>

                    <button className="about-button" onClick={handleLearnMore}>
                        Learn More
                    </button>
                </div>

                <div className="about-image">
                    <img src={AboutIllustration} alt="About illustration" />
                </div>
            </div>

            <div className="about-separator-bar"></div>
        </section>
    );
};

export default AboutSection;
