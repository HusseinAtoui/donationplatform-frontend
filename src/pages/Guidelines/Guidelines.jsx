import React from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../../components/Hero/Hero.jsx';
import donationImage from '../../assets/donationBox-img.jpg';
import './Guidelines.css';

export default function Guidelines() {
    const navigate = useNavigate();

    const heroData = {
        title: "Donation Guidelines",
        subtitle: "Learn how to contribute effectively and responsibly to our causes. Follow these guidelines to ensure your donations reach those who need them most.",
        buttonText: "DONATE NOW",
        image: donationImage, 
        onButtonClick: () => navigate('/donations'),
    };

    // Organized rules by sections
    const donationSections = [
        {
            sectionTitle: "What to Donate",
            rules: [
                {
                    title: "Clothes Only",
                    description: "Ensure all your donations are clothing items. Other household goods are not accepted."
                },
                {
                    title: "Good Condition Only",
                    description: "No holes, large stains, missing buttons, or broken zippers. If you wouldn't give it to a friend, it's not suitable."
                },
                {
                    title: "New Underwear & Socks",
                    description: "For hygiene reasons, all underwear, socks, and intimate apparel must be brand new."
                },
            ],
        },
        {
            sectionTitle: "How to Prepare Your Items",
            rules: [
                {
                    title: "Wash Everything",
                    description: "Clean and dry all items before donating to ensure a safe and hygienic contribution."
                },
                {
                    title: "Check Pockets",
                    description: "Remove personal items from all pockets to avoid lost items."
                },
                {
                    title: "Pack Securely",
                    description: "Use boxes or bags to pack items. Keeping similar items together is helpful but optional."
                },
            ],
        },
    ];

    return (
        <div className="guidelines-page">
            <Hero
                title={heroData.title}
                subtitle={heroData.subtitle}
                buttonText={heroData.buttonText}
                image={heroData.image}
                onButtonClick={heroData.onButtonClick}
            />

            {/* How to Donate Box */}
            <div className="how-to-donate-box">
                <h2>Here’s how to make sure your donations truly help.</h2>
            </div>

            {/* Donation Rules Sections */}
            <section className="guidelines-content">
                <div className="guidelines-container">
                    {donationSections.map((section, idx) => (
                        <div key={idx} className="donation-section">
                            <h2>{section.sectionTitle}</h2>
                            <div className="donation-cards">
                                {section.rules.map((rule, index) => (
                                    <div key={index} className="donation-card">
                                        <h3>{rule.title}</h3>
                                        <p>{rule.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Why These Guidelines */}
                    <div className="why-guidelines">
                        <h2>Why These Guidelines?</h2>
                        <p>
                            Following these rules ensures donations are usable, safe, and reach those in need efficiently. It helps our NGO partners focus on distributing items to people faster and more effectively.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
