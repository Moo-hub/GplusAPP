// This script runs Vitest as a child process and writes the JSON reporter output to a file.
// It avoids shell redirection issues in PowerShell by capturing stdout programmatically.

const fs = require('fs');
const { spawn } = require('child_process');

const vitest = spawn('npx', ['vitest', 'run', '--config', 'vitest.components.config.js', 'frontend/src', '--reporter', 'json'], { shell: true });

let out = '';
let err = '';
vitest.stdout.on('data', (chunk) => { out += chunk.toString(); });
vitest.stderr.on('data', (chunk) => { err += chunk.toString(); });

vitest.on('close', (code) => {
  if (out.trim()) {
    fs.writeFileSync('vitest-frontend-results.json', out, 'utf8');
    console.log('WROTE_JSON: vitest-frontend-results.json');
  } else {
    console.error('No stdout captured from vitest.');
  }
  if (err) console.error('VITEST STDERR:\n', err);
  process.exit(code);
});
