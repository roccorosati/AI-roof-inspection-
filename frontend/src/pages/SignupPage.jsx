import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader.jsx';
import AppFooter from '../components/AppFooter.jsx';

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

function Input({ type = 'text', value, onChange, placeholder, invalid, ...rest }) {
  const [focused, setFocused] = useState(false);
  const borderColor = invalid ? '#fca5a5' : focused ? '#2563eb' : '#d1d5db';
  return (
    <>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          width: '100%', padding: '11px 14px', border: `1px solid ${borderColor}`,
          fontSize: 14, outline: 'none', boxSizing: 'border-box',
          color: '#0f172a', fontFamily: 'inherit',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
      {invalid && <p style={{ fontSize: 12, color: '#b91c1c', marginTop: 5 }}>{invalid}</p>}
    </>
  );
}

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const emailValid = email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordStrong = password === '' || password.length >= 8;
  const passwordsMatch = confirm === '' || password === confirm;
  const canSubmit = !loading && fullName.trim() && email && emailValid && username && password && passwordStrong && confirm && passwordsMatch;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!emailValid) { setError('Please enter a valid email address'); return; }
    if (!passwordStrong) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim().toLowerCase(), username, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Sign up failed'); return; }
      navigate('/app');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      <AuthHeader />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{
          background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: '40px', width: '100%', maxWidth: 460, border: '1px solid #e2e8f0',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56,
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, margin: '0 auto 16px',
            }}>✏️</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Create Account</h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>Set up your AI Roof Inspector account</p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fca5a5',
              padding: '12px 16px', marginBottom: 24, color: '#b91c1c', fontSize: 14,
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <Field label="Full Name">
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" required autoFocus />
            </Field>
            <Field label="Email Address">
              <Input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="jane@example.com" required
                invalid={!emailValid ? 'Please enter a valid email address' : null}
              />
            </Field>
            <Field label="Username" hint="You can sign in with either your username or email">
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Letters, numbers, underscores" required />
            </Field>

            <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0 18px' }} />

            <Field label="Password">
              <Input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters" required
                invalid={!passwordStrong ? 'Must be at least 8 characters' : null}
              />
            </Field>
            <Field label="Confirm Password">
              <Input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter your password" required
                invalid={!passwordsMatch ? 'Passwords do not match' : null}
              />
            </Field>

            <button
              type="submit" disabled={!canSubmit}
              style={{
                width: '100%', padding: '12px', marginTop: 8,
                background: !canSubmit ? '#bfdbfe' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white', border: 'none', fontSize: 15, fontWeight: 600,
                cursor: !canSubmit ? 'not-allowed' : 'pointer', letterSpacing: '0.2px',
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', fontSize: 13 }}>Already have an account? </span>
            <Link to="/login" style={{ color: '#2563eb', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Sign In
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
