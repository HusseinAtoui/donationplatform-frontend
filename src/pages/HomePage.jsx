import React from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero/Hero';
import WhatWeDo from '../components/WhatWeDo/WhatWeDo';
import AboutSection from '../components/About/AboutSection';
import ContactSection from '../components/ContactSection/ContactSection';
import Footer from '../components/Footer/Footer';
import heroImage from '../assets/hero-image.jpg';

const HomePage = () => {
    const navigate = useNavigate(); 

    return (
        <div>
            <Hero
                title="Hope starts with a small gesture"
                subtitle="Your donation can change a life. Help us connect communities through kindness."
                buttonText="VIEW GUIDELINES"
                image={heroImage}
                onButtonClick={() => navigate('/guide')} 
            />
            <WhatWeDo />
            <AboutSection />
            <ContactSection />
            <Footer />
        </div>
    );
};

export default HomePage;
