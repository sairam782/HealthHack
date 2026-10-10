'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { createApplication } = require('../lib/handler.cjs');
const { startLocalServers, closeServers } = require('../lib/local-server.cjs');

test('separate local listeners share requests and alerts while keeping sessions independent', async () => {
  const app = createApplication({ filename: ':memory:', databaseUrl: '', demoPassword: 'test-password', apiKey: '', elevenKey: '', publicDeployment: false });
  let servers = [];
  try {
    servers = await startLocalServers(app, [0, 0, 0]);
    const urls = servers.map(server => 'http://127.0.0.1:' + server.address().port);
    const hosts = ['patient.localhost', 'dietary.localhost', 'patient2.localhost'];
    const sessions = [];
    async function request(index, endpoint, options = {}) {
      const host = hosts[index] + ':' + servers[index].address().port;
      return new Promise((resolve, reject) => {
        const req = http.request(urls[index] + endpoint, { method: options.method || 'GET', headers: { Host: host, Origin: 'http://' + host, 'Content-Type': 'application/json', ...(sessions[index] ? { Cookie: sessions[index] } : {}), ...options.headers } }, res => {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try { resolve({ response: { status: res.statusCode, headers: new Headers(Object.entries(res.headers).map(([name, value]) => [name, Array.isArray(value) ? value.join(', ') : value])) }, data: JSON.parse(data) }); }
            catch (error) { reject(error); }
          });
          res.on('error', reject);
        });
        req.on('error', reject);
        req.end(options.body);
      });
    }
    for (const [index, email] of ['patient@kaalinga.demo', 'dietary@kaalinga.demo', 'patient2@kaalinga.demo'].entries()) {
      const { response, data } = await request(index, '/api/login', { method: 'POST', body: JSON.stringify({ email, password: 'test-password' }) });
      assert.equal(response.status, 200);
      assert.equal(data.user.email, email);
      const cookie = response.headers.get('set-cookie');
      assert.match(cookie, /HttpOnly/);
      assert.doesNotMatch(cookie, /Domain=/i, 'browser cookies must be restricted to the exact hostname');
      sessions[index] = cookie.split(';')[0];
    }
    const created = await request(0, '/api/requests', { method: 'POST', body: JSON.stringify({ text: 'Can I get water?', requestKey: randomUUID() }) });
    assert.equal(created.response.status, 201);
    const id = created.data.ticket.id;
    const dietary = (await request(1, '/api/tickets')).data;
    assert.ok(dietary.tickets.some(ticket => ticket.id === id));
    assert.ok(dietary.notifications.some(notification => notification.ticket_id === id));
    const otherPatient = (await request(2, '/api/tickets')).data;
    assert.ok(!otherPatient.tickets.some(ticket => ticket.id === id));
    assert.ok(!otherPatient.notifications.some(notification => notification.ticket_id === id));
    const acknowledged = await request(1, '/api/tickets/' + id, { method: 'PATCH', body: JSON.stringify({ action: 'acknowledge' }) });
    assert.equal(acknowledged.response.status, 200);
    const patient = (await request(0, '/api/tickets')).data;
    assert.equal(patient.tickets.find(ticket => ticket.id === id).status, 'ACKNOWLEDGED');
    assert.ok(patient.notifications.some(notification => notification.ticket_id === id));
    assert.equal((await request(0, '/api/logout', { method: 'POST', body: '{}' })).response.status, 200);
    assert.equal((await request(0, '/api/me')).response.status, 401);
    assert.equal((await request(1, '/api/me')).data.user.email, 'dietary@kaalinga.demo');
    assert.equal((await request(2, '/api/me')).data.user.email, 'patient2@kaalinga.demo');
    const page = await fetch(urls[0]);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.equal((await fetch(urls[0] + '/.env')).status, 404);
  } finally {
    await closeServers(servers);
    await app.close();
  }
});
