import { useRef, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n) {
  return n > 0 ? `$${Number(n).toLocaleString()}` : '—';
}

function getSev(issues, keywords) {
  const hits = (issues || []).filter(i =>
    keywords.some(kw => (i.location || '').toLowerCase().includes(kw))
  );
  if (!hits.length) return 'Unknown';
  for (const s of ['Critical', 'High', 'Medium', 'Low']) {
    if (hits.some(i => i.severity === s)) return s;
  }
  return 'Unknown';
}

// ─── Building-block components ─────────────────────────────────────────────────

// Strips white/near-white background from logo using canvas pixel manipulation
function LogoImage({ src }) {
  const [cleanSrc, setCleanSrc] = useState(null);

  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          // For pixels where all channels are above 210, fade alpha toward 0 as they approach white
          if (r > 210 && g > 210 && b > 210) {
            const whiteness = (r + g + b) / 3;
            d[i + 3] = Math.round(d[i + 3] * Math.max(0, 1 - (whiteness - 210) / 45));
          }
        }
        ctx.putImageData(imageData, 0, 0);
        setCleanSrc(canvas.toDataURL('image/png'));
      } catch {
        setCleanSrc(src); // fallback if canvas is tainted
      }
    };
    img.onerror = () => setCleanSrc(src);
    img.src = src;
  }, [src]);

  if (!cleanSrc) return null;
  return (
    <img src={cleanSrc} alt="Company Logo" style={{ maxHeight: 60, maxWidth: 220, objectFit: 'contain', display: 'block' }} />
  );
}

