import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const USERS_FILE = path.join(__dirname, 'users.json');
const REPORTS_FILE = path.join(__dirname, 'reports.json');

const app = express();
const PORT = process.env.PORT || 3001;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // managed separately if needed
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [`http://localhost:${PORT}`, 'http://localhost:5173'];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) cb(null, true);
    else cb(new Error('CORS not allowed'));
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(PUBLIC_DIR));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many analysis requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── In-memory sessions ────────────────────────────────────────────────────────
const sessions = new Map(); // token -> { userId, expiresAt }
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function getSession(token) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

function destroySession(token) {
  sessions.delete(token);
}

// ── Cookie helpers ────────────────────────────────────────────────────────────
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: IS_PROD,
  maxAge: SESSION_TTL_MS,
};

function setAuthCookies(res, token) {
  res.cookie('authToken', token, COOKIE_OPTS);
  // loggedIn is readable by JS so React can check auth state for routing
  res.cookie('loggedIn', '1', { ...COOKIE_OPTS, httpOnly: false });
}

function clearAuthCookies(res) {
  res.clearCookie('authToken');
  res.clearCookie('loggedIn');
}

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const session = getSession(req.cookies.authToken);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  req.userId = session.userId;
  next();
}

// ── User storage ──────────────────────────────────────────────────────────────
async function readUsers() {
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { users: [] };
  }
}

async function writeUsers(data) {
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
}

// ── Report storage ────────────────────────────────────────────────────────────
async function readReports() {
  try {
    const raw = await fs.readFile(REPORTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { reports: [] };
  }
}

async function writeReports(data) {
  await fs.writeFile(REPORTS_FILE, JSON.stringify(data, null, 2));
}

// ── Password hashing ──────────────────────────────────────────────────────────
function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, hash) => {
      if (err) reject(err);
      else resolve(hash.toString('hex'));
    });
  });
}

function sanitizeInput(str) {
  return String(str || '').replace(/[<>]/g, '').trim().slice(0, 200);
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

app.post('/api/signup', authLimiter, async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;
    if (!fullName || !email || !username || !password)
      return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email address' });
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username))
      return res.status(400).json({ error: 'Username must be 3–30 characters (letters, numbers, underscores)' });

    const db = await readUsers();
    const emailLower = email.trim().toLowerCase();
    const usernameLower = username.trim().toLowerCase();

    if (db.users.find(u => u.email === emailLower))
      return res.status(409).json({ error: 'An account with that email already exists' });
    if (db.users.find(u => u.username.toLowerCase() === usernameLower))
      return res.status(409).json({ error: 'That username is already taken' });

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = await hashPassword(password, salt);

    const user = {
      id: crypto.randomUUID(),
      fullName: fullName.trim(),
      email: emailLower,
      username: username.trim(),
      passwordHash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
    };

    db.users.push(user);
    await writeUsers(db);

    const token = createSession(user.id);
    setAuthCookies(res, token);

    res.status(201).json({ id: user.id, fullName: user.fullName, email: user.email, username: user.username });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required' });

    const db = await readUsers();
    const query = username.trim().toLowerCase();
    const user = db.users.find(u => u.email === query || u.username.toLowerCase() === query);

    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' });

    const hash = await hashPassword(password, user.passwordSalt);
    const valid = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.passwordHash));
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = createSession(user.id);
    setAuthCookies(res, token);

    res.json({ id: user.id, fullName: user.fullName, email: user.email, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  destroySession(req.cookies.authToken);
  clearAuthCookies(res);
  res.json({ success: true });
});

app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const db = await readUsers();
    const user = db.users.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, fullName: user.fullName, email: user.email, username: user.username, createdAt: user.createdAt, logo: user.logo || null, companyName: user.companyName || '' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load user' });
  }
});

// ── Account update endpoint ───────────────────────────────────────────────────

app.patch('/api/account', requireAuth, async (req, res) => {
  try {
    const { companyName } = req.body;
    const db  = await readUsers();
    const idx = db.users.findIndex(u => u.id === req.userId);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    if (companyName !== undefined) db.users[idx].companyName = sanitizeInput(companyName);
    await writeUsers(db);
    const u = db.users[idx];
    res.json({ id: u.id, fullName: u.fullName, email: u.email, username: u.username, createdAt: u.createdAt, logo: u.logo || null, companyName: u.companyName || '' });
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
    const idx = db.users.findIndex(u => u.id === req.userId);
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
    const idx = db.users.findIndex(u => u.id === req.userId);
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
      .filter(r => r.userId === req.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ reports: userReports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load reports' });
  }
});

app.post('/api/reports', requireAuth, async (req, res) => {
  try {
    const { propertyInfo, report } = req.body;
    if (!report) return res.status(400).json({ error: 'Report data is required' });

    const db = await readReports();
    const entry = {
      id: crypto.randomUUID(),
      userId: req.userId,
      createdAt: new Date().toISOString(),
      propertyInfo: propertyInfo || {},
      report,
    };
    db.reports.push(entry);
    await writeReports(db);
    res.status(201).json({ id: entry.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// ── Analysis endpoint (protected) ─────────────────────────────────────────────

const storage = multer.memoryStorage();
const upload = multer({
  storage,
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

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many messages sent. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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

    const recipient = process.env.CONTACT_RECIPIENT || process.env.SMTP_USER;

    await transporter.sendMail({
      from: `"AI Roof Inspector" <${process.env.SMTP_USER}>`,
      to: recipient,
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
