import { Link } from 'react-router-dom';

export default function AuthHeader() {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
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
        </Link>
      </div>
    </header>
  );
}
