import { useRef, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ─── Color maps ────────────────────────────────────────────────────────────────

const CONDITION_COLOR = {
  Excellent: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  Good:      { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  Fair:      { bg: '#fef9c3', text: '#92400e', border: '#fde047' },
  Poor:      { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
};

const DAMAGE_COLOR = {
  None:     { bg: '#f1f5f9', text: '#475569', bar: '#cbd5e1' },
  Minor:    { bg: '#fef9c3', text: '#92400e', bar: '#eab308' },
  Moderate: { bg: '#ffedd5', text: '#9a3412', bar: '#f97316' },
  Severe:   { bg: '#fee2e2', text: '#b91c1c', bar: '#ef4444' },
  Unknown:  { bg: '#f1f5f9', text: '#475569', bar: '#94a3b8' },
};

const SEVERITY_COLOR = {
  Critical: { bg: '#fee2e2', border: '#fca5a5', text: '#b91c1c', dot: '#dc2626' },
  High:     { bg: '#ffedd5', border: '#fdba74', text: '#9a3412', dot: '#ea580c' },
  Medium:   { bg: '#fef9c3', border: '#fde047', text: '#92400e', dot: '#ca8a04' },
  Low:      { bg: '#dcfce7', border: '#86efac', text: '#15803d', dot: '#16a34a' },
};

const MAP_COLOR = {
  Critical: '#fca5a5',
  High:     '#fdba74',
  Medium:   '#fde047',
  Low:      '#86efac',
  Unknown:  '#e2e8f0',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n) {
  return n > 0 ? `$${Number(n).toLocaleString()}` : '—';
}

function getSectionDamage(issues, keywords) {
  const hits = (issues || []).filter((i) =>
    keywords.some((kw) => (i.location || '').toLowerCase().includes(kw))
  );
  if (!hits.length) return 'Unknown';
  for (const sev of ['Critical', 'High', 'Medium', 'Low']) {
    if (hits.some((i) => i.severity === sev)) return sev;
  }
  return 'Unknown';
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ number, title }) {
  return (
    <div style={{
      background: '#0f172a',
      color: 'white',
      padding: '10px 20px',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.8px',
      textTransform: 'uppercase',
      marginBottom: 0,
    }}>
      {number && <span style={{ color: '#60a5fa', marginRight: 8 }}>{number}.</span>}
      {title}
    </div>
  );
}

function DataTable({ rows }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #e2e8f0' }}>
      <tbody>
        {rows.map(([label, value], i) => (
          <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{
              padding: '9px 14px',
              fontSize: 12,
              fontWeight: 600,
              color: '#374151',
              background: i % 2 === 0 ? '#f8fafc' : 'white',
              width: '32%',
              borderRight: '1px solid #e2e8f0',
              verticalAlign: 'top',
            }}>
              {label}
            </td>
            <td style={{
              padding: '9px 14px',
              fontSize: 13,
              color: '#1e293b',
              background: i % 2 === 0 ? '#f8fafc' : 'white',
              lineHeight: 1.5,
            }}>
              {value || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ConditionPill({ value, map = CONDITION_COLOR }) {
  const cfg = map[value] || { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 12px',
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 700,
      background: cfg.bg,
      color: cfg.text,
      border: `1px solid ${cfg.border}`,
    }}>
      {value || '—'}
    </span>
  );
}

function DamageBar({ level }) {
  const cfg = DAMAGE_COLOR[level] || DAMAGE_COLOR.Unknown;
  const widths = { None: '0%', Minor: '25%', Moderate: '55%', Severe: '90%', Unknown: '0%' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        display: 'inline-block',
        width: 100, height: 10, borderRadius: 5,
        background: '#e2e8f0', overflow: 'hidden', flexShrink: 0,
      }}>
        <span style={{
          display: 'block', height: '100%', width: widths[level] || '0%',
          background: cfg.bar, borderRadius: 5, transition: 'width 0.5s',
        }} />
      </span>
      <span style={{
        fontSize: 12, fontWeight: 700, color: cfg.text,
        background: cfg.bg, padding: '1px 8px', borderRadius: 10,
      }}>
        {level || '—'}
      </span>
    </span>
  );
}

function RoofDiagram({ issues }) {
  const front  = getSectionDamage(issues, ['front', 'south', 'street', 'facing']);
  const back   = getSectionDamage(issues, ['back', 'rear', 'north']);
  const left   = getSectionDamage(issues, ['left', 'west']);
  const right  = getSectionDamage(issues, ['right', 'east']);
  const ridge  = getSectionDamage(issues, ['ridge', 'peak', 'center', 'middle', 'hip']);

  const sections = [
    { id: 'front', label: 'Front', points: '10,10 390,10 270,110 130,110', damage: front },
    { id: 'back',  label: 'Back',  points: '130,190 270,190 390,290 10,290', damage: back },
    { id: 'left',  label: 'Left',  points: '10,10 130,110 130,190 10,290', damage: left },
    { id: 'right', label: 'Right', points: '390,10 270,110 270,190 390,290', damage: right },
  ];

  const textPos = {
    front: [200, 60],
    back:  [200, 240],
    left:  [55, 150],
    right: [345, 150],
  };

  return (
    <div style={{ padding: '20px 20px 16px' }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Top-Down Schematic
          </p>
          <svg viewBox="0 0 400 300" width={340} height={260} style={{ display: 'block' }}>
            {/* Outer border */}
            <rect x="10" y="10" width="380" height="280" fill="none" stroke="#94a3b8" strokeWidth="1.5" />

            {/* Four slope sections */}
            {sections.map((s) => (
              <g key={s.id}>
                <polygon
                  points={s.points}
                  fill={MAP_COLOR[s.damage]}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <text
                  x={textPos[s.id][0]}
                  y={textPos[s.id][1]}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#374151"
                  fontFamily="Inter, sans-serif"
                >
                  {s.label}
                </text>
                {s.damage !== 'Unknown' && (
                  <text
                    x={textPos[s.id][0]}
                    y={textPos[s.id][1] + 14}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#64748b"
                    fontFamily="Inter, sans-serif"
                  >
                    {s.damage}
                  </text>
                )}
              </g>
            ))}

            {/* Ridge box */}
            <rect
              x="130" y="110" width="140" height="80"
              fill={MAP_COLOR[ridge]}
              stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,3"
            />
            <text x="200" y="147" textAnchor="middle" fontSize="11" fontWeight="700" fill="#374151" fontFamily="Inter, sans-serif">
              Ridge
            </text>
            {ridge !== 'Unknown' && (
              <text x="200" y="162" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="Inter, sans-serif">
                {ridge}
              </text>
            )}

            {/* Compass */}
            <text x="200" y="8" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="Inter, sans-serif">N</text>
            <text x="200" y="298" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="Inter, sans-serif">S</text>
            <text x="6" y="154" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="Inter, sans-serif">W</text>
            <text x="396" y="154" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="Inter, sans-serif">E</text>
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Damage Key
          </p>
          {[
            ['Critical', '#fca5a5'],
            ['High', '#fdba74'],
            ['Medium', '#fde047'],
            ['Low', '#86efac'],
            ['Unknown / Not Observed', '#e2e8f0'],
          ].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 20, height: 14, background: color, border: '1px solid #94a3b8', borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#374151' }}>{label}</span>
            </div>
          ))}
          <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 12, lineHeight: 1.5 }}>
            Sections shaded based on issue<br />locations identified by AI analysis.
          </p>
        </div>
      </div>
    </div>
  );
}

