import { Link, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';

export default function AppHeader() {
  const { pathname } = useLocation();

  const marketingLinks = [
    { to: '/', label: 'Home' },
    { to: '/features', label: 'Features' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  const appLinks = [
    { to: '/app', label: 'New Report' },
    { to: '/account', label: 'Account' },
  ];

  const navTab = (to, label) => {
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
  };

  return (
    <header style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link to="/" style={{ textDecoration: 'none', marginRight: 10 }}>
            <span style={{ color: 'white', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>RoofWise</span>
          </Link>
          {marketingLinks.map(({ to, label }) => navTab(to, label))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {appLinks.map(({ to, label }) => navTab(to, label))}
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
