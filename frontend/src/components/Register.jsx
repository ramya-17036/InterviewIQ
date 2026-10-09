
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserPlus,
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  Lock
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Unable to connect to the server. Please check that the backend is running.'
          : err.message || 'Registration failed. Please try again.'
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
          maxWidth: '430px',
          padding: '32px',
          boxSizing: 'border-box',
          background: '#ffffff',
          border: '1px solid #d7eae7',
          boxShadow: '0 12px 35px rgba(15, 118, 110, 0.08)'
        }}
      >
        {/* Registration Header */}
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
            <UserPlus size={27} />
          </div>

          <h2
            style={{
              fontSize: '2rem',
              marginBottom: '8px',
              color: '#173536'
            }}
          >
            Create Account
          </h2>

          <p
            style={{
              color: '#526c6c',
              fontSize: '0.9rem',
              margin: 0,
              lineHeight: 1.6
            }}
          >
            Join InterviewIQ and start leveling up.
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
              marginBottom: '18px',
              lineHeight: 1.5
            }}
          >
            <AlertCircle
              size={17}
              style={{ flexShrink: 0, marginTop: '2px' }}
            />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            role="status"
            style={{
              background: '#e8f7ed',
              border: '1px solid #b9e6c8',
              borderRadius: '10px',
              padding: '12px',
              color: '#15803d',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '18px',
              lineHeight: 1.5
            }}
          >
            <CheckCircle2
              size={17}
              style={{ flexShrink: 0, marginTop: '2px' }}
            />
            <span>
              Account created successfully! Redirecting to login...
            </span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="register-username">Username</label>

            <div style={{ position: 'relative' }}>
              <User
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
                id="register-username"
                name="username"
                type="text"
                className="form-control"
                style={{ paddingLeft: '42px' }}
                placeholder="Pick a unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                disabled={loading || success}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email Address</label>

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
                id="register-email"
                name="email"
                type="email"
                className="form-control"
                style={{ paddingLeft: '42px' }}
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading || success}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="register-password">Password</label>

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
                id="register-password"
                name="password"
                type="password"
                className="form-control"
                style={{ paddingLeft: '42px' }}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
                disabled={loading || success}
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
            disabled={loading || success}
          >
            {loading ? (
              'Creating Account...'
            ) : success ? (
              <>
                <CheckCircle2 size={18} />
                Account Created
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
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
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: '#0d9488',
              textDecoration: 'none',
              fontWeight: 700
            }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
