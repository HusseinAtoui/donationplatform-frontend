import React, { useRef, useState, useEffect } from "react";
import "./NGOProfile.css";
import Footer from "../../components/Footer/Footer";
import { Plus, Settings, MapPin, Phone, Mail, Clock, Camera } from "lucide-react";

const contact = {
  address: "8592 Fairground St. Tallahassee, FL 32303",
  phone: "+775 378-6348",
  email: "rgarton@outlook.com",
  hours: "Mon – Fri: 10AM – 10PM",
};

const posts = [
  { id: 1, org: "NGO NAME", date: "Date of post", description: "description………………", images: ["#", "#", "#"] },
  { id: 2, org: "NGO NAME", date: "Date of post", description: "description………………", images: ["#", "#"] },
];

function Chip({ icon: Icon, text }) {
  return (
    <div className="chip">
      <span className="chip-icon"><Icon size={14} /></span>
      <span className="chip-text">{text}</span>
    </div>
  );
}

export default function NGOProfile() {
  // avatar state + refs
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

    // allow choosing same file again later
    e.target.value = "";
  };

  useEffect(() => {
    return () => {
      if (avatarSrc?.startsWith("blob:")) URL.revokeObjectURL(avatarSrc);
    };
  }, [avatarSrc]);

  return (
    <div className="page">
      {/* Cover under sticky navbar */}
      <section className="wrap">
        <div className="cover" />

        {/* Overlapping header card */}
        <div className="card header-card">
         <div className="avatar-holder">
  <div className="avatar-lg">
    {avatarSrc ? <img src={avatarSrc} alt="NGO avatar" /> : <Camera size={28} />}
  </div>

  {/* Plus button positioned relative to .avatar-holder (not inside the circle) */}
  <button
    type="button"
    className="avatar-add"
    onClick={pickFile}
    aria-label="Change NGO picture"
    title="Change picture"
  >
    <Plus size={50} strokeWidth={3} />
  </button>

  <input
    ref={fileRef}
    type="file"
    accept="image/*"
    className="visually-hidden"
    onChange={onAvatarChange}
  />
</div>  <div className="header-actions">
  <button className="EDITbtn">Edit</button>
  <button className="Settings" aria-label="settings">
    <Settings size={16} />
  </button>
</div>

          <div className="header-main">
            <div className="title-row">
              <h1>NGO NAME</h1>
            
            </div>

            <div className="contact-row">
              <Chip icon={MapPin} text={contact.address} />
              <Chip icon={Phone} text={contact.phone} />
              <Chip icon={Mail} text={contact.email} />
              <Chip icon={Clock} text={contact.hours} />
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="wrap">
        <div className="card">
          <h2>About</h2>
          <p className="muted">
            Write about the NGO here. Mission, services, and any important details you want donors to know.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="wrap">
        <div className="posts-head">
          <h2>Posts</h2>
          <button className="btn">
            Add Post <Plus size={16} style={{ marginLeft: 6 }} />
          </button>
        </div>

        <div className="stack">
          {posts.map((p) => (
            <div key={p.id} className="card post">
              <div className="post-top">
                <div className="post-id">
                  <div className="avatar-sm" />
                  <div className="org">{p.org}</div>
                </div>
                <div className="date">{p.date}</div>
              </div>

              <p className="muted">{p.description}</p>

              <div className="grid">
                {p.images.map((_, i) => <div key={i} className="ph" />)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
