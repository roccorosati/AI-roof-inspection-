import { Link } from 'react-router-dom';

const features = [
  {
    icon: '🔍',
    title: 'Thorough Damage Analysis',
    desc: 'Identifies hail impacts, wind damage, granule loss, flashing issues, and more — the same things a trained inspector looks for on the roof.',
  },
  {
    icon: '📋',
    title: 'Ready-to-Submit Reports',
    desc: 'Each report covers 11 sections including surface condition, gutters, penetrations, cost estimates, and a full damage map. No editing required.',
  },
  {
    icon: '📄',
    title: 'PDF Export',
    desc: 'Download a clean, print-ready PDF report. Hand it to the homeowner or send it straight to the insurance company.',
  },
  {
    icon: '🗂️',
    title: 'Report History',
    desc: 'Every report is saved to your account. Access past inspections any time from your dashboard.',
  },
];

const steps = [
  { number: '01', title: 'Enter Property Info', desc: 'Fill in the property address, your name, company, and a few roof details. Takes about 30 seconds.' },
  { number: '02', title: 'Upload Your Photos', desc: 'Drop in up to 10 photos from your drone or phone. The more coverage, the better the report.' },
  { number: '03', title: 'Get Your Report', desc: 'The AI analyzes every image and builds a complete, formatted report. You\'ll have it in under 30 seconds.' },
];

const detectionItems = [
  'Hail impact marks & bruising',
  'Granule loss and bare spots',
  'Cracked or lifted shingles',
  'Wind damage & missing tabs',
  'Flashing separation',
  'Ponding & drainage issues',
];

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44,
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>🏠</div>
            <div>
              <div style={{ color: 'white', fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>AI Roof Inspector</div>
              <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 1 }}>Professional inspection reports</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/signup" className="btn-link" style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
              color: 'white', textDecoration: 'none', padding: '9px 20px', fontSize: 14, fontWeight: 600,
            }}>Sign Up</Link>
            <Link to="/login" className="btn-link" style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white', textDecoration: 'none', padding: '9px 22px', fontSize: 14, fontWeight: 600,
              boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
            }}>Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero — house photo background */}
      <section style={{ position: 'relative', padding: '110px 24px 90px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/house-hero.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center 40%',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(15,23,42,0.90) 0%, rgba(30,58,95,0.84) 55%, rgba(30,64,175,0.80) 100%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
            color: '#93c5fd', padding: '6px 18px',
            fontSize: 13, fontWeight: 600, marginBottom: 28, letterSpacing: '0.3px',
          }}>Powered by Claude AI</div>
          <h1 style={{ color: 'white', fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 24 }}>
            Professional Roof<br /><span style={{ color: '#60a5fa' }}>Inspection Reports</span>
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: 19, lineHeight: 1.7, marginBottom: 44, maxWidth: 580, margin: '0 auto 44px' }}>
            Take photos, upload them, and get a complete inspection report in under 30 seconds.
            Built for inspectors who want to spend less time writing and more time working.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn-link" style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white', textDecoration: 'none', padding: '14px 36px', fontSize: 16, fontWeight: 700,
              boxShadow: '0 4px 20px rgba(37,99,235,0.5)',
            }}>Get Started Free →</Link>
            <a href="#how-it-works" className="btn-link" style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', textDecoration: 'none', padding: '14px 36px', fontSize: 16, fontWeight: 600,
            }}>See How It Works</a>
          </div>
          <div style={{ display: 'flex', gap: 48, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap' }}>
            {[
              { value: '< 30s', label: 'Report generation' },
              { value: '11', label: 'Report sections' },
              { value: '100%', label: 'AI-powered' },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ color: '#60a5fa', fontSize: 32, fontWeight: 800, letterSpacing: '-1px' }}>{value}</div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: '#f8fafc', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.8px', marginBottom: 12 }}>Everything you need</h2>
            <p style={{ color: '#64748b', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
              Built for professional roofing inspectors and insurance adjusters.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {features.map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: 'white', padding: '28px',
                border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width: 52, height: 52,
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, marginBottom: 18,
                }}>{icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{title}</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Detection Showcase */}
      <section style={{ background: '#0f172a', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 60, alignItems: 'center' }}>
          <div style={{ flex: '1 1 380px', position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: -4,
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              zIndex: 0,
            }} />
            <img
              src="/images/hail-damage-marked.png"
              alt="AI-detected hail damage with circled impact marks"
              style={{ position: 'relative', zIndex: 1, width: '100%', display: 'block' }}
            />
            <div style={{
              position: 'absolute', bottom: 16, left: 16, zIndex: 2,
              background: 'rgba(15,23,42,0.88)', border: '1px solid rgba(239,68,68,0.5)',
              color: '#fca5a5', fontSize: 12, fontWeight: 700,
              padding: '6px 14px', letterSpacing: '0.4px',
            }}>
              37 IMPACT SITES DETECTED
            </div>
          </div>
          <div style={{ flex: '1 1 340px' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
              color: '#fca5a5', padding: '5px 14px',
              fontSize: 12, fontWeight: 700, marginBottom: 20, letterSpacing: '0.5px',
            }}>AI DAMAGE DETECTION</div>
            <h2 style={{ color: 'white', fontSize: 34, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.8px', marginBottom: 18 }}>
              Every impact.<br />Every spot. Marked.
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              Upload photos straight from your drone or phone. The AI scans every pixel,
              identifies each damage site, and logs it in the report — no guesswork, no missed spots.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {detectionItems.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)',
                  }} />
                  <span style={{ color: '#cbd5e1', fontSize: 14 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.8px', marginBottom: 12 }}>How it works</h2>
            <p style={{ color: '#64748b', fontSize: 16 }}>From photos to a professional report in three steps.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {steps.map(({ number, title, desc }, i) => (
              <div key={number} style={{ display: 'flex', gap: 32, alignItems: 'flex-start', marginBottom: i < steps.length - 1 ? 40 : 0 }}>
                <div style={{ flexShrink: 0, textAlign: 'center' }}>
                  <div style={{
                    width: 56, height: 56,
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 18, fontWeight: 800,
                  }}>{number}</div>
                  {i < steps.length - 1 && (
                    <div style={{ width: 2, height: 40, background: '#e2e8f0', margin: '8px auto 0' }} />
                  )}
                </div>
                <div style={{ paddingTop: 12 }}>
                  <h3 style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{title}</h3>
                  <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
        padding: '72px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ color: 'white', fontSize: 36, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 16 }}>
            Save time on every job.
          </h2>
          <p style={{ color: '#93c5fd', fontSize: 17, marginBottom: 40, lineHeight: 1.6 }}>
            Create your free account and start generating reports right now.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn-link" style={{
              background: 'white', color: '#1d4ed8', textDecoration: 'none',
              padding: '14px 40px', fontSize: 16, fontWeight: 700,
              display: 'inline-block', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}>Create Free Account →</Link>
            <Link to="/login" className="btn-link" style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.4)',
              color: 'white', textDecoration: 'none',
              padding: '14px 40px', fontSize: 16, fontWeight: 600,
              display: 'inline-block',
            }}>Sign In</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', padding: '28px 24px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
        <div style={{ marginBottom: 6, color: '#64748b' }}>AI Roof Inspector — Powered by Claude AI</div>
        <div style={{ color: '#334155', fontSize: 12 }}>For professional use only · All reports should be verified by a licensed inspector</div>
      </footer>
    </div>
  );
}