// Page header — logo left, title right, rule below
function PageHeader({ num, report, companyLogo }) {
  return (
    <div style={{ padding: '16px 24px 0', fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <div style={{ textAlign: 'right', fontSize: 10, color: '#444', marginBottom: 2 }}>Page {num}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>

        {/* Logo block — company image or fallback text */}
        {companyLogo ? (
          <div style={{ height: 60, display: 'flex', alignItems: 'center' }}>
            <LogoImage src={companyLogo} />
          </div>
        ) : (
          <div style={{ border: '3px solid #000', padding: '4px 10px', display: 'inline-block', lineHeight: 1.1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '2px' }}>AI ROOF</div>
            <div style={{ fontSize: 10, fontWeight: 800, background: '#000', color: '#fff', padding: '2px 6px', letterSpacing: '4px', textAlign: 'center' }}>
              INSPECTOR
            </div>
          </div>
        )}

        {/* Title + ID */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 17, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Roof Inspection Report
          </div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
            {report.reportId} · {report.inspectionDate}
          </div>
        </div>
      </div>

      {/* Rule with company / inspector line */}
      <div style={{
        borderTop: '2px solid #000', borderBottom: '2px solid #000',
        padding: '4px 0', textAlign: 'center',
        fontSize: 11, fontWeight: 600, color: '#222',
        marginBottom: 14,
      }}>
        {[report.companyName, report.inspectorName, report.licenseNumber ? `License #${report.licenseNumber}` : null]
          .filter(Boolean).join('  ·  ') || 'AI Roof Inspector'}
      </div>
    </div>
  );
}

// Page footer — thin rule + three-column info
function PageFooter({ num, reportId, inspectionDate }) {
  return (
    <div style={{
      borderTop: '1.5px solid #000',
      padding: '6px 24px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 10, color: '#555', marginTop: 'auto',
    }}>
      <span>AI Roof Inspector · Confidential Inspection Report</span>
      <span>Page {num}</span>
      <span>{reportId} · {inspectionDate}</span>
    </div>
  );
}

// Bordered section box with bold title bar (like the checklist in the reference)
function Section({ title, children }) {
  return (
    <div style={{ border: '2px solid #000', marginBottom: 14 }}>
      <div style={{
        padding: '5px 10px',
        fontWeight: 800, fontSize: 11,
        textTransform: 'uppercase', letterSpacing: '0.6px',
        borderBottom: '2px solid #000',
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// Light gray sub-section header inside a Section
function Sub({ title }) {
  return (
    <div style={{
      padding: '4px 10px',
      fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.5px',
      background: '#e0e0e0', borderBottom: '1px solid #bbb',
      borderTop: '1px solid #bbb',
    }}>
      {title}
    </div>
  );
}

// Single label | value row
function Row({ label, value, last, tall, labelW = '36%' }) {
  return (
    <div style={{ display: 'flex', borderBottom: last ? 'none' : '1px solid #ccc', minHeight: tall ? 56 : 24 }}>
      <div style={{
        width: labelW, padding: '5px 10px', fontSize: 11, fontWeight: 600,
        borderRight: '1px solid #ccc', background: '#f7f7f7',
        flexShrink: 0, lineHeight: 1.4,
      }}>
        {label}
      </div>
      <div style={{ flex: 1, padding: '5px 10px', fontSize: 11, lineHeight: 1.55 }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

// Two label|value pairs side-by-side, divided by a thick rule
function Row2({ left, right, last, labelW = '42%' }) {
  return (
    <div style={{ display: 'flex', borderBottom: last ? 'none' : '1px solid #ccc', minHeight: 24 }}>
      <div style={{ flex: 1, display: 'flex', borderRight: '2px solid #000' }}>
        <div style={{ width: labelW, padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRight: '1px solid #ccc', background: '#f7f7f7', flexShrink: 0 }}>{left.label}</div>
        <div style={{ flex: 1, padding: '5px 10px', fontSize: 11, lineHeight: 1.55 }}>{left.value ?? '—'}</div>
      </div>
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ width: labelW, padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRight: '1px solid #ccc', background: '#f7f7f7', flexShrink: 0 }}>{right.label}</div>
        <div style={{ flex: 1, padding: '5px 10px', fontSize: 11, lineHeight: 1.55 }}>{right.value ?? '—'}</div>
      </div>
    </div>
  );
}

// Checkbox-selector row  (■ selected  □ not selected)
function CheckRow({ label, options, selected, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      borderBottom: last ? 'none' : '1px solid #ccc',
      padding: '6px 10px', minHeight: 28, gap: 8,
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, width: '34%', flexShrink: 0 }}>{label}:</span>
      <span style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {options.map(opt => (
          <span key={opt} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10,
              border: '1.5px solid #000',
              background: selected === opt ? '#000' : '#fff',
              flexShrink: 0,
            }} />
            {opt}
          </span>
        ))}
      </span>
    </div>
  );
}

// Full-width text block
function TextBlock({ text, last, minH }) {
  return (
    <div style={{
      padding: '8px 12px', fontSize: 11, lineHeight: 1.7, color: '#111',
      borderBottom: last ? 'none' : '1px solid #ccc',
      minHeight: minH,
    }}>
      {text || '—'}
    </div>
  );
}

// Bullet list block
function Bullets({ items, last }) {
  return (
    <div style={{ padding: '8px 12px 8px 10px', borderBottom: last ? 'none' : '1px solid #ccc' }}>
      {items?.length > 0
        ? items.map((item, i) => (
          <div key={i} style={{ fontSize: 11, lineHeight: 1.6, marginBottom: 3, display: 'flex', gap: 8 }}>
            <span style={{ flexShrink: 0 }}>•</span><span>{item}</span>
          </div>
        ))
        : <span style={{ fontSize: 11, color: '#777' }}>—</span>
      }
    </div>
  );
}

// Roof damage map (top-down schematic, grayscale)
function RoofDiagram({ issues }) {
  const fill = { Critical: '#888', High: '#aaa', Medium: '#c8c8c8', Low: '#e0e0e0', Unknown: '#f2f2f2' };
  const sections = [
    { id: 'Front', points: '10,10 390,10 270,110 130,110', sev: getSev(issues, ['front','south','street','facing']), tx: 200, ty: 55 },
    { id: 'Back',  points: '130,190 270,190 390,290 10,290', sev: getSev(issues, ['back','rear','north']),             tx: 200, ty: 245 },
    { id: 'Left',  points: '10,10 130,110 130,190 10,290',   sev: getSev(issues, ['left','west']),                    tx: 55,  ty: 150 },
    { id: 'Right', points: '390,10 270,110 270,190 390,290', sev: getSev(issues, ['right','east']),                   tx: 345, ty: 150 },
  ];
  const ridge = getSev(issues, ['ridge','peak','center','middle','hip']);

  return (
    <div style={{ display: 'flex', gap: 24, padding: '12px 16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, color: '#555', letterSpacing: '0.4px' }}>Top-Down Schematic</div>
        <svg viewBox="0 0 400 300" width={290} height={218} style={{ display: 'block', border: '1px solid #bbb' }}>
          {sections.map(s => (
            <g key={s.id}>
              <polygon points={s.points} fill={fill[s.sev]} stroke="#666" strokeWidth="1" />
              <text x={s.tx} y={s.ty} textAnchor="middle" fontSize="11" fontWeight="700" fill="#222" fontFamily="sans-serif">{s.id}</text>
              {s.sev !== 'Unknown' && (
                <text x={s.tx} y={s.ty + 13} textAnchor="middle" fontSize="9" fill="#555" fontFamily="sans-serif">{s.sev}</text>
              )}
            </g>
          ))}
          <rect x="130" y="110" width="140" height="80" fill={fill[ridge]} stroke="#666" strokeWidth="1.5" strokeDasharray="4,3" />
          <text x="200" y="147" textAnchor="middle" fontSize="11" fontWeight="700" fill="#222" fontFamily="sans-serif">Ridge</text>
          {ridge !== 'Unknown' && (
            <text x="200" y="162" textAnchor="middle" fontSize="9" fill="#555" fontFamily="sans-serif">{ridge}</text>
          )}
          <text x="200" y="8"   textAnchor="middle" fontSize="8" fill="#999" fontFamily="sans-serif">N</text>
          <text x="200" y="298" textAnchor="middle" fontSize="8" fill="#999" fontFamily="sans-serif">S</text>
          <text x="6"   y="154" textAnchor="middle" fontSize="8" fill="#999" fontFamily="sans-serif">W</text>
          <text x="396" y="154" textAnchor="middle" fontSize="8" fill="#999" fontFamily="sans-serif">E</text>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, color: '#555', letterSpacing: '0.4px' }}>Damage Key</div>
        {[['Critical','#888'],['High','#aaa'],['Medium','#c8c8c8'],['Low','#e0e0e0'],['None / Unknown','#f2f2f2']].map(([lbl, col]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 22, height: 13, background: col, border: '1px solid #999', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#333' }}>{lbl}</span>
          </div>
        ))}
        <p style={{ fontSize: 10, color: '#888', marginTop: 10, lineHeight: 1.5, fontStyle: 'italic' }}>
          Shading based on issue<br />locations from AI analysis.
        </p>
      </div>
    </div>
  );
}

// Signature pad
function SignaturePad() {
  const [mode, setMode]       = useState('type');
  const [typedSig, setTypedSig] = useState('');
  const [sigDate, setSigDate] = useState(new Date().toISOString().slice(0, 10));
  const canvasRef   = useRef(null);
  const isDrawing   = useRef(false);
  const lastPos     = useRef(null);

  useEffect(() => {
    if (mode !== 'draw' || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }, [mode]);

  function getPos(e, c) {
    const r = c.getBoundingClientRect(), src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  }
  function startDraw(e) { e.preventDefault(); isDrawing.current = true; lastPos.current = getPos(e, canvasRef.current); }
  function draw(e) {
    if (!isDrawing.current || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d'), pos = getPos(e, canvasRef.current);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    lastPos.current = pos;
  }
  function endDraw() { isDrawing.current = false; }
  function clearCanvas() {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  return (
    <div>
      <div style={{ border: '1px solid #ccc', background: '#f9f9f9', padding: '8px 12px', marginBottom: 12, fontSize: 11, fontStyle: 'italic', color: '#444', lineHeight: 1.6 }}>
        "By signing below, I confirm that I have reviewed this inspection report, understand its contents, and acknowledge the disclaimers stated herein."
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {[['type','Type Name'],['draw','Draw Signature']].map(([m, lbl]) => (
          <button key={m} onClick={() => setMode(m)} style={{ padding: '5px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1.5px solid #000', background: mode === m ? '#000' : '#fff', color: mode === m ? '#fff' : '#333' }}>
            {lbl}
          </button>
        ))}
      </div>
      {mode === 'type' ? (
        <input value={typedSig} onChange={e => setTypedSig(e.target.value)} placeholder="Type your full name"
          style={{ width: '100%', padding: '10px 14px', fontSize: 22, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#111', border: '1px solid #ccc', borderBottom: '2px solid #000', outline: 'none', boxSizing: 'border-box' }} />
      ) : (
        <div>
          <div style={{ border: '1px solid #ccc', overflow: 'hidden', position: 'relative' }}>
            <canvas ref={canvasRef} width={520} height={100} style={{ display: 'block', cursor: 'crosshair', touchAction: 'none', width: '100%' }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: '#000', margin: '0 12px' }} />
          </div>
          <button onClick={clearCanvas} style={{ marginTop: 6, fontSize: 11, color: '#555', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear</button>
        </div>
      )}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, minWidth: 100 }}>Signature Date:</span>
        <input type="date" value={sigDate} onChange={e => setSigDate(e.target.value)}
          style={{ padding: '4px 8px', border: '1px solid #ccc', fontSize: 12, color: '#111', fontFamily: 'inherit' }} />
      </div>
    </div>
  );
}

// ─── Page style ────────────────────────────────────────────────────────────────

const PAGE_STYLE = {
  width: 816,
  minHeight: 1056,
  background: 'white',
  margin: '0 auto 28px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
  fontFamily: 'Georgia, "Times New Roman", serif',
  position: 'relative',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
};

// ─── Main component ────────────────────────────────────────────────────────────

export default function ReportDisplay({ report, onReset, companyLogo }) {
  const reportRef = useRef(null);
  const issues    = report.issues || [];
  const critCount = issues.filter(i => i.severity === 'Critical').length;
  const highCount = issues.filter(i => i.severity === 'High').length;
  const totalCost = (report.costMaterials || 0) + (report.costLabor || 0)
                  + (report.costDisposal  || 0) + (report.costMisc  || 0);
  const fp = { reportId: report.reportId, inspectionDate: report.inspectionDate };

  async function handleDownloadPDF() {
    const pages = reportRef.current?.querySelectorAll('[data-pdf-page]');
    if (!pages?.length) return;
    const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    let firstPdfPage = true;
    for (const page of pages) {
      const canvas = await html2canvas(page, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      // How many canvas pixels equal one PDF page height
      const mmPerPx    = pdfW / canvas.width;
      const pageHtPx   = Math.round(pdfH / mmPerPx);
      // Slice the canvas into letter-page-sized strips, one PDF page per strip
      let srcY = 0;
      while (srcY < canvas.height) {
        if (!firstPdfPage) pdf.addPage();
        firstPdfPage = false;
        const sliceH  = Math.min(pageHtPx, canvas.height - srcY);
        const slice   = document.createElement('canvas');
        slice.width   = canvas.width;
        slice.height  = pageHtPx;
        const ctx = slice.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, pdfW, pdfH);
        srcY += pageHtPx;
      }
    }
    pdf.save(`roof-inspection-${report.reportId || new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div>
      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Inspection Report — {report.propertyAddress || 'Property'}</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{report.reportId} · {report.inspectionDate}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onReset} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#374151', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            New Inspection
          </button>
          <button onClick={handleDownloadPDF} style={{ background: '#000', border: 'none', color: 'white', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.25)', cursor: 'pointer' }}>
            ⬇ Download PDF
          </button>
        </div>
      </div>

      {/* Pages (Google-Docs-style gray container) */}
      <div ref={reportRef} style={{ background: '#94a3b8', padding: '32px 16px', borderRadius: 4 }}>

        {/* ══ PAGE 1: Property Info + Inspector + Overview + Damage Summary ═══ */}
        <div data-pdf-page style={PAGE_STYLE}>
          <PageHeader companyLogo={companyLogo} num={1} report={report} />
          <div style={{ padding: '0 24px', flex: 1 }}>

            {(critCount > 0 || highCount > 0) && (
              <div style={{ border: '2px solid #000', padding: '7px 12px', marginBottom: 14, fontSize: 11, fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>⚠</span>
                <span>
                  ATTENTION: {critCount > 0 && `${critCount} Critical`}
                  {critCount > 0 && highCount > 0 && ' · '}
                  {highCount > 0 && `${highCount} High Severity`}
                  {' '}issue{(critCount + highCount) > 1 ? 's' : ''} identified — immediate review recommended
                </span>
              </div>
            )}

            <Section title="Property / Building Information">
              <Row2 left={{ label: 'Inspection Date', value: report.inspectionDate }} right={{ label: 'Inspector', value: report.inspectorName }} />
              <Row2 left={{ label: 'Property Address', value: report.propertyAddress }} right={{ label: 'Number of Stories', value: report.numberOfStories || '—' }} />
              <Row2 left={{ label: 'City', value: report.city }} right={{ label: 'State / ZIP', value: [report.state, report.zip].filter(Boolean).join('  ') }} />
              <Row2 left={{ label: 'Weather Conditions', value: report.weatherConditions || 'Not recorded' }} right={{ label: 'Report ID', value: report.reportId }} last />
            </Section>

            <Section title="Inspector / Company Information">
              <Row2 left={{ label: 'Inspector Name', value: report.inspectorName }} right={{ label: 'Company Name', value: report.companyName }} />
              <Row2 left={{ label: 'License Number', value: report.licenseNumber || 'N/A' }} right={{ label: 'Date of Inspection', value: report.inspectionDate }} last />
            </Section>

            <Section title="Roof Overview">
              <Row2 left={{ label: 'Roof Type', value: report.roofType }} right={{ label: 'Estimated Roof Age', value: report.estimatedRoofAge || '—' }} />
              <Row2 left={{ label: 'Number of Stories', value: report.numberOfStories || '—' }} right={{ label: 'Condition Score', value: report.overallScore ? `${report.overallScore} / 10` : '—' }} />
              <CheckRow label="Overall Condition" options={['Excellent', 'Good', 'Fair', 'Poor']} selected={report.overallCondition} last />
            </Section>

            <Section title="Damage Summary">
              <CheckRow label="Hail Damage"  options={['None', 'Minor', 'Moderate', 'Severe']} selected={report.hailDamage} />
              <CheckRow label="Wind Damage"  options={['None', 'Minor', 'Moderate', 'Severe']} selected={report.windDamage} />
              <Row label="Other / Additional Damage" value={report.otherDamage || 'None'} />
              <div style={{ display: 'flex' }}>
                <div style={{ flex: 1, borderRight: '2px solid #000' }}>
                  <CheckRow label="Claim Recommended" options={['Yes', 'No']} selected={report.claimRecommendation} last />
                </div>
                <div style={{ flex: 1 }}>
                  <CheckRow label="Urgency Level" options={['High', 'Medium', 'Low']} selected={report.urgency} last />
                </div>
              </div>
            </Section>

          </div>
          <PageFooter num={1} {...fp} />
        </div>

        {/* ══ PAGE 2: Executive Summary + Recommended Action + Cost Estimate ═══ */}
        <div data-pdf-page style={PAGE_STYLE}>
          <PageHeader companyLogo={companyLogo} num={2} report={report} />
          <div style={{ padding: '0 24px', flex: 1 }}>

            <Section title="Executive Summary">
              <TextBlock text={report.summary} last minH={110} />
            </Section>

            {report.keyFindings?.length > 0 && (
              <Section title="Key Findings">
                <Bullets items={report.keyFindings} last />
              </Section>
            )}

            <Section title="Recommended Action">
              <Row label="Action Required" value={report.recommendedAction} />
              <Row label="Justification"   value={report.justification} tall />
              <Row label="Est. Timeline"   value={report.timeline} last />
            </Section>

            <Section title="Cost Estimate Overview">
              <Row2 left={{ label: 'Materials', value: fmt$(report.costMaterials) }} right={{ label: 'Labor', value: fmt$(report.costLabor) }} />
              <Row2 left={{ label: 'Disposal / Haul-Off', value: fmt$(report.costDisposal) }} right={{ label: 'Miscellaneous', value: fmt$(report.costMisc) }} />
              <Row2 left={{ label: 'Estimated Range (Low)', value: fmt$(report.minCost) }} right={{ label: 'Estimated Range (High)', value: fmt$(report.maxCost) }} />
              <div style={{ display: 'flex', background: '#111', borderTop: '2px solid #000' }}>
                <div style={{ flex: 1, padding: '9px 10px', fontSize: 12, fontWeight: 800, color: '#fff', borderRight: '1px solid #444' }}>Total Estimated Cost</div>
                <div style={{ flex: 1, padding: '9px 10px', fontSize: 14, fontWeight: 800, color: '#fff', textAlign: 'right' }}>{totalCost > 0 ? fmt$(totalCost) : '—'}</div>
              </div>
            </Section>
            <p style={{ fontSize: 10, color: '#888', fontStyle: 'italic', padding: '0 4px', marginTop: -8 }}>
              * Estimates based on AI visual analysis and regional averages. Final pricing subject to contractor assessment and site conditions.
            </p>

          </div>
          <PageFooter num={2} {...fp} />
        </div>

        {/* ══ PAGE 3: Detailed Inspection Findings ════════════════════════════ */}
        <div data-pdf-page style={PAGE_STYLE}>
          <PageHeader companyLogo={companyLogo} num={3} report={report} />
          <div style={{ padding: '0 24px', flex: 1 }}>

            <Section title="Section 2 — Detailed Inspection Findings">
              <Sub title="2.1  Roof Surface" />
              <Row2 left={{ label: 'Damage Type(s) Detected', value: report.surface?.damageTypes }} right={{ label: 'Hail Impact Count', value: report.surface?.hailImpactCount }} />
              <Row2 left={{ label: 'Granule Loss', value: report.surface?.granuleLoss }} right={{ label: 'Shingle Condition', value: report.surface?.shingleCondition }} />
              <Row label="Wind Damage Indicators" value={report.surface?.windIndicators} />
              <Row label="Notes" value={report.surface?.notes} tall />

              <Sub title="2.2  Flashing (Chimneys, Vents, Valleys)" />
              <Row2 left={{ label: 'Condition', value: report.flashing?.condition }} right={{ label: 'Type of Damage', value: report.flashing?.damageType }} />
              <Row label="Notes" value={report.flashing?.notes} tall />

              <Sub title="2.3  Gutters & Downspouts" />
              <Row2 left={{ label: 'Condition', value: report.gutters?.condition }} right={{ label: 'Evidence of Impact', value: report.gutters?.evidenceOfImpact }} />
              <Row2 left={{ label: 'Drainage Functionality', value: report.gutters?.drainage }} right={{ label: 'Notes', value: report.gutters?.notes }} />

              <Sub title="2.4  Roof Penetrations (Vents, Skylights, etc.)" />
              <Row2 left={{ label: 'Condition', value: report.penetrations?.condition }} right={{ label: 'Seal Integrity', value: report.penetrations?.sealIntegrity }} />
              <Row label="Notes" value={report.penetrations?.notes} tall />

              <Sub title="2.5  Interior / Attic" />
              <Row2 left={{ label: 'Signs of Leaks', value: report.attic?.signsOfLeaks }} right={{ label: 'Water Stains', value: report.attic?.waterStains }} />
              <Row2 left={{ label: 'Mold / Moisture Indicators', value: report.attic?.moldMoisture }} right={{ label: 'Notes', value: report.attic?.notes }} last />
            </Section>

          </div>
          <PageFooter num={3} {...fp} />
        </div>

        {/* ══ PAGE 4: Identified Issues ════════════════════════════════════════ */}
        <div data-pdf-page style={PAGE_STYLE}>
          <PageHeader companyLogo={companyLogo} num={4} report={report} />
          <div style={{ padding: '0 24px', flex: 1 }}>

            <Section title={`Section 3 — Identified Issues  (${issues.length} total)`}>
              {issues.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#555' }}>
                  No issues identified. The roof appears to be in good condition based on submitted photos.
                </div>
              ) : (
                <>
                  {/* Summary counts */}
                  <div style={{ display: 'flex', gap: 24, padding: '5px 10px', background: '#ebebeb', borderBottom: '1px solid #bbb', fontSize: 11 }}>
                    {['Critical','High','Medium','Low'].map(sev => {
                      const c = issues.filter(i => i.severity === sev).length;
                      return c ? <span key={sev}><strong>{c}</strong> {sev}</span> : null;
                    })}
                  </div>
                  {/* Column headers */}
                  <div style={{ display: 'flex', background: '#ddd', borderBottom: '2px solid #000' }}>
                    <div style={{ width: 28, padding: '5px 8px', fontSize: 10, fontWeight: 700, borderRight: '1px solid #bbb', textAlign: 'center', flexShrink: 0 }}>#</div>
                    <div style={{ flex: 2, padding: '5px 8px', fontSize: 10, fontWeight: 700, borderRight: '1px solid #bbb' }}>Issue Type / Location</div>
                    <div style={{ width: 72, padding: '5px 8px', fontSize: 10, fontWeight: 700, borderRight: '1px solid #bbb', textAlign: 'center', flexShrink: 0 }}>Severity</div>
                    <div style={{ flex: 3, padding: '5px 8px', fontSize: 10, fontWeight: 700 }}>Description & Recommended Action</div>
                  </div>
                  {/* Issue rows */}
                  {issues.map((issue, idx) => (
                    <div key={idx} style={{ display: 'flex', borderBottom: idx < issues.length - 1 ? '1px solid #ccc' : 'none', alignItems: 'stretch' }}>
                      <div style={{ width: 28, padding: '6px 8px', fontSize: 11, borderRight: '1px solid #ccc', textAlign: 'center', flexShrink: 0, background: '#f7f7f7', fontWeight: 700 }}>{idx + 1}</div>
                      <div style={{ flex: 2, padding: '6px 8px', fontSize: 11, borderRight: '1px solid #ccc' }}>
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>{issue.type}</div>
                        <div style={{ color: '#666', fontSize: 10 }}>{issue.location || '—'}</div>
                      </div>
                      <div style={{ width: 72, padding: '6px 8px', fontSize: 11, borderRight: '1px solid #ccc', textAlign: 'center', flexShrink: 0, fontWeight: 700, background: '#efefef' }}>
                        {issue.severity}
                      </div>
                      <div style={{ flex: 3, padding: '6px 8px', fontSize: 11 }}>
                        <div style={{ lineHeight: 1.5, marginBottom: 4 }}>{issue.description || '—'}</div>
                        {issue.recommendation && (
                          <div style={{ fontSize: 10, color: '#444', fontStyle: 'italic' }}>→ {issue.recommendation}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </Section>

          </div>
          <PageFooter num={4} {...fp} />
        </div>

        {/* ══ PAGE 5: Photo Documentation + Roof Diagram ══════════════════════ */}
        <div data-pdf-page style={PAGE_STYLE}>
          <PageHeader companyLogo={companyLogo} num={5} report={report} />
          <div style={{ padding: '0 24px', flex: 1 }}>

            {report.imagePreviews?.length > 0 ? (
              <Section title={`Section 4 — Photo Documentation  (${report.imagePreviews.length} image${report.imagePreviews.length !== 1 ? 's' : ''})`}>
                <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(176px, 1fr))', gap: 12 }}>
                  {report.imagePreviews.map((item, i) => {
                    const src   = typeof item === 'string' ? item : item.src;
                    const label = typeof item === 'object' ? item.name : `Photo ${i + 1}`;
                    const isVid = typeof item === 'object' && item.isVideoFrame;
                    return (
                      <figure key={i} style={{ margin: 0, border: '1px solid #bbb' }}>
                        <div style={{ position: 'relative', overflow: 'hidden' }}>
                          <img src={src} alt={`Fig. ${i + 1}`} style={{ width: '100%', height: 138, objectFit: 'cover', display: 'block' }} />
                          {isVid && (
                            <span style={{ position: 'absolute', top: 4, right: 4, background: '#000', color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 5px' }}>VIDEO</span>
                          )}
                        </div>
                        <figcaption style={{ fontSize: 10, color: '#555', padding: '4px 6px', textAlign: 'center', borderTop: '1px solid #ccc', fontStyle: 'italic', background: '#f7f7f7' }}>
                          Fig. {i + 1} — {isVid ? `Frame: ${label}` : label}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </Section>
            ) : (
              <Section title="Section 4 — Photo Documentation">
                <div style={{ padding: '16px', fontSize: 11, color: '#888', fontStyle: 'italic' }}>No images were submitted with this inspection.</div>
              </Section>
            )}

            <Section title="Section 5 — Roof Damage Map">
              <RoofDiagram issues={issues} />
              <div style={{ padding: '5px 12px 8px', fontSize: 10, color: '#888', fontStyle: 'italic', borderTop: '1px solid #ccc' }}>
                Sections shaded based on issue locations identified by AI image analysis. Darker shading indicates higher severity.
              </div>
            </Section>

          </div>
          <PageFooter num={5} {...fp} />
        </div>

        {/* ══ PAGE 6: Insurance + Additional Recs + Inspector Cert ════════════ */}
        <div data-pdf-page style={PAGE_STYLE}>
          <PageHeader companyLogo={companyLogo} num={6} report={report} />
          <div style={{ padding: '0 24px', flex: 1 }}>

            <Section title="Section 6 — Insurance Supporting Information">
              <Row2 left={{ label: 'Storm Type', value: report.stormType }} right={{ label: 'Estimated Storm Date', value: report.estimatedStormDate }} />
              <Row label="Damage Consistent with Storm Event" value={report.damageConsistency} />
              <Row label="Supporting Notes for Claim" value={report.insuranceNotes} tall last />
            </Section>

            {report.additionalRecommendations?.length > 0 && (
              <Section title="Section 7 — Additional Recommendations">
                <Bullets items={report.additionalRecommendations} last />
              </Section>
            )}

            <Section title="Section 8 — Inspector Certification">
              <Row2 left={{ label: 'Inspector Name', value: report.inspectorName }} right={{ label: 'Company Name', value: report.companyName }} />
              <Row2 left={{ label: 'License Number', value: report.licenseNumber || 'N/A' }} right={{ label: 'Date of Report', value: report.inspectionDate }} last />
            </Section>

          </div>
          <PageFooter num={6} {...fp} />
        </div>

        {/* ══ PAGE 7: Disclaimers & Sign-Off ══════════════════════════════════ */}
        <div data-pdf-page style={PAGE_STYLE}>
          <PageHeader companyLogo={companyLogo} num={7} report={report} />
          <div style={{ padding: '0 24px', flex: 1 }}>

            <Section title="Section 9 — Disclaimers & Limitations">
              <div style={{ padding: '6px 12px' }}>
                {[
                  ['Scope', 'Based on photographic evidence only; no destructive testing or physical on-site inspection was performed.'],
                  ['Hidden Damage', 'Observable conditions only; concealed or subsurface damage not visible in photos may exist and is not covered.'],
                  ['No Warranty', 'Does not constitute a guarantee, warranty, or prediction of future performance for any roof component.'],
                  ['AI-Assisted Analysis', 'AI analysis is intended to assist licensed professionals only and does not replace a certified on-site roofing inspection.'],
                  ['Cost Estimates', 'All cost figures are approximations based on regional averages; final pricing is subject to contractor bids and site conditions.'],
                  ['Insurance Claims', 'Does not guarantee insurance claim approval; all coverage decisions rest solely with the insurance carrier.'],
                  ['Limitation of Liability', 'Liability is limited to the cost of the inspection service; no further damages are assumed.'],
                  ['Confidentiality', 'Prepared exclusively for the named client and property; redistribution without written consent is prohibited.'],
                ].map(([title, text], i, arr) => (
                  <div key={i} style={{ borderBottom: i < arr.length - 1 ? '1px solid #e0e0e0' : 'none', padding: '5px 0' }}>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{title}. </span>
                    <span style={{ fontSize: 11, lineHeight: 1.5, color: '#222' }}>{text}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Section 10 — Inspector &amp; Client Sign-Off">
              <Sub title="Inspector Signature" />
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #ccc' }}>
                <div style={{ height: 46, border: '1px solid #ccc', background: '#fafafa', borderBottom: '2px solid #000', display: 'flex', alignItems: 'flex-end', paddingBottom: 4, paddingLeft: 10 }}>
                  <span style={{ fontSize: 9, color: '#bbb', fontStyle: 'italic' }}>Authorized inspector signature</span>
                </div>
              </div>
              <Sub title="Homeowner / Client Acknowledgment" />
              <div style={{ padding: '10px 12px' }}>
                <SignaturePad />
              </div>
            </Section>

          </div>
          <div style={{ background: '#000', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ color: '#aaa', fontSize: 10 }}>{report.companyName || 'AI Roof Inspector'} · {report.reportId || ''}</span>
            <span style={{ color: '#aaa', fontSize: 10 }}>AI-Assisted Roof Inspection · {report.inspectionDate}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
