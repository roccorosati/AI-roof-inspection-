import { Link } from 'react-router-dom';
import SmartNav from '../components/SmartNav.jsx';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Try RoofWise on real jobs before committing to anything.',
    cta: 'Get Started Free',
    ctaTo: '/signup',
    dark: false,
    badge: null,
    features: [
      { text: '3 reports per month', included: true },
      { text: 'Full AI damage analysis', included: true },
      { text: '11-section professional report', included: true },
      { text: 'PDF export', included: true },
      { text: 'Report history', included: true },
      { text: 'No watermark', included: false },
    ],
  },
  {
    name: 'Starter',
    price: '$20',
    period: '/month',
    desc: 'For inspectors doing a few jobs a week who want clean, professional output.',
    cta: 'Start Free → Upgrade Anytime',
    ctaTo: '/signup',
    dark: false,
    badge: null,
    features: [
      { text: '15 reports per month', included: true },
      { text: 'Full AI damage analysis', included: true },
      { text: '11-section professional report', included: true },
      { text: 'PDF export', included: true },
      { text: 'Report history', included: true },
      { text: 'No watermark', included: true },
    ],
  },
  {
    name: 'Pro',
    price: '$50',
    period: '/month',
    desc: 'For busy professionals running inspections every day.',
    cta: 'Start Free → Upgrade Anytime',
    ctaTo: '/signup',
    dark: true,
    badge: 'MOST POPULAR',
    features: [
      { text: '50 reports per month', included: true },
      { text: 'Full AI damage analysis', included: true },
      { text: '11-section professional report', included: true },
      { text: 'PDF export', included: true },
      { text: 'Report history', included: true },
      { text: 'No watermark', included: true },
    ],
  },
];

const freeFeatures = ['3 reports / month', 'Full AI analysis', 'PDF export', 'Watermarked PDFs'];
const starterFeatures = ['15 reports / month', 'Full AI analysis', 'PDF export', 'No watermark'];
const proFeatures = ['50 reports / month', 'Full AI analysis', 'PDF export', 'No watermark', 'Priority support'];

const enterpriseFeatures = [
  'Custom report volume',
  'Full AI damage analysis',
  '11-section professional report',
  'PDF export & report history',
  'No watermark',
  'Dedicated account manager',
  'Multi-user team access',
  'White-label branding',
  'API access',
  'SLA guarantee',
  'Custom onboarding',
];

