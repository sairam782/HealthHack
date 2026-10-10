'use strict';
const { randomUUID, createHash } = require('node:crypto');
const { performance } = require('node:perf_hooks');
const { createStore, initializeSchema } = require('./store.cjs');
const auth = require('./auth.cjs');
const routing = require('../routing.js');

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
}
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
async function body(req) {
  const validate = value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'A JSON object is required.');
    return value;
  };
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body) > 16000) throw new HttpError(413, 'Request is too large.');
      try { return validate(JSON.parse(req.body)); } catch (_) { throw new HttpError(400, 'Invalid JSON object.'); }
    }
    if (Buffer.byteLength(JSON.stringify(req.body)) > 16000) throw new HttpError(413, 'Request is too large.');
    return validate(req.body);
  }
  let data = '';
  for await (const part of req) {
    data += part.toString();
    if (Buffer.byteLength(data) > 16000) throw new HttpError(413, 'Request is too large.');
  }
  try { return validate(JSON.parse(data || '{}')); } catch (_) { throw new HttpError(400, 'Invalid JSON object.'); }
}
function checkOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin) {
    try { if (new URL(origin).host !== host) throw new Error('origin'); }
    catch (_) { throw new HttpError(403, 'Request origin is not allowed.'); }
  }
  if (req.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'Cross-site requests are not allowed.');
}
function hydrate(row) {
  return { ...row, is_clinical: Boolean(row.is_clinical), safety_flags: JSON.parse(row.safety_flags), secondary_request: row.secondary_request ? JSON.parse(row.secondary_request) : null,
    status: row.resolved_at ? 'RESOLVED' : row.acknowledged_at ? 'ACKNOWLEDGED' : 'NEW' };
}
function scope(user) {
  if (user.role === 'patient') return { sql: 'patient_id = ?', args: [user.id] };
  if (user.role === 'staff') return { sql: 'department = ?', args: [user.department] };
  return { sql: '1 = 1', args: [] };
}
function publicTicket(row, user) {
  const ticket = hydrate(row);
  delete ticket.request_key;
  // Staff receive only the task assigned to their department. A secondary task has its own text.
  if (user.role === 'patient') { delete ticket.reasoning; delete ticket.acknowledged_by; }
  return ticket;
}
function createApplication(config = {}) {
  const publicDeployment = config.publicDeployment ?? Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');
  const databaseUrl = config.databaseUrl ?? process.env.DATABASE_URL;
  const demoPassword = config.demoPassword ?? (process.env.DEMO_PASSWORD || (publicDeployment ? null : 'kaalinga-demo'));
  if (publicDeployment && (!databaseUrl || !demoPassword)) throw new Error('Public hosting requires DATABASE_URL and DEMO_PASSWORD.');
  const store = config.store || createStore({ databaseUrl, filename: config.filename });
  const apiKey = config.apiKey ?? process.env.GROQ_API_KEY;
  const elevenKey = config.elevenKey ?? process.env.ELEVENLABS_API_KEY;
  const model = config.model || process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  let ready;
  async function initialize() {
    if (!ready) ready = (async () => {
      await initializeSchema(store);
      await auth.seedUsers(store, demoPassword);
    })().catch(error => { ready = null; throw error; });
    return ready;
  }
  function setCookie(res, token, clear = false) {
    res.setHeader('Set-Cookie', 'kaalinga_session=' + (clear ? '' : token) + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + (clear ? '0' : '28800') + (publicDeployment ? '; Secure' : ''));
  }
  async function createTicket(tx, user, text, result, key, latency, now, parentId = null) {
    const id = randomUUID();
    const fields = ['id', 'patient_id', 'room', 'original_text', 'summary', 'tier', 'priority', 'department', 'responder', 'is_clinical', 'confidence', 'reasoning', 'patient_summary', 'detected_language', 'source', 'safety_flags', 'secondary_request', 'parent_id', 'created_at', 'classification_ms', 'request_key'];
    const values = [id, user.id, user.room, text, result.summary, result.tier, result.priority, result.department, result.responder, Number(result.is_clinical), result.confidence, result.reasoning, result.patient_summary, result.detected_language, result.source, JSON.stringify(result.safety_flags), result.secondary_request ? JSON.stringify(result.secondary_request) : null, parentId, now, latency, key];
    await tx.query('INSERT INTO tickets (' + fields.join(', ') + ') VALUES (' + fields.map(() => '?').join(', ') + ')', values);
    await tx.query('INSERT INTO audit (id, ticket_id, actor_id, action, created_at) VALUES (?, ?, ?, ?, ?)', [randomUUID(), id, user.id, 'CREATED', now]);
    const recipients = await tx.query("SELECT id FROM users WHERE (role = 'staff' AND department = ?) OR role = 'coordinator'", [result.department]);
    for (const recipient of recipients.rows) await auth.notify(tx, recipient.id, id, (result.priority <= 2 ? 'Urgent · ' : '') + user.room + ' · ' + result.summary, now);
    const row = (await tx.query('SELECT * FROM tickets WHERE id = ?', [id])).rows[0];
    return row;
  }
  async function handler(req, res) {
    try {
      await initialize();
      const url = new URL(req.url, 'http://localhost');
      const pathname = url.pathname;
      if (['POST', 'PATCH', 'DELETE'].includes(req.method)) checkOrigin(req);
      if (req.method === 'GET' && pathname === '/api/config') {
        return json(res, 200, { aiConfigured: Boolean(apiKey), voiceConfigured: Boolean(elevenKey), model: apiKey ? model : null,
          storage: store.kind, localDemo: !publicDeployment, accounts: auth.DEMO_USERS.map(auth.publicUser) });
      }
      if (req.method === 'POST' && pathname === '/api/login') {
        const input = await body(req);
        if (typeof input.email !== 'string' || typeof input.password !== 'string' || input.password.length > 200) throw new HttpError(400, 'Email and password are required.');
        const email = input.email.trim().toLowerCase();
        const accountKey = createHash('sha256').update(email).digest('hex');
        const recent = new Date(Date.now() - 15 * 60000).toISOString();
        const attempts = await store.query('SELECT COUNT(*) AS total FROM login_attempts WHERE account_key = ? AND created_at > ?', [accountKey, recent]);
        if (Number(attempts.rows[0].total) >= 10) throw new HttpError(429, 'Too many sign-in attempts. Try again in 15 minutes.');
        const result = await store.query('SELECT * FROM users WHERE email = ?', [email]);
        if (!result.rows[0] || !auth.verifyPassword(input.password, result.rows[0].password_hash)) {
          await store.query('INSERT INTO login_attempts (id, account_key, created_at) VALUES (?, ?, ?)', [randomUUID(), accountKey, new Date().toISOString()]);
          throw new HttpError(401, 'Check your account and password.');
        }
        await store.query('DELETE FROM login_attempts WHERE account_key = ?', [accountKey]);
        setCookie(res, await auth.createSession(store, result.rows[0].id));
        return json(res, 200, { user: auth.publicUser(result.rows[0]) });
      }
      const user = await auth.getUser(store, req);
      if (!user) throw new HttpError(401, 'Sign in to continue.');
      if (req.method === 'GET' && pathname === '/api/me') return json(res, 200, { user });
      if (req.method === 'POST' && pathname === '/api/logout') {
        const token = auth.cookie(req);
        if (token) await store.query('DELETE FROM sessions WHERE id = ?', [auth.hashSession(token)]);
        setCookie(res, '', true);
        return json(res, 200, { ok: true });
      }
      if (req.method === 'GET' && pathname === '/api/tickets') {
        const access = scope(user);
        const tickets = await store.query('SELECT * FROM tickets WHERE ' + access.sql + ' ORDER BY created_at DESC', access.args);
        const notifications = await store.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [user.id]);
        return json(res, 200, { user, tickets: tickets.rows.map(row => publicTicket(row, user)), notifications: notifications.rows, serverTime: new Date().toISOString() });
      }
      if (req.method === 'POST' && pathname === '/api/requests') {
        if (user.role !== 'patient') throw new HttpError(403, 'Only patient accounts can submit a call bell request.');
        const input = await body(req);
        if (typeof input.text !== 'string' || !input.text.trim() || input.text.length > 2000) throw new HttpError(400, 'Enter a request of 1–2000 characters.');
        if (typeof input.requestKey !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(input.requestKey)) throw new HttpError(400, 'A valid request identifier is required.');
        const language = typeof input.language === 'string' && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(input.language) ? input.language : 'en-US';
        const key = user.id + ':' + input.requestKey;
        const existing = await store.query('SELECT * FROM tickets WHERE request_key = ?', [key]);
        if (existing.rows[0]) return json(res, 200, { ticket: publicTicket(existing.rows[0], user), duplicate: true });
        const start = performance.now();
        const result = await routing.classifyRequest(input.text.trim(), { language, forceClinical: input.forceClinical === true }, { apiKey, model, fetch: config.fetch, timeoutMs: config.timeoutMs });
        const latency = Math.round((performance.now() - start) * 10) / 10;
        const now = new Date().toISOString();
        const saved = await store.transaction(async tx => {
          const retry = await tx.query('SELECT * FROM tickets WHERE request_key = ?', [key]);
          if (retry.rows[0]) return retry.rows[0];
          const primary = await createTicket(tx, user, input.text.trim(), result, key, latency, now);
          if (result.secondary_request) {
            const secondary = result.secondary_request;
            const secondaryResult = { ...routing.classifyLocal(secondary.summary, { language }), ...secondary,
              responder: routing.ROUTES[secondary.department].responder, priority: 4, is_clinical: false, confidence: null,
              patient_summary: routing.readback(routing.detectLanguage(input.text, language), false),
              detected_language: result.detected_language, reasoning: 'Service task separated from the primary request.',
              source: 'secondary_task', safety_flags: [], secondary_request: null };
            // Only service text reaches the operational team; the clinical concern stays with nursing.
            await createTicket(tx, user, secondary.summary, secondaryResult, key + ':secondary', 0, now, primary.id);
          }
          await auth.notify(tx, user.id, primary.id, result.patient_summary, now);
          return primary;
        });
        return json(res, 201, { ticket: publicTicket(saved, user) });
      }
      const ticketMatch = pathname.match(/^\/api\/tickets\/([a-f0-9-]{36})$/);
      if (req.method === 'PATCH' && ticketMatch) {
        if (user.role === 'patient') throw new HttpError(403, 'Staff acknowledgement is required.');
        const input = await body(req);
        if (!['acknowledge', 'resolve'].includes(input.action)) throw new HttpError(400, 'Unknown ticket action.');
        const updated = await store.transaction(async tx => {
          const row = (await tx.query('SELECT * FROM tickets WHERE id = ?', [ticketMatch[1]])).rows[0];
          if (!row || !auth.canSee(user, row)) throw new HttpError(404, 'Ticket not found.');
          if (row.resolved_at || (input.action === 'acknowledge' && row.acknowledged_at)) return row;
          if (input.action === 'resolve' && !row.acknowledged_at) throw new HttpError(409, 'Acknowledge the request before resolving it.');
          const now = new Date().toISOString();
          if (input.action === 'acknowledge') await tx.query('UPDATE tickets SET acknowledged_at = ?, acknowledged_by = ? WHERE id = ?', [now, user.id, row.id]);
          else await tx.query('UPDATE tickets SET resolved_at = ? WHERE id = ?', [now, row.id]);
          await tx.query('INSERT INTO audit (id, ticket_id, actor_id, action, created_at) VALUES (?, ?, ?, ?, ?)', [randomUUID(), row.id, user.id, input.action.toUpperCase(), now]);
          const message = row.department + (input.action === 'acknowledge' ? ' has acknowledged your request.' : ' has marked your request complete.');
          await auth.notify(tx, row.patient_id, row.id, message, now);
          return (await tx.query('SELECT * FROM tickets WHERE id = ?', [row.id])).rows[0];
        });
        return json(res, 200, { ticket: publicTicket(updated, user) });
      }
      if (req.method === 'POST' && pathname === '/api/notifications/read') {
        await store.query('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL', [new Date().toISOString(), user.id]);
        return json(res, 200, { ok: true });
      }
      const voiceMatch = pathname.match(/^\/api\/voice\/([a-f0-9-]{36})$/);
      if (req.method === 'GET' && voiceMatch) {
        if (!elevenKey) throw new HttpError(503, 'Voice readback is not configured.');
        const ticket = (await store.query('SELECT * FROM tickets WHERE id = ?', [voiceMatch[1]])).rows[0];
        if (!ticket || !auth.canSee(user, ticket)) throw new HttpError(404, 'Ticket not found.');
        const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
        if (!/^[a-zA-Z0-9]{16,64}$/.test(voiceId)) throw new HttpError(503, 'Voice configuration needs attention.');
        const response = await (config.fetch || fetch)('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
          method: 'POST', signal: AbortSignal.timeout(8000), headers: { 'xi-api-key': elevenKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: ticket.patient_summary, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.6, similarity_boost: 0.75 } })
        });
        if (!response.ok) throw new HttpError(503, 'Voice is temporarily unavailable. Your request is still delivered.');
        res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' });
        return res.end(Buffer.from(await response.arrayBuffer()));
      }
      throw new HttpError(404, 'Endpoint not found.');
    } catch (error) {
      if (!res.headersSent) json(res, error.status || 500, { error: error.status ? error.message : 'The service is temporarily unavailable. Please retry.' });
      else res.end();
      if (!error.status) console.error('Request failed:', error.code || error.name); // Never log credentials or patient input.
    }
  }
  return { handler, initialize, store, close: () => store.close() };
}
module.exports = { createApplication };
