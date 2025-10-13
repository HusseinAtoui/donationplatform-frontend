import React, { useState } from "react";
import ThankYouPopup from "../../components/ThankYouPopup/ThankYouPopup";

export default function TestPopup() {
    const [showPopup, setShowPopup] = useState(false);

    return (
        <div style={{ padding: "100px", textAlign: "center" }}>
            <h1>Popup Test Page</h1>
            <button
                onClick={() => setShowPopup(true)}
                style={{
                    backgroundColor: "#5fab7d",
                    color: "white",
                    border: "none",
                    padding: "10px 25px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                }}
            >
                Show Popup
            </button>

            <ThankYouPopup show={showPopup} onClose={() => setShowPopup(false)} />
        </div>
    );
}
