import { createClerkClient, verifyToken } from '@clerk/backend';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_FILE = path.join(__dirname, '../users.json');

// Lazy-init so env vars are read after dotenv runs in server.js
let _clerk;
function getClerk() {
  if (!_clerk) _clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  });
  return _clerk;
}

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

// Creates or links an internal user record for the given Clerk user ID.
// On first login, matches existing users by email so legacy data (logo,
// companyName) is preserved automatically.
async function syncClerkUser(clerkUserId) {
  const db = await readUsers();

  // Already linked
  let idx = db.users.findIndex(u => u.provider_user_id === clerkUserId);
  if (idx !== -1) return db.users[idx];

  // Fetch profile from Clerk
  const cu = await getClerk().users.getUser(clerkUserId);
  const email = cu.emailAddresses[0]?.emailAddress?.toLowerCase() || '';
  const fullName = [cu.firstName, cu.lastName].filter(Boolean).join(' ') || email;

  // Migration: link an existing user that shares the same email
  idx = db.users.findIndex(u => u.email === email);
  if (idx !== -1) {
    db.users[idx].provider_user_id = clerkUserId;
    db.users[idx].auth_provider = 'clerk';
    delete db.users[idx].passwordHash;
    delete db.users[idx].passwordSalt;
    delete db.users[idx].username;
    await writeUsers(db);
    return db.users[idx];
  }

  // Brand-new user
  const user = {
    id: crypto.randomUUID(),
    email,
    fullName,
    auth_provider: 'clerk',
    provider_user_id: clerkUserId,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  await writeUsers(db);
  return user;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getCurrentUser(req) {
  const raw = req.headers.authorization;
  if (!raw?.startsWith('Bearer ')) return null;
  try {
    const payload = await verifyToken(raw.slice(7), {
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    });
    return syncClerkUser(payload.sub);
  } catch (err) {
    console.error('[auth] Token verification failed:', err.message);
    return null;
  }
}

export async function requireAuth(req, res, next) {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  req.internalUser = user;
  next();
}

export function getUserId(req) {
  return req.internalUser.id;
}
