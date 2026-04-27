import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import AppFooter from '../components/AppFooter.jsx';
import ReportDisplay from '../components/ReportDisplay.jsx';

function conditionColor(condition) {
  return { Excellent: '#16a34a', Good: '#2563eb', Fair: '#d97706', Poor: '#dc2626' }[condition] || '#64748b';
}

function claimBadge(rec) {
  const map = {
    Yes: { bg: '#fef2f2', border: '#fca5a5', color: '#b91c1c', label: 'Claim Recommended' },
    No: { bg: '#f0fdf4', border: '#86efac', color: '#16a34a', label: 'No Claim Needed' },
    'Further Review Needed': { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', label: 'Further Review' },
  };
  return map[rec] || { bg: '#f8fafc', border: '#e2e8f0', color: '#64748b', label: rec };
}

export default function AccountPage() {
  const [reports, setReports] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/me', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/reports', { credentials: 'include' }).then(r => r.json()),
    ]).then(([me, reportsData]) => {
      setUser(me);
      setReports(reportsData.reports || []);
    }).finally(() => setLoading(false));
  }, []);

  function toggleExpand(id) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
        <AppHeader />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#64748b', fontSize: 15 }}>Loading your reports...</div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />

      <main style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '32px 24px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 4 }}>
              My Reports
            </h1>
            {user && (
              <p style={{ color: '#64748b', fontSize: 14 }}>
                Welcome back, <strong style={{ color: '#0f172a' }}>{user.fullName}</strong> · {user.email}
              </p>
            )}
          </div>
          <Link
            to="/app"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white', textDecoration: 'none',
              padding: '10px 22px', fontSize: 14, fontWeight: 700,
              boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
              display: 'inline-block',
            }}
          >
            + New Report
          </Link>
        </div>

        {/* Empty state */}
        {reports.length === 0 && (
          <div style={{
            background: 'white', border: '1px solid #e2e8f0',
            padding: '64px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No reports yet</h2>
            <p style={{ color: '#64748b', fontSize: 15, marginBottom: 28 }}>
              Generate your first AI roof inspection report to see it here.
            </p>
            <Link
              to="/app"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white', textDecoration: 'none',
                padding: '12px 28px', fontSize: 15, fontWeight: 700,
                display: 'inline-block',
              }}
            >
              Generate First Report →
            </Link>
          </div>
        )}

        {/* Report list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reports.map((entry) => {
            const r = entry.report;
            const pi = entry.propertyInfo || {};
            const badge = claimBadge(r.claimRecommendation);
            const isExpanded = expandedId === entry.id;
            const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            });

            return (
              <div key={entry.id} style={{ background: 'white', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {/* Report card header */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 13, fontWeight: 700,
                          color: conditionColor(r.overallCondition),
                        }}>
                          {r.overallCondition || 'Unknown'} — Score {r.overallScore}/10
                        </span>
                        <span style={{
                          background: badge.bg, border: `1px solid ${badge.border}`,
                          color: badge.color, fontSize: 11, fontWeight: 700,
                          padding: '2px 10px', letterSpacing: '0.3px',
                        }}>{badge.label}</span>
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 3 }}>
                        {pi.propertyAddress
                          ? `${pi.propertyAddress}, ${pi.city || ''}, ${pi.state || ''} ${pi.zip || ''}`
                          : 'Address not recorded'}
                      </p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>
                        {dateStr}
                        {pi.roofType && ` · ${pi.roofType}`}
                        {r.imageCount && ` · ${r.imageCount} photo${r.imageCount !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleExpand(entry.id)}
                      style={{
                        background: isExpanded ? '#1d4ed8' : 'white',
                        border: '1px solid #e2e8f0',
                        color: isExpanded ? 'white' : '#374151',
                        padding: '8px 18px', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      {isExpanded ? 'Hide Report ▲' : 'View Report ▼'}
                    </button>
                  </div>

                  {/* Key findings preview */}
                  {!isExpanded && r.keyFindings && r.keyFindings.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {r.keyFindings.slice(0, 3).map((f, i) => (
                        <span key={i} style={{
                          background: '#f1f5f9', border: '1px solid #e2e8f0',
                          color: '#475569', fontSize: 12, padding: '3px 10px',
                        }}>{f}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expanded full report */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #e2e8f0', padding: '0 24px 24px' }}>
                    <ReportDisplay
                      report={{ ...r, ...pi, imagePreviews: [] }}
                      onReset={null}
                      compact
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
