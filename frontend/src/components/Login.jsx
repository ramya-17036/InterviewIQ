
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (!data.token) {
        throw new Error('Login response did not contain an authentication token.');
      }

      onLogin(data, data.token);
      navigate('/');
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Unable to connect to the server. Please check that the backend is running.'
          : err.message || 'Unable to sign in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: '80vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 0'
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '32px',
          boxSizing: 'border-box',
          background: '#ffffff',
          border: '1px solid #d7eae7',
          boxShadow: '0 12px 35px rgba(15, 118, 110, 0.08)'
        }}
      >
        {/* Login Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: '#e6f7f5',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              border: '1px solid #b8e5df'
            }}
          >
            <Lock size={26} />
          </div>

          <h2
            style={{
              fontSize: '2rem',
              marginBottom: '8px',
              color: '#173536'
            }}
          >
            Welcome Back
          </h2>

          <p
            style={{
              color: '#526c6c',
              fontSize: '0.9rem',
              margin: 0,
              lineHeight: 1.6
            }}
          >
            Elevate your mock interview skills with AI.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '12px',
              color: '#b91c1c',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '20px',
              lineHeight: 1.5
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>

            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                color="#758c8a"
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />

              <input
                id="username"
                name="username"
                type="text"
                className="form-control"
                style={{ paddingLeft: '42px' }}
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="password">Password</label>

            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="#758c8a"
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />

              <input
                id="password"
                name="password"
                type="password"
                className="form-control"
                style={{ paddingLeft: '42px' }}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              minHeight: '46px'
            }}
            disabled={loading}
          >
            {loading ? (
              'Signing in...'
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            marginBottom: 0,
            color: '#526c6c',
            fontSize: '0.88rem',
            lineHeight: 1.6
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{
              color: '#0d9488',
              textDecoration: 'none',
              fontWeight: 700
            }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
