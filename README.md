# TyebeTyebak Frontend

This is the React frontend for the TyebeTyebak platform. It provides a user interface for NGO and user interactions, fetching data from the backend API.

---

## 📝 Prerequisites

* Node.js (v18+ recommended)
* npm (v9+ recommended)
* Optional: yarn

---

## ⚡ Installation

1. Clone the repository:

```bash
git clone https://github.com/HusseinAtoui/donationplatform-frontend.git
cd tyebetyebak-frontend
```

2. Install dependencies:

```bash
npm install
```

---

## 🌐 Environment Variables

Create a `.env` file in the root directory:

```env
# Base API URL for backend
REACT_APP_API_BASE=http://localhost:4000/api  # For local backend
# Or for deployed backend
# REACT_APP_API_BASE=https://api.tyebetyebak.org/api
```

> **Note:** Make sure to include `/api` at the end of the URL so all frontend API requests are prefixed correctly.

---

## 🚀 Running the App

Start the development server:

```bash
npm start
```

The app will be available at `http://localhost:3000`. Changes will reload automatically.

---

## 🏗️ Building for Production

```bash
npm run build
```

The production-ready files will be in the `build/` folder. Deploy this folder to **S3, Netlify, Vercel, or any static hosting**.

---

## ⚙️ API Endpoints

The frontend uses the base API configured in `.env`:

* **Local backend:** `http://localhost:4000/api`
* **Deployed backend:** `https://api.tyebetyebak.org/api`

Example usage in code:

```javascript
const API_BASE = process.env.REACT_APP_API_BASE;

fetch(`${API_BASE}/home/posts`)
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 🔧 Additional Notes

* Make sure your backend is running and accessible from the frontend.
* For SPA routing issues with S3 + CloudFront, configure CloudFront to serve `index.html` for unknown routes (404) to avoid refresh errors.
