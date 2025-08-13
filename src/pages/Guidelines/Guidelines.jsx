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
        onButtonClick: () => {
            navigate('/donations'); 
        },
    };

    return (
        <div className="guidelines-page">
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
                    {/* ... rest of your content ... */}
                </div>
            </section>
        </div>
    );
}
