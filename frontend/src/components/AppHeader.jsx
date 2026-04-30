import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    navigate('/');
  }

  const isApp = location.pathname === '/app';
  const isAccount = location.pathname === '/account';

  const navLink = (to, label, active) => (
    <Link
      to={to}
      style={{
        color: active ? 'white' : '#94a3b8',
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        padding: '7px 16px',
        background: active ? 'rgba(37,99,235,0.5)' : 'transparent',
        border: active ? '1px solid rgba(37,99,235,0.6)' : '1px solid transparent',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </Link>
  );

  return (
    <header style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            🏠
          </div>
          <div>
            <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>AI Roof Inspector</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>Professional inspection reports</div>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {navLink('/app', 'New Report', isApp)}
          {navLink('/account', 'Account', isAccount)}
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#94a3b8', fontSize: 14, fontWeight: 500,
              padding: '7px 16px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