function SignaturePad() {
  const [mode, setMode] = useState('type');
  const [typedSig, setTypedSig] = useState('');
  const [sigDate, setSigDate] = useState(new Date().toISOString().slice(0, 10));
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    if (mode !== 'draw' || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [mode]);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function startDraw(e) {
    if (!canvasRef.current) return;
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  }

  function draw(e) {
    if (!isDrawing.current || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e, canvasRef.current);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }

  function endDraw() { isDrawing.current = false; }

  function clearCanvas() {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  const tabBtn = (label, val) => (
    <button
      key={val}
      onClick={() => setMode(val)}
      style={{
        padding: '6px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        border: '1px solid #cbd5e1', borderRadius: 6,
        background: mode === val ? '#1d4ed8' : 'white',
        color: mode === val ? 'white' : '#475569',
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Acknowledgment */}
      <div style={{
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 8, padding: '12px 16px', marginBottom: 16,
        fontSize: 12, color: '#475569', lineHeight: 1.6, fontStyle: 'italic',
      }}>
        "By signing below, I confirm that I have reviewed this inspection report, understand its contents,
        and acknowledge the disclaimers stated herein."
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {tabBtn('Type Name', 'type')}
        {tabBtn('Draw Signature', 'draw')}
      </div>

      {mode === 'type' && (
        <div>
          <input
            value={typedSig}
            onChange={(e) => setTypedSig(e.target.value)}
            placeholder="Type your full name"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 22,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              color: '#1e293b',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              background: 'white',
              borderBottom: '2px solid #0f172a',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {mode === 'draw' && (
        <div>
          <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
            <canvas
              ref={canvasRef}
              width={520}
              height={120}
              style={{ display: 'block', cursor: 'crosshair', touchAction: 'none', width: '100%' }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 1, background: '#0f172a', margin: '0 12px',
            }} />
          </div>
          <button
            onClick={clearCanvas}
            style={{
              marginTop: 8, fontSize: 11, color: '#64748b', background: 'none',
              border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline',
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Signature date */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', minWidth: 110 }}>
          Signature Date:
        </span>
        <input
          type="date"
          value={sigDate}
          onChange={(e) => setSigDate(e.target.value)}
          style={{
            padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 5,
            fontSize: 13, color: '#1e293b', fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReportDisplay({ report, onReset }) {
  const reportRef = useRef(null);

  const issues     = report.issues     || [];
  const critCount  = issues.filter((i) => i.severity === 'Critical').length;
  const highCount  = issues.filter((i) => i.severity === 'High').length;
  const totalCost  = (report.costMaterials || 0) + (report.costLabor || 0)
                   + (report.costDisposal || 0)  + (report.costMisc || 0);

  async function handleDownloadPDF() {
    const el = reportRef.current;
    if (!el) return;

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW  = pageW;
    const imgH  = (canvas.height * imgW) / canvas.width;
    let yOffset = 0;
    let remaining = imgH;

    while (remaining > 0) {
      if (yOffset > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -yOffset, imgW, imgH);
      yOffset += pageH;
      remaining -= pageH;
    }

    pdf.save(`roof-inspection-${report.reportId || new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ── Action bar (outside printable area) ──────────────────────────────────────
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
            Inspection Report — {report.propertyAddress || 'Property'}
          </h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
            {report.reportId} · {report.inspectionDate}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onReset}
            style={{
              background: 'white', border: '1px solid #cbd5e1',
              color: '#374151', padding: '8px 18px',
              borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            New Inspection
          </button>
          <button
            onClick={handleDownloadPDF}
            style={{
              background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              border: 'none', color: 'white',
              padding: '8px 20px', borderRadius: 8,
              fontSize: 13, fontWeight: 600,
              boxShadow: '0 2px 8px rgba(37,99,235,0.35)', cursor: 'pointer',
            }}
          >
            ⬇ Download PDF
          </button>
        </div>
      </div>

      {/* ── Printable report ───────────────────────────────────────────────────── */}
      <div
        ref={reportRef}
        style={{
          background: 'white',
          fontFamily: 'Inter, -apple-system, sans-serif',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
        }}
      >

        {/* ── LETTERHEAD ─────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          padding: '28px 32px',
          color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <p style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: '#60a5fa', marginBottom: 4, fontWeight: 600 }}>
                Prepared By
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 4 }}>
                {report.companyName || 'Roofing Company'}
              </h1>
              <p style={{ color: '#94a3b8', fontSize: 13 }}>
                {report.inspectorName || 'Inspector Name'}
                {report.licenseNumber ? ` · License #${report.licenseNumber}` : ''}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: '#60a5fa', marginBottom: 4, fontWeight: 600 }}>
                Roof Inspection Report
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 4 }}>
                {report.reportId || '—'}
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>{report.inspectionDate}</p>
            </div>
          </div>

          {/* Urgency / claim alert */}
          {(critCount > 0 || highCount > 0) && (
            <div style={{
              marginTop: 18, padding: '8px 14px',
              background: 'rgba(220,38,38,0.25)', borderRadius: 8,
              border: '1px solid rgba(252,165,165,0.3)',
              color: '#fca5a5', fontSize: 12, fontWeight: 600,
            }}>
              ⚠ Attention: {critCount > 0 && `${critCount} Critical`}
              {critCount > 0 && highCount > 0 && ' · '}
              {highCount > 0 && `${highCount} High Severity`} issue{(critCount + highCount) > 1 ? 's' : ''} identified
            </div>
          )}
        </div>

        {/* ── SECTION: PROPERTY INFORMATION ──────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid #e2e8f0' }}>
          <SectionHeader title="Property & Inspection Information" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <DataTable rows={[
              ['Property Address', report.propertyAddress],
              ['City, State, ZIP', [report.city, report.state, report.zip].filter(Boolean).join(', ')],
              ['Inspection Date', report.inspectionDate],
              ['Weather Conditions', report.weatherConditions || 'Not recorded'],
              ['Report ID', report.reportId],
            ]} />
            <DataTable rows={[
              ['Inspector Name', report.inspectorName],
              ['Company Name', report.companyName],
              ['License Number', report.licenseNumber || 'N/A'],
              ['Roof Type', report.roofType],
              ['Est. Roof Age', report.estimatedRoofAge ? `${report.estimatedRoofAge}` : '—'],
              ['Number of Stories', report.numberOfStories || '—'],
            ]} />
          </div>
        </div>

        {/* ── SECTION 1: EXECUTIVE SUMMARY ───────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid #e2e8f0' }}>
          <SectionHeader number="1" title="Executive Summary" />

          {/* Stat boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
            {[
              {
                label: 'Overall Roof Condition',
                value: report.overallCondition || '—',
                render: (v) => <ConditionPill value={v} />,
              },
              {
                label: 'Claim Recommendation',
                value: report.claimRecommendation || '—',
                render: (v) => (
                  <span style={{
                    fontWeight: 700, fontSize: 14, color:
                      v === 'Yes' ? '#15803d' : v === 'No' ? '#475569' : '#92400e',
                  }}>{v}</span>
                ),
              },
              {
                label: 'Urgency Level',
                value: report.urgency || '—',
                render: (v) => (
                  <span style={{
                    fontWeight: 700, fontSize: 14, color:
                      v === 'High' ? '#b91c1c' : v === 'Medium' ? '#92400e' : '#15803d',
                  }}>{v}</span>
                ),
              },
            ].map(({ label, value, render }, i) => (
              <div key={i} style={{
                padding: '16px 20px',
                borderRight: i < 2 ? '1px solid #e2e8f0' : 'none',
                borderBottom: '1px solid #e2e8f0',
                background: i % 2 === 0 ? '#f8fafc' : 'white',
              }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  {label}
                </p>
                {render(value)}
              </div>
            ))}
          </div>

          {/* Primary damage types */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
              Primary Damage Assessment
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>Hail Damage</p>
                <DamageBar level={report.hailDamage || 'Unknown'} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>Wind Damage</p>
                <DamageBar level={report.windDamage || 'Unknown'} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>Other Damage</p>
                <span style={{ fontSize: 13, color: '#1e293b' }}>{report.otherDamage || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Key findings */}
          {(report.keyFindings?.length > 0) && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fffbeb' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Key Findings
              </p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {report.keyFindings.map((f, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#1e293b', marginBottom: 5, lineHeight: 1.5 }}>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary paragraph */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Inspector Summary
            </p>
            <p style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.7 }}>
              {report.summary || '—'}
            </p>
          </div>

          {/* Cost + urgency row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <div style={{ padding: '14px 20px', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                Estimated Repair / Replacement Cost
              </p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                {report.minCost > 0 || report.maxCost > 0
                  ? `${fmt$(report.minCost)} – ${fmt$(report.maxCost)}`
                  : 'Estimate not available'}
              </p>
            </div>
            <div style={{ padding: '14px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                Condition Score
              </p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                {report.overallScore}/10
                <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b', marginLeft: 8 }}>
                  ({report.overallCondition || '—'})
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: DETAILED FINDINGS ───────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid #e2e8f0' }}>
          <SectionHeader number="2" title="Detailed Findings" />

          {/* 2.1 Roof Surface */}
          <div style={{ borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ padding: '10px 20px', background: '#1e3a5f', color: '#93c5fd', fontSize: 11, fontWeight: 700, letterSpacing: '0.4px' }}>
              2.1 ROOF SURFACE
            </div>
            <DataTable rows={[
              ['Damage Type(s) Detected', report.surface?.damageTypes],
              ['Hail Impact Count', report.surface?.hailImpactCount],
              ['Granule Loss', report.surface?.granuleLoss],
              ['Shingle Condition', report.surface?.shingleCondition],
              ['Wind Damage Indicators', report.surface?.windIndicators],
              ['Notes', report.surface?.notes],
            ]} />
          </div>

          {/* 2.2 Flashing */}
          <div style={{ borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ padding: '10px 20px', background: '#1e3a5f', color: '#93c5fd', fontSize: 11, fontWeight: 700, letterSpacing: '0.4px' }}>
              2.2 FLASHING (CHIMNEYS, VENTS, VALLEYS)
            </div>
            <DataTable rows={[
              ['Condition', report.flashing?.condition],
              ['Type of Damage', report.flashing?.damageType],
              ['Notes', report.flashing?.notes],
            ]} />
          </div>

          {/* 2.3 Gutters */}
          <div style={{ borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ padding: '10px 20px', background: '#1e3a5f', color: '#93c5fd', fontSize: 11, fontWeight: 700, letterSpacing: '0.4px' }}>
              2.3 GUTTERS AND DOWNSPOUTS
            </div>
            <DataTable rows={[
              ['Condition', report.gutters?.condition],
              ['Evidence of Impact', report.gutters?.evidenceOfImpact],
              ['Drainage Functionality', report.gutters?.drainage],
              ['Notes', report.gutters?.notes],
            ]} />
          </div>

          {/* 2.4 Penetrations */}
          <div style={{ borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ padding: '10px 20px', background: '#1e3a5f', color: '#93c5fd', fontSize: 11, fontWeight: 700, letterSpacing: '0.4px' }}>
              2.4 ROOF PENETRATIONS (VENTS, SKYLIGHTS, ETC.)
            </div>
            <DataTable rows={[
              ['Condition', report.penetrations?.condition],
              ['Seal Integrity', report.penetrations?.sealIntegrity],
              ['Notes', report.penetrations?.notes],
            ]} />
          </div>

          {/* 2.5 Attic / Interior */}
          <div>
            <div style={{ padding: '10px 20px', background: '#1e3a5f', color: '#93c5fd', fontSize: 11, fontWeight: 700, letterSpacing: '0.4px' }}>
              2.5 INTERIOR / ATTIC
            </div>
            <DataTable rows={[
              ['Signs of Leaks', report.attic?.signsOfLeaks],
              ['Water Stains', report.attic?.waterStains],
              ['Mold / Moisture Indicators', report.attic?.moldMoisture],
              ['Notes', report.attic?.notes],
            ]} />
          </div>
        </div>

        {/* ── SECTION 3: IMAGE DOCUMENTATION ─────────────────────────────────── */}
        {report.imagePreviews?.length > 0 && (
          <div style={{ borderBottom: '1px solid #e2e8f0' }}>
            <SectionHeader number="3" title="Image Documentation" />
            <div style={{ padding: '16px 20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 14,
              }}>
                {report.imagePreviews.map((item, i) => {
                  const src   = typeof item === 'string' ? item : item.src;
                  const label = typeof item === 'object' ? item.name : `Photo ${i + 1}`;
                  const isVid = typeof item === 'object' && item.isVideoFrame;
                  return (
                    <figure key={i} style={{ margin: 0 }}>
                      <div style={{
                        position: 'relative', borderRadius: 6, overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      }}>
                        <img
                          src={src}
                          alt={`Fig. ${i + 1}`}
                          style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                        />
                        {isVid && (
                          <span style={{
                            position: 'absolute', top: 6, right: 6,
                            background: 'rgba(30,58,95,0.85)', color: 'white',
                            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          }}>
                            VIDEO FRAME
                          </span>
                        )}
                      </div>
                      <figcaption style={{
                        fontSize: 11, color: '#64748b', marginTop: 5,
                        textAlign: 'center', fontStyle: 'italic',
                      }}>
                        Fig. {i + 1} — {isVid ? `Video frame @ ${label}` : label}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 4: ROOF DIAGRAM / DAMAGE MAP ───────────────────────────── */}
        <div style={{ borderBottom: '1px solid #e2e8f0' }}>
          <SectionHeader number="4" title="Roof Diagram / Damage Map" />
          <RoofDiagram issues={issues} />
        </div>

        {/* ── SECTION 5: IDENTIFIED ISSUES ───────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid #e2e8f0' }}>
          <SectionHeader number="5" title="Identified Issues" />

          {issues.length === 0 ? (
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>No Issues Detected</p>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                The roof appears to be in good condition based on submitted photos.
              </p>
            </div>
          ) : (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Summary counts */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                {['Critical', 'High', 'Medium', 'Low'].map((sev) => {
                  const count = issues.filter((i) => i.severity === sev).length;
                  if (!count) return null;
                  const cfg = SEVERITY_COLOR[sev];
                  return (
                    <span key={sev} style={{
                      fontSize: 12, fontWeight: 700,
                      padding: '3px 12px', borderRadius: 20,
                      background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
                    }}>
                      {count} {sev}
                    </span>
                  );
                })}
                <span style={{ fontSize: 12, color: '#64748b', padding: '3px 0' }}>
                  {issues.length} total issue{issues.length !== 1 ? 's' : ''} identified
                </span>
              </div>

              {/* Issue cards */}
              {issues.map((issue, idx) => {
                const cfg = SEVERITY_COLOR[issue.severity] || SEVERITY_COLOR.Low;
                return (
                  <div key={idx} style={{
                    border: `1px solid ${cfg.border}`,
                    borderLeft: `4px solid ${cfg.dot}`,
                    borderRadius: 6, overflow: 'hidden',
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 14px', background: cfg.bg, flexWrap: 'wrap', gap: 8,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {idx + 1}. {issue.type}
                      </span>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#475569' }}>
                          Location: {issue.location || '—'}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 12,
                          background: cfg.dot, color: 'white',
                        }}>
                          {issue.severity}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                      <div style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>
                          Description
                        </p>
                        <p style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.55 }}>{issue.description || '—'}</p>
                      </div>
                      <div style={{ padding: '10px 14px' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>
                          Recommended Action
                        </p>
                        <p style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.55 }}>{issue.recommendation || '—'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SECTION 6: RECOMMENDATIONS ─────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid #e2e8f0' }}>
          <SectionHeader number="6" title="Recommendations" />
          <div style={{ padding: '16px 20px' }}>

            {/* Recommended action — prominent */}
            <div style={{
              background: '#0f172a', borderRadius: 8, padding: '14px 20px',
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: 120 }}>
                Recommended Action
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>
                {report.recommendedAction || '—'}
              </span>
            </div>

            <DataTable rows={[
              ['Justification', report.justification],
              ['Estimated Timeline', report.timeline],
            ]} />

            {report.additionalRecommendations?.length > 0 && (
              <div style={{ padding: '12px 0', marginTop: 4 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Additional Recommendations
                </p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {report.additionalRecommendations.map((r, i) => (
                    <li key={i} style={{ fontSize: 13, color: '#1e293b', marginBottom: 5, lineHeight: 1.5 }}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 7: INSURANCE SUPPORTING INFORMATION ─────────────────────── */}
        <div style={{ borderBottom: '1px solid #e2e8f0' }}>
          <SectionHeader number="7" title="Insurance Supporting Information" />
          <DataTable rows={[
            ['Storm Type', report.stormType],
            ['Estimated Storm Date', report.estimatedStormDate],
            ['Damage Consistent with Storm Event', report.damageConsistency],
            ['Supporting Notes for Claim', report.insuranceNotes],
          ]} />
        </div>

        {/* ── SECTION 8: COST ESTIMATE ────────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid #e2e8f0' }}>
          <SectionHeader number="8" title="Cost Estimate" />
          <div style={{ padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #e2e8f0' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px 20px', fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>
                    Line Item
                  </th>
                  <th style={{ padding: '10px 20px', fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>
                    Estimated Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Materials', report.costMaterials],
                  ['Labor', report.costLabor],
                  ['Disposal / Haul-Off', report.costDisposal],
                  ['Miscellaneous', report.costMisc],
                ].map(([label, val], i) => (
                  <tr key={label} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                    <td style={{ padding: '9px 20px', fontSize: 13, color: '#1e293b' }}>{label}</td>
                    <td style={{ padding: '9px 20px', fontSize: 13, color: '#1e293b', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt$(val)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#0f172a' }}>
                  <td style={{ padding: '11px 20px', fontSize: 13, fontWeight: 800, color: 'white' }}>
                    Total Estimated Cost
                  </td>
                  <td style={{ padding: '11px 20px', fontSize: 16, fontWeight: 800, color: 'white', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {totalCost > 0 ? fmt$(totalCost) : '—'}
                  </td>
                </tr>
                {(report.minCost > 0 || report.maxCost > 0) && (
                  <tr style={{ background: '#1e3a5f' }}>
                    <td colSpan={2} style={{ padding: '7px 20px', fontSize: 11, color: '#93c5fd', textAlign: 'right' }}>
                      Overall Estimated Range: {fmt$(report.minCost)} – {fmt$(report.maxCost)}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
            <p style={{ padding: '10px 20px', fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
              * Cost estimates are based on visual AI analysis and regional averages. Final pricing will vary based on contractor assessment, material availability, and local market conditions.
            </p>
          </div>
        </div>

        {/* ── SECTION 9: DISCLAIMERS ──────────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid #e2e8f0' }}>
          <SectionHeader number="9" title="Disclaimers & Limitations" />
          <div style={{ padding: '16px 20px', background: '#f8fafc' }}>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'This report is based on a visual inspection of the roof surface using photographic evidence. No destructive testing or invasive investigation was performed.',
                'Findings reflect observable conditions at the time of inspection only. Hidden or concealed damage not visible from photographs may exist and is not covered by this report.',
                'This report does not constitute a guarantee, warranty, or prediction of future performance of any roof component.',
                'AI-assisted analysis is intended to aid licensed professionals and does not replace a physical on-site inspection by a certified roofing contractor.',
                'Cost estimates are approximations based on typical industry pricing and are subject to change based on contractor bids, material costs, and site conditions.',
                'This report does not guarantee approval of any insurance claim. Final claim decisions are at the sole discretion of the insurance carrier.',
                'The inspector and issuing company assume no liability for damages arising from reliance on this report beyond the scope of the visual inspection described herein.',
              ].map((text, i) => (
                <li key={i} style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{text}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── SECTION 10: SIGN-OFF ────────────────────────────────────────────── */}
        <div>
          <SectionHeader number="10" title="Sign-Off" />

          {/* Inspector certification */}
          <div style={{ borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ padding: '10px 20px', background: '#f0f9ff', borderBottom: '1px solid #bae6fd' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Inspector Certification
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '16px 20px', gap: 20 }}>
              <div>
                <DataTable rows={[
                  ['Inspector Name', report.inspectorName],
                  ['Company Name', report.companyName],
                  ['License Number', report.licenseNumber || 'N/A'],
                  ['Date of Report', report.inspectionDate],
                ]} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8, paddingBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Inspector Signature
                </p>
                <div style={{
                  height: 64, border: '1px solid #e2e8f0', borderRadius: 4,
                  background: '#f8fafc',
                  borderBottom: '2px solid #0f172a',
                  display: 'flex', alignItems: 'flex-end', paddingBottom: 6, paddingLeft: 12,
                }}>
                  <span style={{ fontSize: 9, color: '#94a3b8', fontStyle: 'italic' }}>Authorized signature</span>
                </div>
              </div>
            </div>
          </div>

          {/* Homeowner / Client signature */}
          <div style={{ padding: '20px 20px 24px' }}>
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 8, padding: '12px 16px', marginBottom: 16,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
                Homeowner / Client Acknowledgment
              </p>
              <p style={{ fontSize: 12, color: '#78350f' }}>
                Please review and sign below to confirm receipt and understanding of this inspection report.
              </p>
            </div>
            <SignaturePad />
          </div>
        </div>

        {/* Document footer */}
        <div style={{
          background: '#0f172a',
          padding: '12px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 8,
        }}>
          <span style={{ color: '#475569', fontSize: 11 }}>
            {report.companyName || 'AI Roof Inspector'} · {report.reportId || ''}
          </span>
          <span style={{ color: '#475569', fontSize: 11 }}>
            AI-Assisted Analysis — Powered by Claude AI · {report.inspectionDate}
          </span>
        </div>
      </div>
    </div>
  );
}
