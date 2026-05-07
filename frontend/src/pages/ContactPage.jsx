import { useState } from 'react';
import MarketingNav from '../components/MarketingNav.jsx';

const contactReasons = [
  'General question',
  'Technical support',
  'Billing inquiry',
  'Feature request',
  'Partnership / business inquiry',
  'Other',
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: contactReasons[0], message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message.');
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1px solid #cbd5e1', fontSize: 14, color: '#0f172a',
    background: 'white', outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
  };

  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#374151', marginBottom: 6,
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>
      <MarketingNav />

      {/* Hero */}
      <section style={{ position: 'relative', padding: '80px 24px 88px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/drone-roof.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center 36%',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(15,23,42,0.90) 0%, rgba(30,58,95,0.84) 55%, rgba(30,64,175,0.80) 100%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: 44, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.2px', marginBottom: 16 }}>
            Get in touch
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: 17, lineHeight: 1.7 }}>
            Have a question, a feature request, or just want to say hi? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Form + Info */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48 }}>

          {/* Contact Form */}
          <div style={{
            background: 'white', border: '1px solid #e2e8f0',
            padding: '36px 32px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  width: 64, height: 64,
                  background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, margin: '0 auto 20px',
                }}>✓</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Message sent!</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
                  Thanks for reaching out. We'll get back to you at <strong>{form.email}</strong> as soon as possible.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: contactReasons[0], message: '' }); }}
                  style={{
                    marginTop: 24,
                    background: 'transparent', border: '1px solid #cbd5e1',
                    color: '#475569', fontSize: 13, padding: '8px 20px', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 28 }}>Send us a message</h2>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Email <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Subject</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                  >
                    {contactReasons.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Message <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                  />
                </div>

                {error && (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    color: '#b91c1c', padding: '10px 14px', fontSize: 13, marginBottom: 18,
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: 'white', border: 'none',
                    padding: '13px 24px', fontSize: 15, fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'opacity 0.15s',
                  }}
                >
                  {loading ? 'Sending…' : 'Send Message →'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>We typically respond within 24 hours.</h3>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
                Whether you're a roofing professional with questions about how the tool works, an inspector running
                into an issue, or someone exploring a partnership — reach out and we'll get back to you promptly.
              </p>
            </div>

            {[
              {
                icon: '📧',
                title: 'Email',
                detail: 'support@airoofapp.com',
                sub: 'For general questions & support',
              },
              {
                icon: '💼',
                title: 'Business Inquiries',
                detail: 'partners@airoofapp.com',
                sub: 'For partnerships & enterprise plans',
              },
              {
                icon: '🕐',
                title: 'Response Time',
                detail: 'Within 24 hours',
                sub: 'Monday – Friday',
              },
            ].map(({ icon, title, detail, sub }) => (
              <div key={title} style={{
                display: 'flex', gap: 16,
                background: 'white', border: '1px solid #e2e8f0',
                padding: '20px 22px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width: 44, height: 44, flexShrink: 0,
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{detail}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{sub}</div>
                </div>
              </div>
            ))}
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
