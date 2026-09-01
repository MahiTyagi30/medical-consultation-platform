// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import VoiceIntake from './pages/VoiceIntake';
import ConsultationHistory from './pages/ConsultationHistory';
import DoctorDashboard from './pages/DoctorDashboard';

// Guard component that restricts access to authenticated users only (with optional role check)
const ProtectedRoute = ({ allowedRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to={userRole === 'ROLE_DOCTOR' ? '/doctor-dashboard' : '/voice-intake'} replace />;
  }

  return <Outlet />;
};

// Navigation bar component with dynamic auth and role-based links
const Navigation = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('userName');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  return (
    <nav style={{ padding: '15px 25px', background: '#1e293b', color: '#fff', display: 'flex', gap: '20px', alignItems: 'center' }}>
      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', marginRight: '10px' }}>
        🏥 Consultation Platform
      </span>

      {token ? (
        <>
          {role === 'ROLE_PATIENT' && (
            <>
              <Link to="/voice-intake" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
                🎙️ Voice Intake
              </Link>
              <Link to="/history" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
                📋 Past Consultations
              </Link>
            </>
          )}

          {role === 'ROLE_DOCTOR' && (
            <Link to="/doctor-dashboard" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
              👨‍⚕️ Doctor Dashboard
            </Link>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
              Welcome, {userName || 'User'} ({role === 'ROLE_DOCTOR' ? 'Doctor' : 'Patient'})
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Logout
            </button>
          </div>
        </>
      ) : (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '15px' }}>
          <Link to="/login" style={{ color: '#fff', textDecoration: 'none', fontWeight: '500' }}>Login</Link>
          <Link to="/register" style={{ color: '#fff', textDecoration: 'none', fontWeight: '500' }}>Register</Link>
        </div>
      )}
    </nav>
  );
};

export default function App() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const getDefaultRedirect = () => {
    if (!token) return "/login";
    return role === 'ROLE_DOCTOR' ? "/doctor-dashboard" : "/voice-intake";
  };

  return (
    <Router>
      <Navigation />
      <Routes>
        {/* Default Route: Redirect based on auth status and role */}
        <Route path="/" element={<Navigate to={getDefaultRedirect()} replace />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Patient Routes */}
        <Route element={<ProtectedRoute allowedRole="ROLE_PATIENT" />}>
          <Route path="/voice-intake" element={<VoiceIntake />} />
          <Route path="/history" element={<ConsultationHistory />} />
        </Route>

        {/* Protected Doctor Routes */}
        <Route element={<ProtectedRoute allowedRole="ROLE_DOCTOR" />}>
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        </Route>

        {/* Fallback Catch-All */}
        <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
      </Routes>
    </Router>
  );
}