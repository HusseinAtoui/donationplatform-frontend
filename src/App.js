// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import HomePage from './pages/HomePage';
import Login from './pages/Login/Login';
import SignUpSelect from './pages/SignUp/SignUpSelect';
import DonorSignUp from './pages/SignUp/DonorSignUp';
import NgoSignUp from './pages/SignUp/NgoSignUp';
import OurPartners from './pages/OurPartners/OurPartners';
import Donations from './pages/Donations/Donations';
import NGOProfile from "./pages/NGOProfile/NGOProfile";
import DonorProfile from "./pages/DonorProfile/DonorProfile";
import DonationRequestDetailTest from './pages/DonationRequestDetailTest';
import Guidelines from './pages/Guidelines/Guidelines'; // import your new Guidelines page
import AdminNGO from './pages/AdminNGO/adminngo.jsx'
import NGOPublicProfile from './pages/NGOPublicProfile/NGOPublicProfile';
<<<<<<< Updated upstream
import Map from './pages/Map/Map';

=======
import MessagesPage from './pages/Messages/MessagesPage';
>>>>>>> Stashed changes
function AppContent() {
  const location = useLocation();

  // Define paths where NavBar should NOT appear
  const hideNavPaths = ['/login', '/signup', '/signup/donor', '/signup/ngo'];

  return (
    <>
      {!hideNavPaths.includes(location.pathname) && <NavBar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUpSelect />} />
        <Route path="/signup/donor" element={<DonorSignUp />} />
        <Route path="/signup/ngo" element={<NgoSignUp />} />
        <Route path="/our-partners" element={<OurPartners />} />
        <Route path="/donations" element={<Donations />} />
        <Route path="/NGOProfile" element={<NGOProfile />} />
        <Route path="/DonorProfile" element={<DonorProfile />} />
        <Route path="/donation-test" element={<DonationRequestDetailTest />} />
        <Route path="/guide" element={<Guidelines />} />
        <Route path="/adminngo" element={<AdminNGO />} />
<<<<<<< Updated upstream
        <Route path="/ngo/:id" element={<NGOPublicProfile />} />  {/* 👈 add this */}
        <Route path="/map" element={<Map />} />
=======
        <Route path="/ngo/:id" element={<NGOPublicProfile />} />  
           <Route path="/messages" element={<MessagesPage />} />
>>>>>>> Stashed changes
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
