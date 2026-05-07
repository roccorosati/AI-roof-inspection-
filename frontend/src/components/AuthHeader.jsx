import { Link } from 'react-router-dom';

export default function AuthHeader() {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <div style={{ color: 'white', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>RoofWise</div>
        </Link>
      </div>
    </header>
  );
}
