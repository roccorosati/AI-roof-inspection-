import { Link, useLocation } from 'react-router-dom';

export default function MarketingNav() {
  const { pathname } = useLocation();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/features', label: 'Features' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ color: 'white', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>RoofWise</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navLinks.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="nav-tab"
                style={{
                  color: active ? 'white' : '#94a3b8',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  padding: '7px 14px',
                  background: active ? 'rgba(37,99,235,0.35)' : 'transparent',
                  borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
                }}
              >
                {label}
              </Link>
            );
          })}

          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 10px' }} />

          <Link to="/signup" className="btn-link" style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
            color: 'white', textDecoration: 'none', padding: '8px 18px', fontSize: 14, fontWeight: 600,
          }}>Sign Up</Link>
          <Link to="/login" className="btn-link" style={{
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: 'white', textDecoration: 'none', padding: '8px 20px', fontSize: 14, fontWeight: 600,
            boxShadow: '0 2px 8px rgba(37,99,235,0.4)', marginLeft: 6,
          }}>Sign In</Link>
        </div>
      </div>
    </nav>
  );
}
