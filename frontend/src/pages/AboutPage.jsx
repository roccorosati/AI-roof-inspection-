import { Link } from 'react-router-dom';
import MarketingNav from '../components/MarketingNav.jsx';

const values = [
  {
    icon: '🎯',
    title: 'Built for Professionals',
    desc: 'We built this for inspectors and adjusters in the field — not for demos, not for slideware. Every feature ships because a real job required it.',
  },
  {
    icon: '⚡',
    title: 'Speed Without Sacrifice',
    desc: 'A report that takes 3 hours to write manually is done in 30 seconds here. We refuse to let speed come at the cost of accuracy.',
  },
  {
    icon: '🔒',
    title: 'Your Data, Your Reports',
    desc: 'Reports are saved to your account and yours alone. We don\'t share, sell, or use your inspection data for anything.',
  },
  {
    icon: '📈',
    title: 'Constantly Improving',
    desc: 'Every update makes the AI smarter, the reports more detailed, and the workflow smoother. We\'re just getting started.',
  },
];

const stats = [
  { value: '< 30s', label: 'Average report time' },
  { value: '11', label: 'Report sections covered' },
  { value: '10', label: 'Photos per inspection' },
  { value: '100%', label: 'AI-analyzed' },
];

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>
      <MarketingNav />

      {/* Hero */}
      <section style={{ position: 'relative', padding: '90px 24px 96px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/blue-house-roof.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(15,23,42,0.88) 0%, rgba(30,58,95,0.82) 55%, rgba(30,64,175,0.78) 100%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: 46, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.2px', marginBottom: 20 }}>
            Why we built<br /><span style={{ color: '#60a5fa' }}>RoofWise</span>
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: 17, lineHeight: 1.75 }}>
            Writing inspection reports is one of the most time-consuming parts of a roofing inspector's job.
            We set out to change that — without cutting corners on quality.
          </p>
        </div>
      </section>

      {/* Story */}
      <section style={{ padding: '72px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'center' }}>
          <div style={{ flex: '1 1 340px', position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: -4,
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              zIndex: 0,
            }} />
            <img src="/images/person-on-ladder.jpg" alt="Inspector climbing to a roof"
              style={{ position: 'relative', zIndex: 1, width: '100%', display: 'block', objectFit: 'cover', maxHeight: 420 }} />
          </div>
          <div style={{ flex: '1 1 360px' }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', marginBottom: 24 }}>Our story</h2>
            <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.85, marginBottom: 20 }}>
              RoofWise started with a simple observation: professional inspectors spend hours writing reports
              that could be generated in seconds with the right technology. Between the field work, the photo sorting,
              the damage cataloging, and the final report formatting — most of the effort after the inspection was
              repetitive and manual.
            </p>
            <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.85, marginBottom: 20 }}>
              We combined modern AI image analysis with a structured, insurance-ready report format to create something
              inspectors can actually use on the job — not a toy, not a proof of concept. Upload your photos, get a
              complete report. That's the whole product.
            </p>
            <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.85 }}>
              We're a small team that believes the best software tools are the ones that get out of your way. If RoofWise saves you an hour on every job, it's doing its job.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ position: 'relative', padding: '64px 24px', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/aerial-neighborhood.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15,23,42,0.82)',
        }} />
        <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
            {stats.map(({ value, label }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                padding: '32px 24px', textAlign: 'center',
              }}>
                <div style={{ color: '#60a5fa', fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>{value}</div>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '72px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.7px', marginBottom: 12 }}>What we stand for</h2>
            <p style={{ color: '#64748b', fontSize: 16, maxWidth: 460, margin: '0 auto' }}>
              A few principles that guide everything we build.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {values.map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: '#f8fafc', padding: '28px',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{
                  width: 52, height: 52,
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, marginBottom: 16,
                }}>{icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{title}</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.65 }}>{desc}</p>
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
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ color: 'white', fontSize: 34, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 14 }}>
            See it for yourself.
          </h2>
          <p style={{ color: '#93c5fd', fontSize: 16, marginBottom: 36, lineHeight: 1.6 }}>
            Create a free account and generate your first report in minutes.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn-link" style={{
              background: 'white', color: '#1d4ed8', textDecoration: 'none',
              padding: '13px 36px', fontSize: 16, fontWeight: 700,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}>Get Started Free →</Link>
            <Link to="/contact" className="btn-link" style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.4)',
              color: 'white', textDecoration: 'none',
              padding: '13px 36px', fontSize: 16, fontWeight: 600,
            }}>Contact Us</Link>
          </div>
        </div>
      </section>

      <footer style={{ background: '#0f172a', padding: '28px 24px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
        <div style={{ marginBottom: 6, color: '#64748b' }}>RoofWise</div>
        <div style={{ color: '#334155', fontSize: 12 }}>For professional use only · All reports should be verified by a licensed inspector</div>
      </footer>
    </div>
  );
}
