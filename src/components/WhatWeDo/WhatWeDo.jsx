import React from 'react';
import './WhatWeDo.css';

const LineSVG = () => (
    <svg
        className="whatwedo__line"
        width="100%"
        height="87"
        viewBox="0 0 1182 87"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M5.33984 42.6192C65.2193 14.3199 153.056 1.11265 346.543 47.0907C606.869 108.947 659.449 75.3917 759.87 47.0907C872.639 27.2431 940.18 -36.7804 1176.66 47.0907"
            stroke="#FFC247"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const StepCircle = ({ number, style }) => (
    <div className="whatwedo__step-circle" style={style}>
        <svg
            width="79"
            height="78"
            viewBox="0 0 79 78"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="whatwedo__circle-svg"
        >
            <circle cx="39.5" cy="39" r="39" fill="white" />
        </svg>
        <div className="whatwedo__step-number">{number}</div>
    </div>
);

export default function WhatWeDo() {
    const steps = [
        "Real-time item requests from verified NGOs",
        "Search by category, urgency, or location",
        "Drop off or schedule pickups",
        "Track where your donation goes",
    ];

    const circlePositions = [
        { left: '83px', top: '300px' },
        { left: '490px', top: '290px' },
        { left: '890px', top: '290px' },
        { left: '1350px', top: '305px' },
    ];

    return (
        <section className="whatwedo">
            <h2 className="whatwedo__title">What Do We Do!</h2>
            <p className="whatwedo__subtitle">All in one platform.</p>

            {/* Desktop layout with SVG */}
            <div className="whatwedo__desktop">
                <LineSVG />
                {steps.map((text, idx) => {
                    const circlePos = circlePositions[idx];
                    const textTop = parseInt(circlePos.top) + 90;

                    return (
                        <React.Fragment key={idx}>
                            <StepCircle number={idx + 1} style={circlePos} />
                            <h3
                                className="whatwedo__step-text"
                                style={{
                                    position: 'absolute',
                                    top: `${textTop}px`,
                                    left: `calc(${circlePos.left} + 39.5px)`,
                                    width: '180px',
                                    transform: 'translateX(-50%)',
                                    textAlign: 'center'
                                }}
                            >
                                {text}
                            </h3>
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Mobile layout without SVG */}
            <div className="whatwedo__mobile">
                <ol className="whatwedo__list">
                    {steps.map((text, idx) => (
                        <li key={idx} className="whatwedo__list-item">
                            {text}
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
