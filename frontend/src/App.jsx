import { useState } from 'react';
import ImageUploader from './components/ImageUploader.jsx';
import ReportDisplay from './components/ReportDisplay.jsx';
import LoadingState from './components/LoadingState.jsx';
import PropertyInfoForm from './components/PropertyInfoForm.jsx';

const STEPS = ['Property Info', 'Upload Photos', 'Analyzing', 'Report'];

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: done ? '#16a34a' : active ? '#1d4ed8' : '#e2e8f0',
                color: done || active ? 'white' : '#94a3b8',
                transition: 'all 0.3s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                color: active ? '#1d4ed8' : done ? '#16a34a' : '#94a3b8',
              }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 6px', marginBottom: 18,
                background: done ? '#16a34a' : '#e2e8f0',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0); // 0=form, 1=upload, 2=loading, 3=report
  const [propertyInfo, setPropertyInfo] = useState(null);
  const [images, setImages] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  function handleFormSubmit(info) {
    setPropertyInfo(info);
    setStep(1);
  }

  async function handleAnalyze() {
    if (images.length === 0) return;
    setStep(2);
    setError(null);
    setReport(null);

    try {
      const formData = new FormData();
      images.forEach((img) => formData.append('images', img.file));
      if (propertyInfo) {
        formData.append('roofType', propertyInfo.roofType || '');
        formData.append('roofAge', propertyInfo.estimatedRoofAge || '');
        formData.append('numberOfStories', propertyInfo.numberOfStories || '');
      }

      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setReport({
        ...data.report,
        ...propertyInfo,
        imagePreviews: images.map((i) => ({
          src: i.preview,
          isVideoFrame: i.isVideoFrame || false,
          videoName: i.videoName || null,
          name: i.name,
        })),
      });
      setStep(3);
    } catch (err) {
      setError(err.message);
      setStep(1);
    }
  }

  function handleReset() {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setReport(null);
    setError(null);
    setPropertyInfo(null);
    setStep(0);
  }

  const stepIndex = step === 2 ? 2 : step === 3 ? 3 : step;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <header style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        padding: '0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            🏠
          </div>
          <div>
            <h1 style={{ color: 'white', fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>
              AI Roof Inspector
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
              Professional AI-powered roof inspection reports
            </p>
          </div>
          {step > 0 && (
            <button
              onClick={handleReset}
              style={{
                marginLeft: 'auto', background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)', color: 'white',
                padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Start Over
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {step < 3 && <StepIndicator current={stepIndex} />}

        {step === 0 && (
          <PropertyInfoForm onSubmit={handleFormSubmit} />
        )}

        {step === 1 && (
          <div>
            {propertyInfo && (
              <div style={{
                background: 'white', borderRadius: 10, border: '1px solid #e2e8f0',
                padding: '14px 20px', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    {propertyInfo.propertyAddress}, {propertyInfo.city}, {propertyInfo.state} {propertyInfo.zip}
                  </p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Inspector: {propertyInfo.inspectorName} · {propertyInfo.companyName} · {propertyInfo.roofType} · Report {propertyInfo.reportId}
                  </p>
                </div>
                <button
                  onClick={() => setStep(0)}
                  style={{
                    background: 'none', border: '1px solid #cbd5e1', color: '#475569',
                    padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Edit Info
                </button>
              </div>
            )}
            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
                padding: '14px 18px', marginBottom: 20, color: '#b91c1c', fontSize: 14,
              }}>
                Error: {error}
              </div>
            )}
            <ImageUploader
              images={images}
              setImages={setImages}
              onAnalyze={handleAnalyze}
              error={null}
            />
          </div>
        )}

        {step === 2 && <LoadingState />}

        {step === 3 && report && (
          <ReportDisplay report={report} onReset={handleReset} />
        )}
      </main>

      <footer style={{
        textAlign: 'center', padding: '20px',
        color: '#94a3b8', fontSize: 12,
        borderTop: '1px solid #e2e8f0',
      }}>
        AI Roof Inspector — Powered by Claude AI · For professional use only
      </footer>
    </div>
  );
}
