'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../client-api.js');
const reply = (text, status = 200, type = 'application/json') => async () => new Response(text, { status, headers: { 'Content-Type': type } });

test('login success parses JSON and sends cookie credentials', async () => {
  const result = await request('/api/login', { method: 'POST', body: '{"email":"patient@kaalinga.demo","password":"test-only"}' }, async (path, options) => {
    assert.equal(path, '/api/login'); assert.equal(options.credentials, 'same-origin'); assert.equal(options.method, 'POST');
    return new Response('{"user":{"id":"patient-412"}}', { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  });
  assert.equal(result.user.id, 'patient-412');
});
test('incorrect login preserves the server message and HTTP status', async () => {
  await assert.rejects(request('/api/login', {}, reply('{"error":"Check your account and password."}', 401)), error => error.message === 'Check your account and password.' && error.status === 401 && error.code === 'api_error');
});
for (const [name, text, status, type, code] of [
  ['HTML error page', '<html>Backend unavailable</html>', 502, 'text/html', 'unexpected_response_type'],
  ['plain text not found', 'Not found', 404, 'text/plain', 'unexpected_response_type'],
  ['empty JSON response', '', 200, 'application/json', 'invalid_json_response'],
  ['truncated JSON response', '{"user":', 200, 'application/json', 'invalid_json_response'],
  ['HTML labelled JSON', '<html>Error</html>', 500, 'application/json', 'invalid_json_response'],
  ['null response', 'null', 200, 'application/json', 'invalid_response_data'],
  ['array response', '[]', 200, 'application/json', 'invalid_response_data']
]) test('login handles '+name+' without exposing a JSON parser error', async () => {
  await assert.rejects(request('/api/login', {}, reply(text, status, type)), error => !(error instanceof SyntaxError) && error.code === code && error.status === status && !error.message.includes(text || 'Unexpected token'));
});
test('network failure explains connection problem', async () => {
  await assert.rejects(request('/api/login', {}, async () => { throw new TypeError('Failed to fetch'); }), error => error.code === 'connection_failed' && error.status === 0);
});
test('timeout is distinguishable from invalid JSON', async () => {
  await assert.rejects(request('/api/login', {}, async () => { throw new DOMException('Timed out', 'TimeoutError'); }), error => error.code === 'request_timeout');
});
