import React from "react";
import "./ThankYouPopup.css";

export default function ThankYouPopup({ show, onClose }) {
    if (!show) return null;

    return (
        <div className="popup-overlay">
            <div className="popup-box">
                
                <div className="popup-content">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/845/845646.png"
                        alt="checkmark"
                        className="popup-icon"
                    />
                    <h2>Thank You for Registering!</h2>
                    <p>
                        Your NGO registration has been received. Please allow up to{" "}
                        <strong>3 business days</strong> for our team to review and approve
                        your request.
                    </p>
                    <button className="popup-ok-btn" onClick={onClose}>
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
