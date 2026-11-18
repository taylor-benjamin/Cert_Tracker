// CertTracker API: runs on Cloudflare Workers, stores data in D1.
// Static files (index.html, js/, style.css) are served by the assets binding;
// only /api/* requests reach this code.

const SESSION_COOKIE = 'ct_session';
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100000; // Workers' maximum for PBKDF2
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_ITEM_BYTES = 256 * 1024;
const MAX_PROFILE_BYTES = 1.5 * 1024 * 1024; // room for an avatar photo data URL
const MAX_SETTINGS_BYTES = 1.5 * 1024 * 1024;
const MIN_PASSWORD = 8;

// [max attempts, window in seconds]
const LIMITS = {
  loginEmail: [10, 15 * 60], // failed logins per account
  loginIp: [30, 15 * 60], // failed logins per IP
  signupIp: [10, 60 * 60] // accounts created per IP
};

// Client collection name -> table + indexed columns pulled from the JSON object
const COLLECTIONS = {
  goals: {
    table: 'goals',
    columns: { cert_id: '$.certId', status: '$.status', target_date: '$.targetDate' }
  },
  sessions: {
    table: 'study_sessions',
    columns: { goal_id: '$.goalId', date: '$.date', duration_minutes: '$.durationMinutes' }
  },
  quizHistory: {
    table: 'quiz_attempts',
    columns: { cert_id: '$.certId', score: '$.score', date: '$.date' }
  }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }
    try {
      return await route(request, env, url);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: 'Server error' }, 500);
    }
  }
};

async function route(request, env, url) {
  const { pathname } = url;
  const method = request.method;

  if (method === 'POST') requireJson(request);

  if (pathname === '/api/auth/signup' && method === 'POST') return signup(request, env);
  if (pathname === '/api/auth/login' && method === 'POST') return login(request, env);
  if (pathname === '/api/auth/logout' && method === 'POST') return logout(request, env);
  if (pathname === '/api/auth/password' && method === 'POST') return changePassword(request, env);
  if (pathname === '/api/state' && method === 'GET') return getState(request, env);
  if (pathname === '/api/sync' && method === 'POST') return sync(request, env);
  if (pathname === '/api/admin/certifications' && method === 'POST') return saveCatalog(request, env);

  throw new HttpError(404, 'Not found');
}

// ---------- Auth ----------

async function signup(request, env) {
  const body = await readBody(request);
  const name = String(body.name || '').trim().slice(0, 100);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!name) throw new HttpError(400, 'Name is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new HttpError(400, 'Enter a valid email');
  }
  if (password.length < MIN_PASSWORD) throw new HttpError(400, `Password must be at least ${MIN_PASSWORD} characters`);

  const ipKey = 'signup-ip:' + clientIp(request);
  await checkLimit(env, ipKey, LIMITS.signupIp);

  const existing = await env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first();
  if (existing) throw new HttpError(409, 'An account with that email already exists');

  const id = 'usr_' + randomHex(12);
  const salt = randomHex(16);
  const hash = await hashPassword(password, salt);
  const profile = {
    joinedDate: new Date().toISOString().split('T')[0],
    avatarPhoto: null,
    credlyUsername: null,
    mfa: { enabled: false, method: null },
    onboardingComplete: false,
    careerGoal: null
  };

  await env.DB.prepare(
    'INSERT INTO users (id, email, name, password_hash, password_salt, profile) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, email, name, hash, salt, JSON.stringify(profile)).run();
  await recordAttempt(env, ipKey, LIMITS.signupIp);

  const cookie = await createSession(env, id);
  const user = toClientUser({ id, email, name, role: 'member', profile: JSON.stringify(profile) });
  return json({ user }, 201, { 'Set-Cookie': cookie });
}

async function login(request, env) {
  const body = await readBody(request);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const emailKey = 'login-email:' + email;
  const ipKey = 'login-ip:' + clientIp(request);
  await checkLimit(env, emailKey, LIMITS.loginEmail);
  await checkLimit(env, ipKey, LIMITS.loginIp);

  const row = await env.DB.prepare(
    'SELECT id, email, name, role, profile, password_hash, password_salt FROM users WHERE email = ?'
  ).bind(email).first();

  // Hash even when the user doesn't exist so response time doesn't reveal which emails are registered
  const hash = await hashPassword(password, row ? row.password_salt : '00'.repeat(16));
  if (!row || !safeEqual(hash, row.password_hash)) {
    await recordAttempt(env, emailKey, LIMITS.loginEmail);
    await recordAttempt(env, ipKey, LIMITS.loginIp);
    throw new HttpError(401, 'Incorrect email or password');
  }

  await env.DB.prepare('DELETE FROM rate_limits WHERE key = ?').bind(emailKey).run();
  const cookie = await createSession(env, row.id);
  return json({ user: toClientUser(row) }, 200, { 'Set-Cookie': cookie });
}

