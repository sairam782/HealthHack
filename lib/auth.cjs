'use strict';
const { randomBytes, scryptSync, timingSafeEqual, createHash, randomUUID } = require('node:crypto');
const roles = require('./roles.cjs');

const DEMO_USERS = [
  { id: 'patient-412', email: 'patient@kaalinga.demo', display_name: 'Patient · Room 412-B', role: 'patient', department: null, room: 'RM 412-B' },
  { id: 'patient-413', email: 'patient2@kaalinga.demo', display_name: 'Patient · Room 413-A', role: 'patient', department: null, room: 'RM 413-A' },
  { id: 'patient-414', email: 'patient3@kaalinga.demo', display_name: 'Patient · Room 414-A', role: 'patient', department: null, room: 'RM 414-A' },
  { id: 'patient-415', email: 'patient4@kaalinga.demo', display_name: 'Patient · Room 415-B', role: 'patient', department: null, room: 'RM 415-B' },
  { id: 'patient-416', email: 'patient5@kaalinga.demo', display_name: 'Patient · Room 416-A', role: 'patient', department: null, room: 'RM 416-A' },
  { id: 'patient-417', email: 'patient6@kaalinga.demo', display_name: 'Patient · Room 417-B', role: 'patient', department: null, room: 'RM 417-B' },
  { id: 'patient-418', email: 'patient7@kaalinga.demo', display_name: 'Patient · Room 418-A', role: 'patient', department: null, room: 'RM 418-A' },
  { id: 'patient-419', email: 'patient8@kaalinga.demo', display_name: 'Patient · Room 419-B', role: 'patient', department: null, room: 'RM 419-B' },
  { id: 'nurse', email: 'nurse@kaalinga.demo', display_name: 'Nursing team', role: 'staff', department: 'Nursing', room: null },
  { id: 'bedside', email: 'bedside@kaalinga.demo', display_name: 'Bedside care team', role: 'staff', department: 'Bedside Care', room: null },
  { id: 'housekeeping', email: 'housekeeping@kaalinga.demo', display_name: 'Environmental services', role: 'staff', department: 'Environmental Services', room: null },
  { id: 'dietary', email: 'dietary@kaalinga.demo', display_name: 'Dietary team', role: 'staff', department: 'Food Services', room: null },
  { id: 'facilities', email: 'facilities@kaalinga.demo', display_name: 'Facilities team', role: 'staff', department: 'Facilities', room: null },
  { id: 'clerk', email: 'clerk@kaalinga.demo', display_name: 'Unit clerk', role: 'staff', department: 'Unit Clerk', room: null },
  { id: 'specialist', email: 'specialist@kaalinga.demo', display_name: 'Specialist coordination', role: 'staff', department: 'Specialized Services', room: null },
  { id: 'coordinator', email: 'coordinator@kaalinga.demo', display_name: 'Unit coordinator', role: 'coordinator', department: null, room: null }
];
for (const role of roles.ROLES) {
  if (!DEMO_USERS.some(user=>user.id===role.id)) DEMO_USERS.push({id:role.id,email:role.id+'@kaalinga.demo',display_name:role.title,role:'staff',department:role.department,room:null});
}
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}
function verifyPassword(password, stored) {
  const [salt, encoded] = stored.split(':');
  const hash = scryptSync(password, salt, 64);
  const expected = Buffer.from(encoded, 'hex');
  return expected.length === hash.length && timingSafeEqual(hash, expected);
}
const hashSession = token => createHash('sha256').update(token).digest('hex');
function publicUser(user) {
  const profile=roles.profile(user);
  return { id: user.id, email: user.email, display_name: profile?.title || user.display_name, role: user.role, department: user.department, room: user.room,
    staff_role:profile?.title || null,group:profile?.group || null,mode:profile?.mode || null,
    viewAll:Boolean(profile?.viewAll),manageRoster:Boolean(profile?.manageRoster),canAct:Boolean(profile?.canAct),canRefer:Boolean(profile?.canRefer),clinicalReferrals:Boolean(profile?.clinicalReferrals),
    on_shift:user.on_shift===undefined?true:Boolean(user.on_shift),competencies:user.competencies?JSON.parse(user.competencies):(profile?.departments || []) };
}
async function seedUsers(store, password) {
  if (typeof password !== 'string' || password.length < 10) throw new Error('DEMO_PASSWORD must contain at least 10 characters.');
  // One hash per seed pass keeps cold starts cheap. Existing accounts are not overwritten.
  const hash = hashPassword(password);
  await store.transaction(async tx => {
    for (const user of DEMO_USERS) {
      await tx.query('INSERT INTO users (id, email, display_name, role, department, room, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING',
        [user.id, user.email, user.display_name, user.role, user.department, user.room, hash]);
      const profile=roles.profile(user);
      if(profile) await tx.query('INSERT INTO staffing (user_id, on_shift, competencies) VALUES (?, ?, ?) ON CONFLICT (user_id) DO NOTHING',[user.id,1,JSON.stringify(profile.departments)]);
    }
  });
}
function cookie(req) {
  const match = (req.headers.cookie || '').match(/(?:^|;\s*)kaalinga_session=([a-f0-9]{64})(?:;|$)/);
  return match ? match[1] : null;
}
async function getUser(store, req) {
  const token = cookie(req);
  if (!token) return null;
  const result = await store.query('SELECT u.*, r.on_shift, r.competencies FROM sessions s JOIN users u ON u.id = s.user_id LEFT JOIN staffing r ON r.user_id = u.id WHERE s.id = ? AND s.expires_at > ?', [hashSession(token), new Date().toISOString()]);
  return result.rows[0] ? publicUser(result.rows[0]) : null;
}
async function createSession(store, userId) {
  const token = randomBytes(32).toString('hex');
  await store.query('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)', [hashSession(token), userId, new Date(Date.now() + 8 * 3600000).toISOString()]);
  return token;
}
async function notify(tx, userId, ticketId, message, now) {
  await tx.query('INSERT INTO notifications (id, user_id, ticket_id, message, created_at) VALUES (?, ?, ?, ?, ?)', [randomUUID(), userId, ticketId, message, now]);
}
function canSee(user, ticket) {
  return user.viewAll || (user.role === 'patient' ? ticket.patient_id === user.id : ticket.department === user.department);
}
module.exports = { DEMO_USERS, hashPassword, verifyPassword, hashSession, publicUser, seedUsers, getUser, createSession, cookie, notify, canSee };
