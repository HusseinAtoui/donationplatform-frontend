// src/pages/Guidelines.jsx
import React from 'react';
import Hero from '../../components/Hero/Hero.jsx';
import './Guidelines.css';
import '../../components/Hero/Hero.css';
import donationImage from '../../assets/donationBox-img.jpg';

export default function Guidelines() {
    const heroData = {
        title: "Donation Guidelines",
        subtitle: "Learn how to contribute effectively and responsibly to our causes. Follow these guidelines to ensure your donations reach those who need them most.",
        buttonText: "Read More",
        image: donationImage, 
        onButtonClick: () => {
            window.scrollTo({ top: 600, behavior: 'smooth' });
        },
    };

    return (
        <div className="guidelines-page">
            {/* Hero Section */}
            <Hero
                title={heroData.title}
                subtitle={heroData.subtitle}
                buttonText={heroData.buttonText}
                image={heroData.image}
                onButtonClick={heroData.onButtonClick}
            />

            {/* Main Guidelines Content */}
            <section className="guidelines-content">
                <div className="guidelines-container">
                    <h2>How to Donate</h2>
                    <p>1. Ensure that your items are in good condition and appropriate for the intended recipients.</p>
                    <p>2. Follow the categories specified on our donation requests to avoid mismatched contributions.</p>
                    <p>3. Use our platform to coordinate drop-offs or pickups with NGOs to streamline delivery.</p>
                    <p>4. Avoid perishable items unless specifically requested, as storage and distribution may be limited.</p>
                    <p>5. Always include accurate counts, sizes, or descriptions of the items you are donating.</p>

                    <h2>Contacting NGOs</h2>
                    <p>Reach out through the platform to clarify any doubts or get guidance on urgent needs.</p>

                    <h2>Additional Tips</h2>
                    <p>Keep your donations organized, labeled, and packaged securely to help NGOs distribute them efficiently.</p>
                </div>
            </section>
        </div>
    );
}
