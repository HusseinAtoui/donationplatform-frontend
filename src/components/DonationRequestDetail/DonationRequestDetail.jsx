import React from 'react';
import styles from './DonationRequestDetail.module.css';

export default function DonationRequestDetail({ ngoData, donationData }) {
  // Destructure props for convenience
  const {
    name,
    profilePic,  // URL or local image path
    address,
    phone,
    email,
    hours,
  } = ngoData;

  const { description, status } = donationData;

  return (
    <div className={styles.donationReqPage}>
      {/* Hero / Background */}
      <div className={styles.heroBg}></div>

      {/* NGO Info Section */}
      <div className={styles.ngoIntroDisplay}>
        <div
          className={styles.ngoPp}
          style={{ backgroundImage: `url(${profilePic})` }}
        ></div>

        <div className={styles.ngoInfoBox}>
          <h1 className={styles.ngoName}>{name}</h1>

          <div className={styles.ngoContactRow}>
            <div className={styles.iconText}>
              <div className={styles.iconBg}>
                <svg className={styles.iconMapPin} /* your SVG or icon here */></svg>
              </div>
              <span className={styles.contactText}>{address}</span>
            </div>

            <div className={styles.iconText}>
              <div className={styles.iconBg}>
                <svg className={styles.iconPhone} /* your SVG or icon here */></svg>
              </div>
              <span className={styles.contactText}>{phone}</span>
            </div>

            <div className={styles.iconText}>
              <div className={styles.iconBg}>
                <svg className={styles.iconMail} /* your SVG or icon here */></svg>
              </div>
              <span className={styles.contactText}>{email}</span>
            </div>

            <div className={styles.iconText}>
              <div className={styles.iconBg}>
                <svg className={styles.iconClock} /* your SVG or icon here */></svg>
              </div>
              <span className={styles.contactText}>{hours}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Description Section */}
      <div className={styles.donationDescriptionContainer}>
        <div
          className={`${styles.statusBanner} ${
            status === 'urgent'
              ? styles.statusBannerUrgent
              : styles.statusBannerStandard
          }`}
        >
          {status === 'urgent'
            ? 'Urgent Donation Request'
            : 'Standard Donation Request'}
        </div>

        <div className={styles.donationDescriptionBox}>
          <h2 className={styles.donationDescriptionLabel}>
            Donation Description:
          </h2>
          <p className={styles.donationDescriptionText}>{description}</p>
        </div>
      </div>
    </div>
  );
}
