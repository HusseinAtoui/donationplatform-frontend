import React from 'react';
import './Hero.css';

const Hero = ({ title, subtitle, buttonText, image, onButtonClick }) => {
    return (
        <section className="hero">
            <div className="hero-content">
                <h1 className="hero-title">{title}</h1>
                <p className="hero-subtitle">{subtitle}</p>
                {buttonText && (
                    <button className="hero-button" onClick={onButtonClick}>
                        {buttonText}
                    </button>
                )}
            </div>
            {image && (
                <div className="hero-image">
                    <img src={image} alt="Hero visual" />
                </div>
            )}
        </section>
    );
};

export default Hero;
