'use strict';
const fs = require('node:fs');
const path = require('node:path');
if (fs.existsSync(path.join(__dirname, '.env'))) process.loadEnvFile(path.join(__dirname, '.env'));
const { createApplication } = require('./lib/handler.cjs');
const { startLocalServers, closeServers } = require('./lib/local-server.cjs');
const host = process.env.HOST || '127.0.0.1';
const application = createApplication({ publicDeployment: process.env.NODE_ENV === 'production' || !['127.0.0.1', 'localhost', '::1'].includes(host) });
let servers = [];
startLocalServers(application, [Number(process.env.PORT) || 8123], host).then(started => {
  servers = started;
  console.log('Kalinga ready at http://' + host + ':' + servers[0].address().port);
}).catch(async error => { console.error('Startup failed:', error.message); await application.close(); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await closeServers(servers); await application.close(); process.exit(); });
