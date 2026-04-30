import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import AppFooter from '../components/AppFooter.jsx';
import ReportDisplay from '../components/ReportDisplay.jsx';

export default function AccountPage() {
  const [user, setUser]           = useState(null);
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [companyNameSaving, setCompanyNameSaving] = useState(false);
  const [companyNameSaved, setCompanyNameSaved] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/me', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/reports', { credentials: 'include' }).then(r => r.json()),
    ]).then(([me, rd]) => {
      setUser(me);
      setCompanyNameInput(me.companyName || '');
      setReports(rd.reports || []);
    }).finally(() => setLoading(false));
  }, []);

  async function handleCompanyNameSave() {
    setCompanyNameSaving(true);
    setCompanyNameSaved(false);
    try {
      const res  = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ companyName: companyNameInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setUser(prev => ({ ...prev, companyName: data.companyName }));
      setCompanyNameSaved(true);
      setTimeout(() => setCompanyNameSaved(false), 2500);
    } catch {
      // silently fail — UI keeps input value
    } finally {
      setCompanyNameSaving(false);
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setLogoError('Logo must be under 4 MB.');
      return;
    }
    setLogoLoading(true);
    setLogoError('');
    try {
      const form = new FormData();
      form.append('logo', file);
      const res  = await fetch('/api/account/logo', { method: 'POST', body: form, credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUser(prev => ({ ...prev, logo: data.logo }));
    } catch (err) {
      setLogoError(err.message);
    } finally {
      setLogoLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleLogoRemove() {
    setLogoLoading(true);
    setLogoError('');
    try {
      const res = await fetch('/api/account/logo', { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to remove logo');
      setUser(prev => ({ ...prev, logo: null }));
    } catch (err) {
      setLogoError(err.message);
    } finally {
      setLogoLoading(false);
    }
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
        <AppHeader />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#64748b', fontSize: 15 }}>Loading account...</div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />

      <main style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '32px 24px' }}>

        {/* Page title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Account</h1>
          <Link to="/app" style={{
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: 'white', textDecoration: 'none',
            padding: '10px 22px', fontSize: 14, fontWeight: 700,
            boxShadow: '0 2px 8px rgba(37,99,235,0.4)', display: 'inline-block',
          }}>+ New Report</Link>
        </div>

        {/* ── Top grid: Account Details + Company Logo ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 28 }}>

          {/* Account Details card */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '28px 28px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 20 }}>Account Details</h2>

            {/* Avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                color: 'white', fontSize: 20, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{initials}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{user?.fullName}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>@{user?.username}</div>
              </div>
            </div>

            {/* Detail rows */}
            {[
              { label: 'Email', value: user?.email },
              { label: 'Username', value: `@${user?.username}` },
              { label: 'Member Since', value: memberSince },
              { label: 'Reports Generated', value: reports.length.toString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{value}</span>
              </div>
            ))}

            {/* Business Entity Name — editable */}
            <div style={{ paddingTop: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                Business Entity Name
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={companyNameInput}
                  onChange={e => setCompanyNameInput(e.target.value)}
                  placeholder="e.g., Acme Roofing LLC"
                  onKeyDown={e => e.key === 'Enter' && handleCompanyNameSave()}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', fontSize: 13, color: '#0f172a', outline: 'none', fontFamily: 'inherit' }}
                />
                <button
                  onClick={handleCompanyNameSave}
                  disabled={companyNameSaving}
                  style={{
                    padding: '8px 16px', fontSize: 13, fontWeight: 600,
                    background: companyNameSaved ? '#16a34a' : '#1d4ed8',
                    color: 'white', border: 'none', cursor: 'pointer', flexShrink: 0,
                    transition: 'background 0.2s',
                  }}
                >
                  {companyNameSaving ? '…' : companyNameSaved ? 'Saved ✓' : 'Save'}
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, lineHeight: 1.5 }}>
                Auto-filled on new inspection reports as the Company Name.
              </p>
            </div>
          </div>

          {/* Company Logo card */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '28px 28px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Company Logo</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20, lineHeight: 1.6 }}>
              Upload your company logo. It will replace the "AI Roof Inspector" mark on all future inspection reports.
            </p>

            {/* Logo preview box */}
            <div style={{
              width: '100%', height: 140,
              border: '2px dashed #cbd5e1',
              background: '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, overflow: 'hidden',
            }}>
              {user?.logo ? (
                <img src={user.logo} alt="Company logo" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🏢</div>
                  <div style={{ fontSize: 12 }}>No logo uploaded</div>
                </div>
              )}
            </div>

            {/* Upload / Remove buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                style={{ display: 'none' }}
                onChange={handleLogoUpload}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={logoLoading}
                style={{
                  flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600,
                  background: logoLoading ? '#e2e8f0' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: logoLoading ? '#94a3b8' : 'white',
                  border: 'none', cursor: logoLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {logoLoading ? 'Uploading…' : user?.logo ? 'Replace Logo' : 'Upload Logo'}
              </button>
              {user?.logo && (
                <button
                  onClick={handleLogoRemove}
                  disabled={logoLoading}
                  style={{
                    padding: '9px 16px', fontSize: 13, fontWeight: 600,
                    background: 'white', border: '1px solid #fca5a5',
                    color: '#b91c1c', cursor: logoLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            {logoError && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 10px' }}>
                {logoError}
              </div>
            )}

            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, lineHeight: 1.5 }}>
              Supported formats: PNG, JPG, WebP, GIF, SVG · Max 4 MB
            </p>
          </div>
        </div>

        {/* ── My Reports section ── */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
            My Reports <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b', marginLeft: 8 }}>{reports.length} total</span>
          </h2>
        </div>

        {reports.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>📋</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No reports yet</h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Generate your first AI roof inspection to see it here.</p>
            <Link to="/app" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', textDecoration: 'none', padding: '11px 28px', fontSize: 14, fontWeight: 700, display: 'inline-block' }}>
              Generate First Report →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reports.map((entry) => {
              const r  = entry.report;
              const pi = entry.propertyInfo || {};
              const isExpanded = expandedId === entry.id;
              const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
              const condColor = { Excellent: '#16a34a', Good: '#2563eb', Fair: '#d97706', Poor: '#dc2626' }[r.overallCondition] || '#64748b';

              return (
                <div key={entry.id} style={{ background: 'white', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: condColor }}>
                            {r.overallCondition || 'Unknown'} — {r.overallScore}/10
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '2px 10px' }}>
                            {r.claimRecommendation === 'Yes' ? 'Claim Recommended' : r.claimRecommendation === 'No' ? 'No Claim' : r.claimRecommendation || '—'}
                          </span>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 3 }}>
                          {pi.propertyAddress ? `${pi.propertyAddress}, ${pi.city || ''}, ${pi.state || ''} ${pi.zip || ''}` : 'Address not recorded'}
                        </p>
                        <p style={{ fontSize: 12, color: '#64748b' }}>
                          {dateStr}{pi.roofType ? ` · ${pi.roofType}` : ''}
                        </p>
                        {!isExpanded && r.keyFindings?.length > 0 && (
                          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {r.keyFindings.slice(0, 3).map((f, i) => (
                              <span key={i} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', fontSize: 11, padding: '2px 9px' }}>{f}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setExpandedId(prev => prev === entry.id ? null : entry.id)}
                        style={{
                          background: isExpanded ? '#1d4ed8' : 'white',
                          border: '1px solid #e2e8f0',
                          color: isExpanded ? 'white' : '#374151',
                          padding: '8px 18px', fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                        }}
                      >
                        {isExpanded ? 'Hide Report ▲' : 'View Report ▼'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #e2e8f0', padding: '0 22px 24px' }}>
                      <ReportDisplay
                        report={{ ...r, ...pi, imagePreviews: [] }}
                        onReset={null}
                        companyLogo={user?.logo || null}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
