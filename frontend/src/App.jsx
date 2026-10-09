
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation
} from 'react-router-dom';

import {
  LogOut,
  User as UserIcon,
  FileText,
  BarChart2
} from 'lucide-react';

import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ResumeUpload from './components/ResumeUpload';
import InterviewSession from './components/InterviewSession';
import Feedback from './components/Feedback';
import SelectCompany from './components/SelectCompany';

function Navigation({ user, onLogout }) {
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    textDecoration: 'none',
    color: isActive(path) ? '#0f766e' : '#526c6c',
    fontWeight: 600,
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: isActive(path) ? '#e6f7f5' : 'transparent',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  });

  return (
    <nav
      className="glass-card app-navbar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderRadius: '0 0 16px 16px',
        borderTop: 'none',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '30px',
        background: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#d7eae7',
        boxShadow: '0 4px 20px rgba(15, 118, 110, 0.07)',
        backdropFilter: 'blur(12px)',
        flexWrap: 'wrap'
      }}
    >
      {/* InterviewIQ Logo */}
      <Link
        to="/"
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, #0d9488, #2dd4bf)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 800,
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(13, 148, 136, 0.2)'
          }}
        >
          IQ
        </div>

        <span
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: '1.2rem',
            color: '#173536',
            letterSpacing: '-0.02em'
          }}
        >
          Interview
          <span style={{ color: '#0d9488' }}>IQ</span>
        </span>
      </Link>

      {/* Navigation Links */}
      <div
        className="app-nav-links"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        <Link to="/" style={navLinkStyle('/')}>
          <BarChart2 size={17} />
          Dashboard
        </Link>

        <Link to="/resume" style={navLinkStyle('/resume')}>
          <FileText size={17} />
          Resume Analysis
        </Link>
      </div>

      {/* User and Sign Out */}
      <div
        className="app-nav-user"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f0f9f8',
            padding: '8px 12px',
            borderRadius: '24px',
            border: '1px solid #d7eae7',
            maxWidth: '180px'
          }}
        >
          <UserIcon size={15} color="#0f766e" />

          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#365656',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {user.username}
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="btn-secondary"
          style={{
            padding: '9px 13px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            color: '#0f766e',
            background: '#ffffff',
            border: '1px solid #b8e5df',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            whiteSpace: 'nowrap'
          }}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </nav>
  );
}

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.targetCompany || !user.targetRole) {
    return <Navigate to="/select-company" replace />;
  }

  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('interview_iq_user');
      const token = localStorage.getItem('interview_iq_token');

      if (savedUser && token) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Unable to restore saved user:', error);
      localStorage.removeItem('interview_iq_user');
      localStorage.removeItem('interview_iq_token');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('interview_iq_user', JSON.stringify(userData));
    localStorage.setItem('interview_iq_token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('interview_iq_user');
    localStorage.removeItem('interview_iq_token');
    setUser(null);
  };

  const handleUpdateCompany = (company, role) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      targetCompany: company,
      targetRole: role
    };

    localStorage.setItem(
      'interview_iq_user',
      JSON.stringify(updatedUser)
    );

    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div
        className="flex-center"
        style={{
          minHeight: '100vh',
          background: '#f4fbfa',
          color: '#526c6c',
          fontWeight: 600
        }}
      >
        Initializing Platform...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div
        style={{
          minHeight: '100vh',
          paddingBottom: '40px',
          background: '#f4fbfa'
        }}
      >
        <Navigation user={user} onLogout={handleLogout} />

        <main
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px'
          }}
        >
          <Routes>
            <Route
              path="/login"
              element={
                user
                  ? <Navigate to="/" replace />
                  : <Login onLogin={handleLogin} />
              }
            />

            <Route
              path="/register"
              element={
                user
                  ? <Navigate to="/" replace />
                  : <Register />
              }
            />

            <Route
              path="/select-company"
              element={
                user
                  ? (
                    <SelectCompany
                      user={user}
                      onUpdateCompany={handleUpdateCompany}
                    />
                  )
                  : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute user={user}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/resume"
              element={
                <ProtectedRoute user={user}>
                  <ResumeUpload />
                </ProtectedRoute>
              }
            />

            <Route
              path="/interview/:id"
              element={
                <ProtectedRoute user={user}>
                  <InterviewSession />
                </ProtectedRoute>
              }
            />

            <Route
              path="/feedback/:id"
              element={
                <ProtectedRoute user={user}>
                  <Feedback />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
