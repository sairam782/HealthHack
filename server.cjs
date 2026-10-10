'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
if (fs.existsSync(path.join(__dirname, '.env'))) process.loadEnvFile(path.join(__dirname, '.env'));
const { createApplication } = require('./lib/handler.cjs');
const host = process.env.HOST || '127.0.0.1';
const application = createApplication({ publicDeployment: process.env.NODE_ENV === 'production' || !['127.0.0.1', 'localhost', '::1'].includes(host) });
const files = {
  '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'],
  '/app.js': ['app.js', 'text/javascript'], '/routing.js': ['routing.js', 'text/javascript'],
  '/client-api.js': ['client-api.js', 'text/javascript'],
  '/vendor/react.production.min.js': ['vendor/react.production.min.js', 'text/javascript'],
  '/vendor/react-dom.production.min.js': ['vendor/react-dom.production.min.js', 'text/javascript']
};
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname.startsWith('/api/')) return application.handler(req, res);
  const asset = files[pathname];
  if (!asset || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': asset[1] + '; charset=utf-8', 'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'" });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(path.join(__dirname, asset[0])).pipe(res);
});
application.initialize().then(() => {
  server.listen(Number(process.env.PORT) || 8123, host, () => console.log('Kaalinga ready at http://' + host + ':' + server.address().port));
}).catch(error => { console.error('Startup failed:', error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => application.close().then(() => process.exit())));
