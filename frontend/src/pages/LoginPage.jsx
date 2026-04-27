import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader.jsx';
import AppFooter from '../components/AppFooter.jsx';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      navigate('/app');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1px solid #d1d5db', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', color: '#0f172a', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      <AuthHeader />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{
          background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: '40px', width: '100%', maxWidth: 420, border: '1px solid #e2e8f0',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56,
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, margin: '0 auto 16px',
            }}>🔐</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Sign In</h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>Access your roof inspection dashboard</p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fca5a5',
              padding: '12px 16px', marginBottom: 24, color: '#b91c1c', fontSize: 14,
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email or Username
              </label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                required autoFocus placeholder="Enter your email or username"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="Enter your password"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white', border: 'none', fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.2px',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', fontSize: 13 }}>Don't have an account? </span>
            <Link to="/signup" style={{ color: '#2563eb', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Sign Up
            </Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <Link to="/" style={{ color: '#94a3b8', fontSize: 12, textDecoration: 'none' }}>← Back to Home</Link>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
