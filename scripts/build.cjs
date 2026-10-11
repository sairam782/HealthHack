'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'public');
fs.mkdirSync(path.join(out, 'vendor'), { recursive: true });
for (const file of ['index.html', 'patient-assistant.js', 'pain.js', 'theme.js', 'voice-reply.js', 'video-call.js', 'transcribe-input.js', 'transcribe-worklet.js', 'upload-voice.js', 'wake-voice.js', 'app.js', 'routing.js', 'client-api.js', 'vendor/react.production.min.js', 'vendor/react-dom.production.min.js']) {
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}
console.log('Built public assets. Server code, credentials, and data are excluded.');
