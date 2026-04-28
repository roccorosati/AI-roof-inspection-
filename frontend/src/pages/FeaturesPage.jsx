import { Link } from 'react-router-dom';
import MarketingNav from '../components/MarketingNav.jsx';

const features = [
  {
    icon: '🔍',
    title: 'AI Damage Detection',
    desc: 'Our AI scans every pixel of your uploaded photos to identify hail impacts, granule loss, cracked shingles, wind damage, and flashing issues — the same things a trained inspector looks for.',
    bullets: ['Hail impact marks & bruising', 'Granule loss and bare spots', 'Cracked or lifted shingles', 'Wind damage & missing tabs'],
  },
  {
    icon: '📋',
    title: '11-Section Professional Reports',
    desc: 'Every report follows a structured, insurance-ready format covering all the details adjusters and homeowners need.',
    bullets: ['Surface condition overview', 'Penetrations & flashing', 'Gutters & drainage', 'Damage severity rating'],
  },
  {
    icon: '💰',
    title: 'Cost Estimates',
    desc: 'Automatically generated repair cost estimates for each identified damage category, giving clients an immediate sense of scope.',
    bullets: ['Per-area cost breakdown', 'Repair vs. replacement guidance', 'Material & labor estimates', 'Total damage cost summary'],
  },
  {
    icon: '📄',
    title: 'PDF Export',
    desc: 'Download a clean, print-ready PDF report instantly. Hand it directly to the homeowner or send it to the insurance company.',
    bullets: ['Professional formatting', 'All photos included', 'Instant download', 'Print-ready layout'],
  },
  {
    icon: '🗂️',
    title: 'Report History & Account Dashboard',
    desc: 'Every report is automatically saved to your account. Access, review, and download any past inspection at any time.',
    bullets: ['Unlimited report storage', 'Organized by date & address', 'Re-download PDFs anytime', 'Full inspection history'],
  },
  {
    icon: '⚡',
    title: 'Reports in Under 30 Seconds',
    desc: 'Upload your photos and receive a complete, formatted inspection report in under 30 seconds — no waiting, no back-and-forth.',
    bullets: ['Batch image processing', 'Up to 10 photos per report', 'Instant structured output', 'No manual editing required'],
  },
];

export default function FeaturesPage() {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>
      <MarketingNav />

      {/* Hero */}
      <section style={{ position: 'relative', padding: '90px 24px 96px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/top-down-roof.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(15,23,42,0.91) 0%, rgba(30,58,95,0.85) 55%, rgba(30,64,175,0.82) 100%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
            color: '#93c5fd', padding: '6px 18px',
            fontSize: 13, fontWeight: 600, marginBottom: 24, letterSpacing: '0.3px',
          }}>Everything Included</div>
          <h1 style={{ color: 'white', fontSize: 46, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.2px', marginBottom: 18 }}>
            Built for the field.<br /><span style={{ color: '#60a5fa' }}>Ready to submit.</span>
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: 17, lineHeight: 1.7 }}>
            Every feature in AI Roof Inspector was designed around one question: what does a professional need to close a job faster?
          </p>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
            {features.map(({ icon, title, desc, bullets }) => (
              <div key={title} style={{
                background: 'white', padding: '32px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  width: 56, height: 56,
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, marginBottom: 20,
                }}>{icon}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{title}</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bullets.map(b => (
                    <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 10, fontWeight: 700,
                      }}>✓</div>
                      <span style={{ color: '#475569', fontSize: 13 }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After Visual */}
      <section style={{ background: '#0f172a', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ color: 'white', fontSize: 32, fontWeight: 800, letterSpacing: '-0.7px', marginBottom: 12 }}>
              The old way vs. the new way
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
              Inspectors used to spend hours writing up what took 30 seconds to photograph.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 4 }}>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <img src="/images/inspector-writing-report.jpg" alt="Inspector writing report by hand"
                style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block', filter: 'grayscale(30%)' }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.2) 60%)',
              }} />
              <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(239,68,68,0.85)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 12px', letterSpacing: '0.5px' }}>BEFORE</div>
              <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Hours of manual write-up</div>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>Clipboard notes → typed report → formatted PDF</div>
              </div>
            </div>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <img src="/images/damaged-roof.jpg" alt="Damaged roof ready for AI analysis"
                style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.2) 60%)',
              }} />
              <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(37,99,235,0.9)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 12px', letterSpacing: '0.5px' }}>AFTER</div>
              <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Upload photos, get a full report</div>
                <div style={{ color: '#93c5fd', fontSize: 13 }}>Complete 11-section report in under 30 seconds</div>
              </div>
            </div>
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
            Ready to try it?
          </h2>
          <p style={{ color: '#93c5fd', fontSize: 16, marginBottom: 36, lineHeight: 1.6 }}>
            Create a free account and generate your first report in minutes.
          </p>
          <Link to="/signup" className="btn-link" style={{
            background: 'white', color: '#1d4ed8', textDecoration: 'none',
            padding: '14px 40px', fontSize: 16, fontWeight: 700,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>Get Started Free →</Link>
        </div>
      </section>

      <footer style={{ background: '#0f172a', padding: '28px 24px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
        <div style={{ marginBottom: 6, color: '#64748b' }}>AI Roof Inspector</div>
        <div style={{ color: '#334155', fontSize: 12 }}>For professional use only · All reports should be verified by a licensed inspector</div>
      </footer>
    </div>
  );
}
