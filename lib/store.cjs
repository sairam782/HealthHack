'use strict';
const fs = require('node:fs');
const path = require('node:path');

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, role TEXT NOT NULL, department TEXT, room TEXT, password_hash TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS staffing (user_id TEXT PRIMARY KEY REFERENCES users(id), on_shift INTEGER NOT NULL, competencies TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS tickets (id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES users(id), room TEXT NOT NULL, original_text TEXT NOT NULL, summary TEXT NOT NULL, tier TEXT NOT NULL, priority INTEGER NOT NULL, department TEXT NOT NULL, responder TEXT NOT NULL, is_clinical INTEGER NOT NULL, confidence REAL, reasoning TEXT NOT NULL, patient_summary TEXT NOT NULL, detected_language TEXT NOT NULL, source TEXT NOT NULL, safety_flags TEXT NOT NULL, secondary_request TEXT, parent_id TEXT REFERENCES tickets(id), created_at TEXT NOT NULL, acknowledged_at TEXT, resolved_at TEXT, acknowledged_by TEXT, classification_ms REAL NOT NULL, request_key TEXT UNIQUE NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), ticket_id TEXT NOT NULL REFERENCES tickets(id), message TEXT NOT NULL, created_at TEXT NOT NULL, read_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL REFERENCES tickets(id), actor_id TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (id TEXT PRIMARY KEY, account_key TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS speech_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS speech_sessions_user ON speech_sessions(user_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS video_calls (id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL REFERENCES tickets(id), patient_id TEXT NOT NULL REFERENCES users(id), nurse_id TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, expires_at TEXT NOT NULL, consent_at TEXT, connected_at TEXT, ended_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS video_signals (id TEXT PRIMARY KEY, call_id TEXT NOT NULL REFERENCES video_calls(id), sender_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS video_calls_patient ON video_calls(patient_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS video_signals_call ON video_signals(call_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS tickets_department ON tickets(department, created_at)`,
  `CREATE INDEX IF NOT EXISTS tickets_patient ON tickets(patient_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS notifications_user ON notifications(user_id, created_at)`
];

function createStore(options = {}) {
  const databaseUrl = options.databaseUrl;
  if (databaseUrl) {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: databaseUrl, max: 4, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
    const queryWith = async (client, sql, params = []) => {
      let i = 0;
      return client.query(sql.replace(/\?/g, () => '$' + (++i)), params);
    };
    return {
      kind: 'postgres',
      query: (sql, params) => queryWith(pool, sql, params),
      async transaction(callback) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          // Serializes concurrent mutations and duplicate retry keys across function instances.
          await client.query('SELECT pg_advisory_xact_lock(4122026)');
          const result = await callback({ query: (sql, params) => queryWith(client, sql, params) });
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally { client.release(); }
      },
      close: () => pool.end()
    };
  }
  const { DatabaseSync } = require('node:sqlite');
  const file = options.filename || path.join(__dirname, '..', 'data', 'kaalinga.sqlite');
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const database = new DatabaseSync(file);
  database.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  let pending = Promise.resolve();
  const queryNow = (sql, params = []) => {
    const statement = database.prepare(sql);
    if (/^\s*(SELECT|WITH)/i.test(sql)) return { rows: statement.all(...params) };
    return { rows: [], rowCount: Number(statement.run(...params).changes) };
  };
  return {
    kind: 'sqlite',
    async query(sql, params) { await pending; return queryNow(sql, params); },
    transaction(callback) {
      const operation = pending.then(async () => {
        database.exec('BEGIN IMMEDIATE');
        try {
          const result = await callback({ query: async (sql, params) => queryNow(sql, params) });
          database.exec('COMMIT');
          return result;
        } catch (error) { database.exec('ROLLBACK'); throw error; }
      });
      pending = operation.catch(() => {});
      return operation;
    },
    async close() { await pending; database.close(); }
  };
}
async function initializeSchema(store) {
  await store.transaction(async tx => {
    for (const sql of SCHEMA) await tx.query(sql);
    // Additive migrations preserve existing demo requests and work on both stores.
    if(store.kind==='postgres'){
      await tx.query('ALTER TABLE tickets ADD COLUMN IF NOT EXISTS pain_details TEXT');
      await tx.query('ALTER TABLE tickets ADD COLUMN IF NOT EXISTS intents TEXT');
      await tx.query('ALTER TABLE tickets ADD COLUMN IF NOT EXISTS routing_checks TEXT');
    }else{
      const columns=(await tx.query('SELECT name FROM pragma_table_info(\'tickets\')')).rows.map(row=>row.name);
      for(const name of ['pain_details','intents','routing_checks'])if(!columns.includes(name))await tx.query('ALTER TABLE tickets ADD COLUMN '+name+' TEXT');
    }
  });
}
module.exports = { createStore, initializeSchema };
