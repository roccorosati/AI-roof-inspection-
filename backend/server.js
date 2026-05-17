import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { requireAuth, getCurrentUser, getUserId } from './lib/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const USERS_FILE = path.join(__dirname, 'users.json');
const REPORTS_FILE = path.join(__dirname, 'reports.json');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [`http://localhost:${PORT}`, 'http://localhost:5173'];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) cb(null, true);
    else cb(new Error('CORS not allowed'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.static(PUBLIC_DIR));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many analysis requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many messages sent. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Storage helpers ───────────────────────────────────────────────────────────
async function readUsers() {
  try {
    return JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
  } catch {
    return { users: [] };
  }
}

async function writeUsers(data) {
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
}

async function readReports() {
  try {
    return JSON.parse(await fs.readFile(REPORTS_FILE, 'utf-8'));
  } catch {
    return { reports: [] };
  }
}

async function writeReports(data) {
  await fs.writeFile(REPORTS_FILE, JSON.stringify(data, null, 2));
}

function sanitizeInput(str) {
  return String(str || '').replace(/[<>]/g, '').trim().slice(0, 200);
}

// ── User endpoints ────────────────────────────────────────────────────────────

app.get('/api/me', requireAuth, (req, res) => {
  const u = req.internalUser;
  res.json({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    createdAt: u.createdAt,
    logo: u.logo || null,
    companyName: u.companyName || '',
  });
});

app.patch('/api/account', requireAuth, async (req, res) => {
  try {
    const { companyName } = req.body;
    const db = await readUsers();
    const idx = db.users.findIndex(u => u.id === getUserId(req));
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    if (companyName !== undefined) db.users[idx].companyName = sanitizeInput(companyName);
    await writeUsers(db);
    const u = db.users[idx];
    res.json({ id: u.id, fullName: u.fullName, email: u.email, createdAt: u.createdAt, logo: u.logo || null, companyName: u.companyName || '' });
  } catch (err) {
    console.error('Account update error:', err);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// ── Logo endpoints ────────────────────────────────────────────────────────────

const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

app.post('/api/account/logo', requireAuth, logoUpload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No logo provided' });
    const logoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const db = await readUsers();
    const idx = db.users.findIndex(u => u.id === getUserId(req));
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    db.users[idx].logo = logoBase64;
    await writeUsers(db);
    res.json({ success: true, logo: logoBase64 });
  } catch (err) {
    console.error('Logo upload error:', err);
    res.status(500).json({ error: 'Failed to save logo' });
  }
});

app.delete('/api/account/logo', requireAuth, async (req, res) => {
  try {
    const db = await readUsers();
    const idx = db.users.findIndex(u => u.id === getUserId(req));
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    delete db.users[idx].logo;
    await writeUsers(db);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove logo' });
  }
});

// ── Reports endpoints ─────────────────────────────────────────────────────────

app.get('/api/reports', requireAuth, async (req, res) => {
  try {
    const db = await readReports();
    const userReports = db.reports
      .filter(r => r.userId === getUserId(req))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ reports: userReports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load reports' });
  }
});

app.post('/api/reports', requireAuth, async (req, res) => {
  try {
    const { propertyInfo, report, imagePreviews } = req.body;
    if (!report) return res.status(400).json({ error: 'Report data is required' });
    const db = await readReports();
    const entry = {
      id: crypto.randomUUID(),
      userId: getUserId(req),
      createdAt: new Date().toISOString(),
      propertyInfo: propertyInfo || {},
      report,
      imagePreviews: imagePreviews || [],
    };
    db.reports.push(entry);
    await writeReports(db);
    res.status(201).json({ id: entry.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save report' });
  }
});

app.delete('/api/reports/:id', requireAuth, async (req, res) => {
  try {
    const db = await readReports();
    const idx = db.reports.findIndex(r => r.id === req.params.id && r.userId === getUserId(req));
    if (idx === -1) return res.status(404).json({ error: 'Report not found' });
    db.reports.splice(idx, 1);
    await writeReports(db);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// ── Analysis endpoint ─────────────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  },
});

const SYSTEM_PROMPT = `You are a licensed professional roofing inspector generating a formal inspection report for insurance claims and property assessments. Analyze the provided roof images thoroughly and return a single comprehensive JSON object.

Return ONLY valid JSON with NO other text, preamble, or explanation outside the JSON object.

Required JSON structure:
{
  "overallCondition": "Excellent|Good|Fair|Poor",
  "overallScore": <integer 1-10>,
  "claimRecommendation": "Yes|No|Further Review Needed",
  "summary": "<professional paragraph summarizing overall condition>",
  "keyFindings": ["<concise finding>", "<concise finding>"],
  "urgency": "Low|Medium|High",

  "hailDamage": "None|Minor|Moderate|Severe",
  "windDamage": "None|Minor|Moderate|Severe",
  "otherDamage": "<description or None>",

  "minCost": <integer USD>,
  "maxCost": <integer USD>,

  "surface": {
    "damageTypes": "<description of damage types observed>",
    "hailImpactCount": "<estimated count per square or N/A>",
    "granuleLoss": "None|Minor|Moderate|Severe",
    "shingleCondition": "<intact|cracked|missing|lifted — describe>",
    "windIndicators": "<description or None>",
    "notes": "<additional notes>"
  },

  "flashing": {
    "condition": "Good|Damaged|Not Visible",
    "damageType": "<dents|cracks|sealant failure|etc. or None>",
    "notes": "<notes>"
  },

  "gutters": {
    "condition": "Good|Damaged|Not Visible",
    "evidenceOfImpact": "Yes|No|Not Visible",
    "drainage": "Functional|Impaired|Not Visible",
    "notes": "<notes>"
  },

  "penetrations": {
    "condition": "Good|Damaged|Not Visible",
    "sealIntegrity": "Intact|Compromised|Not Visible",
    "notes": "<notes>"
  },

  "attic": {
    "signsOfLeaks": "Yes|No|Not Inspected",
    "waterStains": "Yes|No|Not Inspected",
    "moldMoisture": "Yes|No|Not Inspected",
    "notes": "Interior/attic assessment based on visible exterior indicators only."
  },

  "recommendedAction": "No Action Needed|Repair|Partial Replacement|Full Replacement",
  "justification": "<clear professional explanation based on findings>",
  "additionalRecommendations": ["<recommendation>"],
  "timeline": "<Immediate — within 7 days|Within 30 days|Within 90 days|Next season>",

  "stormType": "Hail|Wind|Hail and Wind|Water|Other|Unknown",
  "estimatedStormDate": "<approximate date or Unknown>",
  "damageConsistency": "Yes|No|Uncertain",
  "insuranceNotes": "<professional supporting notes for insurance claim>",

  "costMaterials": <integer USD>,
  "costLabor": <integer USD>,
  "costDisposal": <integer USD>,
  "costMisc": <integer USD>,

  "issues": [
    {
      "type": "<specific issue type>",
      "severity": "Low|Medium|High|Critical",
      "location": "<specific location on roof>",
      "description": "<detailed professional description>",
      "recommendation": "<specific repair action>"
    }
  ]
}

Guidelines:
- overallScore: 10 = perfect condition, 1 = catastrophic damage
- Cost estimates in USD based on industry averages; use 0 if truly unable to estimate
- keyFindings: 3–6 concise bullet-point statements about major observations
- Use "Not Visible" for components not visible in the provided images
- Be specific, professional, and objective — this report will be used for insurance claims`;

function parseAnalysis(text) {
  const fenceStripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    const jsonMatch = fenceStripped.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    // fall through to defaults
  }
  return {
    issues: [], overallScore: 5, overallCondition: 'Fair',
    claimRecommendation: 'Further Review Needed', summary: text,
    keyFindings: [], urgency: 'Medium', hailDamage: 'Unknown',
    windDamage: 'Unknown', otherDamage: 'None', minCost: 0, maxCost: 0,
    surface: { damageTypes: 'Unable to parse', granuleLoss: 'Unknown', shingleCondition: 'Unknown', windIndicators: 'Unknown', hailImpactCount: 'N/A', notes: '' },
    flashing: { condition: 'Not Visible', damageType: 'None', notes: '' },
    gutters: { condition: 'Not Visible', evidenceOfImpact: 'Not Visible', drainage: 'Not Visible', notes: '' },
    penetrations: { condition: 'Not Visible', sealIntegrity: 'Not Visible', notes: '' },
    attic: { signsOfLeaks: 'Not Inspected', waterStains: 'Not Inspected', moldMoisture: 'Not Inspected', notes: '' },
    recommendedAction: 'Further Review Needed', justification: 'Manual review required.',
    additionalRecommendations: [], timeline: 'Within 30 days',
    stormType: 'Unknown', estimatedStormDate: 'Unknown', damageConsistency: 'Uncertain',
    insuranceNotes: '', costMaterials: 0, costLabor: 0, costDisposal: 0, costMisc: 0,
  };
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/api/analyze', requireAuth, analyzeLimiter, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: 'No images provided' });

    const roofType = sanitizeInput(req.body.roofType);
    const roofAge = sanitizeInput(req.body.roofAge);
    const numberOfStories = sanitizeInput(req.body.numberOfStories);

    const imageContent = req.files.map((file) => ({
      type: 'image',
      source: { type: 'base64', media_type: file.mimetype, data: file.buffer.toString('base64') },
    }));

    let contextText = `Please analyze ${req.files.length === 1 ? 'this roof image' : `these ${req.files.length} roof images`} and provide a comprehensive formal inspection report in the specified JSON format.`;
    if (roofType || roofAge || numberOfStories) {
      contextText += '\n\nProperty context provided by inspector:';
      if (roofType) contextText += `\n- Roof type: ${roofType}`;
      if (roofAge) contextText += `\n- Estimated roof age: ${roofAge}`;
      if (numberOfStories) contextText += `\n- Number of stories: ${numberOfStories}`;
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: [...imageContent, { type: 'text', text: contextText }] }],
    });

    const parsed = parseAnalysis(message.content[0].text);
    res.json({
      success: true,
      report: {
        ...parsed,
        imageCount: req.files.length,
        inspectionDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      },
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze images' });
  }
});

// ── Contact endpoint ──────────────────────────────────────────────────────────

app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email address.' });

    const safeName    = sanitizeInput(name);
    const safeEmail   = sanitizeInput(email);
    const safeSubject = sanitizeInput(subject || 'General question');
    const safeMessage = String(message || '').replace(/[<>]/g, '').trim().slice(0, 2000);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Contact form: SMTP_USER/SMTP_PASS not set — email not sent.');
      return res.json({ success: true });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      family: 4,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `"RoofWise" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_RECIPIENT || process.env.SMTP_USER,
      replyTo: safeEmail,
      subject: `[Contact Form] ${safeSubject}`,
      text: `Name: ${safeName}\nEmail: ${safeEmail}\nSubject: ${safeSubject}\n\n${safeMessage}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#0f172a">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#64748b;width:80px">Name</td><td style="padding:8px 0;font-weight:600">${safeName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Subject</td><td style="padding:8px 0">${safeSubject}</td></tr>
          </table>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:20px;white-space:pre-wrap">${safeMessage}</div>
        </div>`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

// ── Health & SPA fallback ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('*', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
