import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import HomePage from './pages/HomePage';
import Login from './pages/Login/Login';

function AppContent() {
  const location = useLocation();

  // Define paths where NavBar should NOT appear
  const hideNavPaths = ['/login'];

  return (
    <>
      {!hideNavPaths.includes(location.pathname) && <NavBar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
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
