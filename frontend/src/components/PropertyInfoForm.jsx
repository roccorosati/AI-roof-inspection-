import { useState } from 'react';

const ROOF_TYPES = [
  'Asphalt Shingle',
  'Metal',
  'Tile (Clay / Concrete)',
  'Flat / TPO',
  'Wood Shake',
  'Modified Bitumen',
  'EPDM (Rubber)',
  'Other',
];

function generateReportId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RI-${ts}-${rand}`;
}

const FIELD_STYLE = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  fontSize: 14,
  color: '#1e293b',
  background: 'white',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
};

const LABEL_STYLE = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  marginBottom: 5,
};

const ERROR_STYLE = {
  fontSize: 11,
  color: '#dc2626',
  marginTop: 3,
};

function Field({ label, required, error, children }) {
  return (
    <div>
      <label style={LABEL_STYLE}>
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <p style={ERROR_STYLE}>{error}</p>}
    </div>
  );
}

function GroupHeader({ number, title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      marginBottom: 16, marginTop: 4,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: '#1d4ed8', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>
        {number}
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </h3>
      <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
    </div>
  );
}

export default function PropertyInfoForm({ onSubmit }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    reportId: generateReportId(),
    inspectionDate: today,
    inspectorName: '',
    companyName: '',
    licenseNumber: '',
    propertyAddress: '',
    city: '',
    state: '',
    zip: '',
    weatherConditions: '',
    roofType: 'Asphalt Shingle',
    estimatedRoofAge: '',
    numberOfStories: '',
  });
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  }

  function validate() {
    const required = ['inspectorName', 'companyName', 'propertyAddress', 'city', 'state', 'zip'];
    const errs = {};
    required.forEach((k) => {
      if (!form[k].trim()) errs[k] = 'This field is required';
    });
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit(form);
  }

  const inputStyle = (field) => ({
    ...FIELD_STYLE,
    borderColor: errors[field] ? '#dc2626' : '#cbd5e1',
  });

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Page title */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
          New Roof Inspection
        </h2>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 6 }}>
          Complete the property details below before uploading roof photos.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '24px 28px' }}>

            {/* Report Meta */}
            <div style={{ marginBottom: 28 }}>
              <GroupHeader number="A" title="Report Information" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Report ID">
                  <input
                    value={form.reportId}
                    readOnly
                    style={{ ...FIELD_STYLE, background: '#f8fafc', color: '#64748b', cursor: 'default' }}
                  />
                </Field>
                <Field label="Inspection Date" required>
                  <input
                    type="date"
                    value={form.inspectionDate}
                    onChange={(e) => set('inspectionDate', e.target.value)}
                    style={inputStyle('inspectionDate')}
                  />
                </Field>
              </div>
            </div>

            {/* Inspector Info */}
            <div style={{ marginBottom: 28 }}>
              <GroupHeader number="B" title="Inspector Information" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Inspector Name" required error={errors.inspectorName}>
                  <input
                    value={form.inspectorName}
                    onChange={(e) => set('inspectorName', e.target.value)}
                    placeholder="Full name"
                    style={inputStyle('inspectorName')}
                  />
                </Field>
                <Field label="Company Name" required error={errors.companyName}>
                  <input
                    value={form.companyName}
                    onChange={(e) => set('companyName', e.target.value)}
                    placeholder="Roofing company name"
                    style={inputStyle('companyName')}
                  />
                </Field>
                <Field label="License Number">
                  <input
                    value={form.licenseNumber}
                    onChange={(e) => set('licenseNumber', e.target.value)}
                    placeholder="State license # (optional)"
                    style={inputStyle('licenseNumber')}
                  />
                </Field>
                <Field label="Weather Conditions">
                  <input
                    value={form.weatherConditions}
                    onChange={(e) => set('weatherConditions', e.target.value)}
                    placeholder="e.g., Clear, 72°F, light wind"
                    style={inputStyle('weatherConditions')}
                  />
                </Field>
              </div>
            </div>

            {/* Property Info */}
            <div style={{ marginBottom: 28 }}>
              <GroupHeader number="C" title="Property Information" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                <Field label="Property Address" required error={errors.propertyAddress}>
                  <input
                    value={form.propertyAddress}
                    onChange={(e) => set('propertyAddress', e.target.value)}
                    placeholder="Street address"
                    style={inputStyle('propertyAddress')}
                  />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                <Field label="City" required error={errors.city}>
                  <input
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="City"
                    style={inputStyle('city')}
                  />
                </Field>
                <Field label="State" required error={errors.state}>
                  <input
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
                    placeholder="TX"
                    maxLength={2}
                    style={{ ...inputStyle('state'), textTransform: 'uppercase' }}
                  />
                </Field>
                <Field label="ZIP Code" required error={errors.zip}>
                  <input
                    value={form.zip}
                    onChange={(e) => set('zip', e.target.value)}
                    placeholder="78701"
                    maxLength={10}
                    style={inputStyle('zip')}
                  />
                </Field>
              </div>
            </div>

            {/* Roof Details */}
            <div style={{ marginBottom: 8 }}>
              <GroupHeader number="D" title="Roof Details" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <Field label="Roof Type">
                  <select
                    value={form.roofType}
                    onChange={(e) => set('roofType', e.target.value)}
                    style={FIELD_STYLE}
                  >
                    {ROOF_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Estimated Roof Age">
                  <input
                    value={form.estimatedRoofAge}
                    onChange={(e) => set('estimatedRoofAge', e.target.value)}
                    placeholder="e.g., 12 years"
                    style={FIELD_STYLE}
                  />
                </Field>
                <Field label="Number of Stories">
                  <select
                    value={form.numberOfStories}
                    onChange={(e) => set('numberOfStories', e.target.value)}
                    style={FIELD_STYLE}
                  >
                    <option value="">Select</option>
                    <option value="1">1 Story</option>
                    <option value="2">2 Stories</option>
                    <option value="3">3 Stories</option>
                    <option value="4+">4+ Stories</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            padding: '18px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              Fields marked <span style={{ color: '#dc2626' }}>*</span> are required
            </p>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                color: 'white',
                border: 'none',
                padding: '11px 28px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
                letterSpacing: '0.2px',
              }}
            >
              Continue to Upload Photos →
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