async function logout(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (token) {
    await env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
}

// Verifies the current password, sets the new one, and signs out every other device
async function changePassword(request, env) {
  const user = await requireUser(request, env);
  const body = await readBody(request);
  const current = String(body.currentPassword || '');
  const next = String(body.newPassword || '');
  if (next.length < MIN_PASSWORD) throw new HttpError(400, `Password must be at least ${MIN_PASSWORD} characters`);

  const key = 'password-user:' + user.id;
  await checkLimit(env, key, LIMITS.loginEmail);

  const row = await env.DB.prepare('SELECT password_hash, password_salt FROM users WHERE id = ?').bind(user.id).first();
  if (!safeEqual(await hashPassword(current, row.password_salt), row.password_hash)) {
    await recordAttempt(env, key, LIMITS.loginEmail);
    throw new HttpError(403, 'Current password is incorrect');
  }

  const salt = randomHex(16);
  const tokenHash = await sha256(getCookie(request, SESSION_COOKIE));
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?')
      .bind(await hashPassword(next, salt), salt, user.id),
    env.DB.prepare('DELETE FROM auth_sessions WHERE user_id = ? AND token_hash != ?').bind(user.id, tokenHash),
    env.DB.prepare('DELETE FROM rate_limits WHERE key = ?').bind(key)
  ]);
  return json({ ok: true });
}

// ---------- Rate limiting ----------

function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

