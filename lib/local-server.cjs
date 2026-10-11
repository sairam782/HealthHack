'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const files = {
  '/assets/kalinga-logo.png': ['assets/kalinga-logo.png','image/png'],
  '/assets/kalinga-icon.png': ['assets/kalinga-icon.png','image/png'],
  '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'],
  '/app.js': ['app.js', 'text/javascript'], '/routing.js': ['routing.js', 'text/javascript'],
  '/pain.js': ['pain.js','text/javascript'],
  '/patient-assistant.js': ['patient-assistant.js','text/javascript'],
  '/client-api.js': ['client-api.js', 'text/javascript'],
  '/theme.js': ['theme.js', 'text/javascript'], '/voice-reply.js': ['voice-reply.js', 'text/javascript'],
  '/video-call.js': ['video-call.js', 'text/javascript'],
  '/wake-voice.js': ['wake-voice.js', 'text/javascript'],
  '/transcribe-input.js': ['transcribe-input.js', 'text/javascript'], '/transcribe-worklet.js': ['transcribe-worklet.js', 'text/javascript'],
  '/upload-voice.js': ['upload-voice.js','text/javascript'],
  '/vendor/react.production.min.js': ['vendor/react.production.min.js', 'text/javascript'],
  '/vendor/react-dom.production.min.js': ['vendor/react-dom.production.min.js', 'text/javascript']
};
function createLocalHandler(application) {
  return (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname.startsWith('/api/')) return application.handler(req, res);
    const asset = files[pathname];
    if (!asset || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': asset[1] + '; charset=utf-8', 'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self' wss://transcribestreaming.us-east-1.amazonaws.com:8443 wss://transcribestreaming.us-west-2.amazonaws.com:8443; frame-ancestors 'none'" });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(path.join(root, asset[0])).pipe(res);
  };
}
const closeServers = servers => Promise.all(servers.map(server => new Promise(resolve => server.close(resolve))));
async function startLocalServers(application, ports, host = '127.0.0.1') {
  const servers = [];
  try {
    await application.initialize();
    for (const port of ports) {
      const server = http.createServer(createLocalHandler(application));
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => { server.removeListener('error', reject); resolve(); });
      });
      servers.push(server);
    }
    return servers;
  } catch (error) {
    await closeServers(servers);
    throw error;
  }
}
module.exports = { createLocalHandler, startLocalServers, closeServers };