const faqs = [
  {
    q: 'Do I need a credit card to start the free plan?',
    a: 'No. Sign up with just your email and start generating reports immediately. No payment information required until you upgrade.',
  },
  {
    q: 'What happens when I hit my monthly report limit?',
    a: "You'll be prompted to upgrade. Your account and report history are preserved — nothing is lost.",
  },
  {
    q: 'What does the watermark look like on free reports?',
    a: 'A small "Generated on Free Plan · RoofWise" banner appears on the PDF. All the data and analysis is fully intact — only the branding differs.',
  },
  {
    q: 'Can I upgrade or downgrade at any time?',
    a: 'Yes. Upgrade instantly or downgrade at the end of your billing period. Your report history is always preserved.',
  },
  {
    q: 'Do unused reports roll over?',
    a: 'No — the monthly allowance resets at the start of each billing cycle.',
  },
  {
    q: 'What counts as an Enterprise use case?',
    a: 'Multi-inspector teams, roofing companies running 100+ reports a month, insurance carriers, or any organization that needs white-label branding, API access, or a dedicated SLA.',
  },
];

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>
      <SmartNav />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 55%, #1e40af 100%)', padding: '80px 24px 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: 46, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.2px', marginBottom: 18 }}>
            Simple, honest pricing.
          </h1>
          <p style={{ color: '#93c5fd', fontSize: 17, lineHeight: 1.7 }}>
            Try it free. Upgrade when it's saving you time on every job. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Free / Starter / Pro cards */}
      <section style={{ padding: '0 24px', marginTop: -40 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
          {plans.map(({ name, price, period, desc, cta, ctaTo, dark, badge, features }) => (
            <div key={name} style={{
              background: dark ? 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%)' : 'white',
              border: dark ? '1px solid rgba(59,130,246,0.35)' : '1px solid #e2e8f0',
              padding: '36px 28px',
              boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.22)' : '0 2px 12px rgba(0,0,0,0.05)',
              position: 'relative',
            }}>
              {badge && (
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 18px', letterSpacing: '0.8px',
                  whiteSpace: 'nowrap',
                }}>{badge}</div>
              )}

              <div style={{ fontSize: 12, fontWeight: 700, color: dark ? '#60a5fa' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>{name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 44, fontWeight: 800, color: dark ? 'white' : '#0f172a', letterSpacing: '-2px' }}>{price}</span>
                <span style={{ fontSize: 15, color: dark ? '#94a3b8' : '#64748b' }}>{period}</span>
              </div>
              <p style={{ fontSize: 13, color: dark ? '#94a3b8' : '#64748b', lineHeight: 1.6, marginBottom: 24 }}>{desc}</p>

              <Link to={ctaTo} style={{
                display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 28,
                background: dark ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                border: dark ? 'none' : '1.5px solid #1d4ed8',
                color: dark ? 'white' : '#1d4ed8',
                padding: '11px 20px', fontSize: 14, fontWeight: 700,
                boxShadow: dark ? '0 4px 14px rgba(37,99,235,0.4)' : 'none',
              }}>{cta}</Link>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {features.map(({ text, included }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      background: included
                        ? (dark ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : '#eff6ff')
                        : 'transparent',
                      border: included ? 'none' : `1.5px solid ${dark ? '#334155' : '#e2e8f0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700,
                      color: included ? (dark ? 'white' : '#2563eb') : (dark ? '#475569' : '#cbd5e1'),
                    }}>{included ? '✓' : '–'}</div>
                    <span style={{ fontSize: 13, color: included ? (dark ? '#cbd5e1' : '#374151') : (dark ? '#475569' : '#94a3b8') }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise */}
      <section style={{ padding: '28px 24px 72px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            background: 'white', border: '1px solid #e2e8f0',
            padding: '40px 40px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center',
          }}>
            <div style={{ flex: '1 1 320px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Enterprise</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', marginBottom: 10 }}>Custom pricing</div>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
                For roofing companies with multiple inspectors, insurance carriers, and organizations that need
                high-volume processing, white-label reports, team accounts, and a dedicated SLA.
              </p>
              <Link to="/contact" className="btn-link" style={{
                display: 'inline-block', textDecoration: 'none',
                background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
                color: 'white', padding: '13px 32px', fontSize: 15, fontWeight: 700,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              }}>Contact Us →</Link>
            </div>
            <div style={{ flex: '1 1 320px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {enterpriseFeatures.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 10, fontWeight: 700,
                  }}>✓</div>
                  <span style={{ fontSize: 13, color: '#374151' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value callout */}
      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 32 }}>💡</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>The math works in your favor.</div>
            <div style={{ fontSize: 13, color: '#3b5f8a', lineHeight: 1.7 }}>
              If RoofWise saves you one hour of report writing per job at $75/hr, the Pro plan pays for itself after a single inspection.
              At 50 reports a month, that's 50+ hours saved — more than a full work week every month.
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '0 24px 72px', background: 'white' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 64 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', marginBottom: 40, textAlign: 'center' }}>
            Frequently asked questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {faqs.map(({ q, a }, i) => (
              <div key={q} style={{ padding: '22px 0', borderBottom: i < faqs.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{q}</div>
                <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)', padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ color: 'white', fontSize: 34, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 14 }}>
            Start for free today.
          </h2>
          <p style={{ color: '#93c5fd', fontSize: 16, marginBottom: 36, lineHeight: 1.6 }}>
            No credit card required. Generate your first report in under 2 minutes.
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
            }}>Talk to Us</Link>
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
