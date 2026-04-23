export default function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 24 }}>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          border: '4px solid var(--slate-200)',
          borderTopColor: '#2563eb',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>
          🔍
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--slate-800)' }}>
          Analyzing your roof...
        </h2>
        <p style={{ color: 'var(--slate-500)', marginTop: 8, fontSize: 15 }}>
          Our AI is inspecting the images for damage and defects.
        </p>
        <p style={{ color: 'var(--slate-400)', fontSize: 13, marginTop: 4 }}>
          This typically takes 15–30 seconds
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        {['Scanning images', 'Identifying issues', 'Generating report'].map((step, i) => (
          <div
            key={step}
            style={{
              padding: '6px 14px', borderRadius: 20,
              background: 'var(--blue-50)', color: 'var(--blue-600)',
              fontSize: 12, fontWeight: 500,
              animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
            }}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
