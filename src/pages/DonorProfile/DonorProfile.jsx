import React, { useRef, useState, useEffect } from "react";
import "./DonorProfile.css";
import Footer from "../../components/Footer/Footer";
import {
  Plus,
  Settings,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Camera,
  Heart,
  Gift,
  UserRound
} from "lucide-react";

const contact = {
  address: "Beirut, Lebanon",
  phone: "+961 71 234 567",
  email: "donor@example.com",
  availability: "Weekdays after 5 PM",
};

export default function DonorProfile() {
  const [avatarSrc, setAvatarSrc] = useState(null);
  const fileRef = useRef(null);

  const pickFile = () => fileRef.current?.click();

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setAvatarSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
    e.target.value = "";
  };

  useEffect(() => {
    return () => {
      if (avatarSrc?.startsWith("blob:")) URL.revokeObjectURL(avatarSrc);
    };
  }, [avatarSrc]);

  return (
    <main className="page">
      <section className="wrap">
        <div className="cover" />

        <div className="card header-card">
          {/* Avatar */}
          <div className="avatar-holder">
            <div className="avatar-lg">
              {avatarSrc ? <img src={avatarSrc} alt="Donor avatar" /> : <Camera size={28} />}
            </div>

            <button
              type="button"
              className="avatar-add"
              onClick={pickFile}
              aria-label="Change photo"
              title="Change photo"
            >
              <Plus strokeWidth={3} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={onAvatarChange}
            />
          </div>

          {/* Actions (top-right) */}
          <div className="header-actions">
            <button className="EDITbtn">Edit</button>
            <button className="Settings" aria-label="settings">
              <Settings size={18} />
            </button>
          </div>

          {/* Header main */}
          <div className="header-main">
            <div className="title-row">
              <h1>Donor Name</h1>
            </div>

            <div className="contact-row">
              <Chip icon={MapPin} text={contact.address} />
              <Chip icon={Phone} text={contact.phone} />
              <Chip icon={Mail} text={contact.email} />
              <Chip icon={Calendar} text={contact.availability} />
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="wrap">
        <div className="card">
          <h2>About</h2>
          <p className="muted">
            Brief bio about the donor. What they care about, preferred donation types,
            and any relevant notes for NGOs coordinating pickups.
          </p>
        </div>
      </section>

      {/* Preferences & Verification */}
      <section className="wrap two-col">
        <div className="card">
          <h3 className="section-title"><Heart /> Donation Preferences</h3>
          <div className="tags">
            <span className="tag">Clothing</span>
            <span className="tag">Food</span>
            <span className="tag">Hygiene Kits</span>
            <span className="tag">Children</span>
            <span className="tag">Winter Items</span>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title"><UserRound /> Profile Details</h3>
          <ul className="kv-list">
            <li><span>Member Since</span><strong>Mar 2025</strong></li>
            <li><span>Preferred Contact</span><strong>Email</strong></li>
            <li><span>Pickup Radius</span><strong>Up to 10 km</strong></li>
            <li><span>Languages</span><strong>Arabic, English</strong></li>
          </ul>
        </div>
      </section>

      {/* Optional saved NGOs / wish list */}
      <section className="wrap">
        <div className="card">
          <h3 className="section-title"><Gift /> Notes</h3>
          <p className="muted">
            Add any special instructions here (e.g., building access, preferred pickup times).
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Chip({ icon: Icon, text }) {
  return (
    <div className="chip">
      <span className="chip-icon"><Icon size={14} /></span>
      <span className="chip-text">{text}</span>
    </div>
  );
}