async function checkLimit(env, key, [max, windowSec]) {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare('SELECT count, window_start FROM rate_limits WHERE key = ?').bind(key).first();
  if (row && row.window_start > now - windowSec && row.count >= max) {
    const minutes = Math.ceil((row.window_start + windowSec - now) / 60);
    throw new HttpError(429, `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
  }
}

async function recordAttempt(env, key, [, windowSec]) {
  const now = Math.floor(Date.now() / 1000);
  // A new window starts when the old one has expired
  await env.DB.prepare(
    `INSERT INTO rate_limits (key, count, window_start) VALUES (?1, 1, ?2)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN window_start <= ?2 - ?3 THEN 1 ELSE count + 1 END,
       window_start = CASE WHEN window_start <= ?2 - ?3 THEN ?2 ELSE window_start END`
  ).bind(key, now, windowSec).run();
}

async function createSession(env, userId) {
  const token = randomHex(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM auth_sessions WHERE user_id = ? AND expires_at < ?').bind(userId, new Date().toISOString()),
    // Housekeeping: drop rate limit counters older than a day
    env.DB.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(Math.floor(Date.now() / 1000) - 86400),
    env.DB.prepare('INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(await sha256(token), userId, expires)
  ]);
  return sessionCookie(token, SESSION_DAYS * 86400);
}

async function requireUser(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) throw new HttpError(401, 'Not signed in');
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role, u.profile
       FROM auth_sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?`
  ).bind(await sha256(token), new Date().toISOString()).first();
  if (!row) throw new HttpError(401, 'Session expired');
  return row;
}

// ---------- Data ----------

async function getState(request, env) {
  const user = await requireUser(request, env);
  const queries = Object.values(COLLECTIONS).map(c =>
    env.DB.prepare(`SELECT data FROM ${c.table} WHERE user_id = ? ORDER BY rowid DESC`).bind(user.id)
  );
  queries.push(env.DB.prepare('SELECT data FROM user_settings WHERE user_id = ?').bind(user.id));
  queries.push(env.DB.prepare('SELECT data FROM certifications ORDER BY position'));

  const results = await env.DB.batch(queries);
  const state = { user: toClientUser(user) };
  Object.keys(COLLECTIONS).forEach((key, i) => {
    state[key] = results[i].results.map(r => JSON.parse(r.data));
  });
  const n = Object.keys(COLLECTIONS).length;
  const settingsRow = results[n].results[0];
  state.settings = settingsRow ? JSON.parse(settingsRow.data) : null;
  const catalog = results[n + 1].results;
  // null = no admin has saved a catalog yet, so the app uses its built-in list
  state.certifications = catalog.length ? catalog.map(r => JSON.parse(r.data)) : null;
  return json(state);
}

// Admins replace the whole shared certification list at once. Body: { certifications: [...] }
async function saveCatalog(request, env) {
  const user = await requireUser(request, env);
  if (user.role !== 'admin') throw new HttpError(403, 'Admins only');
  const body = await readBody(request);
  const certs = validateItems(body.certifications, 'certifications');
  if (new Set(certs.map(c => c.id)).size !== certs.length) throw new HttpError(400, 'Duplicate certification ids');

  await env.DB.batch([
    env.DB.prepare('DELETE FROM certifications'),
    env.DB.prepare(
      `INSERT INTO certifications (id, position, data)
       SELECT json_extract(value, '$.id'), key, json(value) FROM json_each(?1)`
    ).bind(JSON.stringify(certs))
  ]);
  return json({ ok: true });
}

// Body: {
//   goals?: { upsert: [...], delete: [ids] }, sessions?: ..., quizHistory?: ...,
//   settings?: {...}, profile?: {...}
// }
async function sync(request, env) {
  const user = await requireUser(request, env);
  const body = await readBody(request);
  const db = env.DB;
  const stmts = [];

  for (const [key, c] of Object.entries(COLLECTIONS)) {
    const change = body[key];
    if (!change) continue;

    const deletes = validateIds(change.delete || [], key);
    if (deletes.length) {
      stmts.push(db.prepare(
        `DELETE FROM ${c.table} WHERE user_id = ?1 AND id IN (SELECT value FROM json_each(?2))`
      ).bind(user.id, JSON.stringify(deletes)));
    }

    const upserts = validateItems(change.upsert || [], key);
    if (upserts.length) {
      const cols = Object.keys(c.columns);
      const extracts = cols.map(col => `json_extract(value, '${c.columns[col]}')`);
      const updates = [...cols, 'data'].map(col => `${col} = excluded.${col}`).join(', ');
      // One statement for the whole list. Items are inserted last-to-first so that
      // "ORDER BY rowid DESC" on read returns them in the client's original order.
      stmts.push(db.prepare(
        `INSERT INTO ${c.table} (user_id, id, ${cols.join(', ')}, data, updated_at)
         SELECT ?1, json_extract(value, '$.id'), ${extracts.join(', ')}, json(value), datetime('now')
           FROM json_each(?2) WHERE true ORDER BY key DESC
         ON CONFLICT (user_id, id) DO UPDATE SET ${updates}, updated_at = datetime('now')`
      ).bind(user.id, JSON.stringify(upserts)));
    }
  }

  if (body.settings !== undefined) {
    const data = JSON.stringify(body.settings);
    if (!isPlainObject(body.settings) || data.length > MAX_SETTINGS_BYTES) {
      throw new HttpError(400, 'Invalid settings');
    }
    stmts.push(db.prepare(
      `INSERT INTO user_settings (user_id, data, updated_at) VALUES (?1, ?2, datetime('now'))
       ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
    ).bind(user.id, data));
  }

  if (body.profile !== undefined) {
    if (!isPlainObject(body.profile)) throw new HttpError(400, 'Invalid profile');
    // id, email and role are owned by the server and can't be changed through sync
    const { id, email, role, name, ...profile } = body.profile;
    const data = JSON.stringify(profile);
    if (data.length > MAX_PROFILE_BYTES) throw new HttpError(413, 'Profile is too large');
    const newName = String(name || user.name).trim().slice(0, 100) || user.name;
    stmts.push(db.prepare('UPDATE users SET name = ?, profile = ? WHERE id = ?').bind(newName, data, user.id));
  }

  if (stmts.length) await db.batch(stmts);
  return json({ ok: true });
}

// ---------- Helpers ----------

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers }
  });
}

// Cross-site forms can't send application/json without a CORS preflight, which this API never allows.
function requireJson(request) {
  const type = request.headers.get('Content-Type') || '';
  if (!type.startsWith('application/json')) throw new HttpError(415, 'Expected JSON');
}

async function readBody(request) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > MAX_BODY_BYTES) throw new HttpError(413, 'Request too large');
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, 'Request too large');
  try {
    const body = JSON.parse(text || '{}');
    if (!isPlainObject(body)) throw new Error();
    return body;
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function validateId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 100;
}

function validateIds(ids, key) {
  if (!Array.isArray(ids) || !ids.every(validateId)) throw new HttpError(400, `Invalid ${key} ids`);
  return ids;
}

function validateItems(items, key) {
  if (!Array.isArray(items)) throw new HttpError(400, `Invalid ${key}`);
  for (const item of items) {
    if (!isPlainObject(item) || !validateId(item.id) || JSON.stringify(item).length > MAX_ITEM_BYTES) {
      throw new HttpError(400, `Invalid ${key} item`);
    }
  }
  return items;
}

function toClientUser(row) {
  const profile = typeof row.profile === 'string' ? JSON.parse(row.profile || '{}') : (row.profile || {});
  return { ...profile, id: row.id, email: row.email, name: row.name, role: row.role };
}

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

function sessionCookie(value, maxAge) {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function randomHex(bytes) {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return [...buf].map(b => b.toString(16).padStart(2, '0')).join('');
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(text) {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const salt = new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
    key,
    256
  );
  return toHex(bits);
}

function safeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.length !== y.length) return false;
  return crypto.subtle.timingSafeEqual(x, y);
}
