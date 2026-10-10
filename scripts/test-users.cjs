'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
if (fs.existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env'));
if (process.env.NODE_ENV === 'production') throw new Error('test:users is a local demo command. Use npm start for deployment.');
const { createApplication } = require('../lib/handler.cjs');
const { startLocalServers, closeServers } = require('../lib/local-server.cjs');
const profiles = [
  { host: 'patient.localhost', port: 8124, account: 'patient@kaalinga.demo', role: 'Patient · Room 412-B' },
  { host: 'nurse.localhost', port: 8125, account: 'nurse@kaalinga.demo', role: 'Registered nurse (RN)' },
  { host: 'dietary.localhost', port: 8126, account: 'dietary@kaalinga.demo', role: 'Dietary / food services' },
  { host: 'patient2.localhost', port: 8127, account: 'patient2@kaalinga.demo', role: 'Patient · Room 413-A' },
  { host: 'coordinator.localhost', port: 8128, account: 'coordinator@kaalinga.demo', role: 'Unit coordinator' },
  { host: 'bedside.localhost', port: 8129, account: 'bedside@kaalinga.demo', role: 'Patient care technician (PCT)' }
];
// One application/store serves every port. Host-only cookies isolate the browser sign-ins.
const application = createApplication({ publicDeployment: false });
let servers = [];
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await closeServers(servers);
  await application.close();
}
startLocalServers(application, profiles.map(profile => profile.port)).then(started => {
  servers = started;
  console.log('Separate local sign-ins; one shared database. Select the listed role/room on each login screen.');
  for (const profile of profiles) console.log('http://' + profile.host + ':' + profile.port + '  |  ' + profile.role + '  |  ' + profile.account);
  console.log('Use the existing demo password. Keep these hostnames: 127.0.0.1 on different ports shares a login cookie.');
}).catch(async error => { console.error('Multi-user startup failed:', error.message); await stop(); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await stop(); process.exit(); });
