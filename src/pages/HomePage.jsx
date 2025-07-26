import React from 'react';
import Hero from '../components/Hero/Hero';
import WhatWeDo from '../components/WhatWeDo/WhatWeDo';
import AboutSection from '../components/About/AboutSection';
import heroImage from '../assets/hero-image.jpg';

const HomePage = () => {
    return (
        <div>
            <Hero
                title="Hope starts with a small gesture"
                subtitle="Your donation can change a life. Help us connect communities through kindness."
                buttonText="Star Donating"
                image={heroImage}
                onButtonClick={() => alert('Redirect to donation page')}
            />
            <WhatWeDo />
            <AboutSection />
        </div>
    );
};

export default HomePage;
