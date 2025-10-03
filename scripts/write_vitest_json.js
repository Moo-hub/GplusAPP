// This script runs Vitest programmatically and writes the JSON reporter output to a file.
// It avoids shell redirection issues in PowerShell.

const { run } = require('vitest/node');
const fs = require('fs');

async function main() {
  const config = {
    config: 'vitest.components.config.js',
    include: ['frontend/src/**'],
    reporters: ['json'],
  };

  // run returns a result object when using the programmatic API
  const result = await run(config);

  // vitest's node API prints reporters to stdout; we capture via process.stdout.write interception
  // But run returns a `result` boolean and writes reporters to stdout; as a workaround, re-run with env var to write JSON
  // Simpler approach: spawn vitest as a child process with --reporter json and capture stdout.
}

// Fallback: spawn child_process to capture stdout
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
  }
  if (err) console.error('VITEST STDERR:\n', err);
  process.exit(code);
});
