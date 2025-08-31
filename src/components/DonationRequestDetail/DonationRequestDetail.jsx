import React from 'react';
import styles from './DonationRequestDetail.module.css';

function formatLocationForChip(loc) {
  const s = (typeof loc === 'string' ? loc : (loc?.address || '')).trim();
  if (!s) return '';
  const beforeComma = s.split(',')[0]?.trim();
  let display = beforeComma || s.split(/\s+/)[0] || '';
  if (display.length > 30) display = display.slice(0, 30).trim() + '…';
  return display;
}

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || '').join('');
}

export default function DonationRequestDetail({ ngoData, donationData }) {
  // NGO info
  const {
    name,
    profilePic,   // preferred NGO avatar url
    address,
    phone,
    email,
    hours,
  } = ngoData || {};

  // Donation info
  const { description, status } = donationData || {};

  // Normalize avatar with fallbacks (if you also pass ngoLogoUrl from backend)
  const avatar =
    profilePic ||
    donationData?.ngoLogoUrl ||
    donationData?.logoUrl ||
    '';

  // Minimized address (same rule used on profile chips)
  const displayAddress = formatLocationForChip(address);

  // Status normalization
  const statusKey = String(status || '').toLowerCase();
  const isUrgent = statusKey === 'urgent';
  const statusBannerClass = `${styles.statusBanner} ${isUrgent ? styles.statusBannerUrgent : styles.statusBannerStandard}`;
  const statusLabel = isUrgent ? 'Urgent Donation Request' : 'Standard Donation Request';

  // Nicely format date if ISO-like, otherwise show raw
  const dateNeededRaw = donationData?.dateNeeded;
  let dateNeeded = dateNeededRaw;
  try {
    if (dateNeededRaw) {
      const d = new Date(dateNeededRaw);
      if (!isNaN(d.getTime())) dateNeeded = d.toLocaleDateString();
    }
  } catch (_) {}

  return (
    <div className={styles.donationReqPage}>
      {/* Hero / Background */}
      <div className={styles.heroBg}></div>

      {/* NGO Info Section */}
      <div className={styles.ngoIntroDisplay}>
        <div className={styles.ngoPp}>
          {avatar ? (
            <img
              className={styles.ngoPpImg}
              src={avatar}
              alt={name ? `${name} logo` : 'NGO logo'}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className={styles.ngoPpFallback}>
              {getInitials(name)}
            </div>
          )}
        </div>

        <div className={styles.ngoInfoBox}>
          <h1 className={styles.ngoName}>{name}</h1>

          <div className={styles.ngoContactRow}>
            {/* Address (minimized) */}
            <div className={styles.iconText}>
              <div className={styles.iconBg}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.iconMapPin} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                </svg>
              </div>
              <span className={styles.contactText}>{displayAddress || '—'}</span>
            </div>

            {/* Phone */}
            <div className={styles.iconText}>
              <div className={styles.iconBg}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.iconPhone} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79a15.09 15.09 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21 11.36 11.36 0 003.55.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.55 1 1 0 01-.21 1.11l-2.24 2.13z" />
                </svg>
              </div>
              <span className={styles.contactText}>{phone || '—'}</span>
            </div>

            {/* Email */}
            <div className={styles.iconText}>
              <div className={styles.iconBg}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.iconMail} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 2v.01L12 13 4 6.01V6h16zM4 18v-8l8 5 8-5v8H4z" />
                </svg>
              </div>
              <span className={styles.contactText}>{email || '—'}</span>
            </div>

            {/* Hours */}
            <div className={styles.iconText}>
              <div className={styles.iconBg}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={styles.iconClock}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" fill="none" />
                  <polyline points="12 6 12 12 16 14" fill="none" />
                </svg>
              </div>
              <span className={styles.contactText}>{hours || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Description Section */}
      <div className={styles.donationDescriptionContainer}>
        <div className={statusBannerClass}>
          {statusLabel}
        </div>

        <div className={styles.donationDescriptionBox}>
          <h2 className={styles.donationDescriptionLabel}>Donation Description:</h2>
          <p className={styles.donationDescriptionText}>{description}</p>
        </div>
      </div>

      {/* Request Details Section */}
      <div className={styles.requestDetailsContainer}>
        <h2 className={styles.sectionTitle}>Request Details</h2>
        <div className={styles.requestDetailsGrid}>
          {[
            { label: 'Category', value: donationData?.category },
            { label: 'Count', value: donationData?.count },
            { label: 'Gender', value: donationData?.gender },
            { label: 'Date Needed', value: dateNeeded },
            // Location minimized here too:
            { label: 'Location', value: formatLocationForChip(donationData?.location) },
            { label: 'Size', value: donationData?.size },
            { label: 'Age Range', value: donationData?.ageRange },
          ].map(({ label, value }) => (
            <div key={label} className={styles.requestCard}>
              <span className={styles.label}>{label}</span>
              <span className={styles.value}>{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
