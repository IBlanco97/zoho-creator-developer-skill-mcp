/**
 * Zoho Login Credential Server
 *
 * Reads ZOHO_LOGIN_EMAIL and ZOHO_LOGIN_PASSWORD from .env
 * and serves them on a local HTTP endpoint for the Playwright
 * browser to fetch during automated login.
 *
 * The server auto-closes after 60 seconds.
 * Credentials never appear in stdout/stderr.
 *
 * Usage: node scripts/zoho-login-server.mjs
 * Output: JSON {"port": <number>} on stdout when ready
 */

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

// Parse .env manually (no dependency needed)
function parseEnv(filePath) {
  const vars = {};
  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      vars[key] = val;
    }
  } catch (e) {
    process.stderr.write(`Error reading ${filePath}: ${e.message}\n`);
    process.exit(1);
  }
  return vars;
}

const env = parseEnv(envPath);
const email = env.ZOHO_LOGIN_EMAIL;
const password = env.ZOHO_LOGIN_PASSWORD;

if (!email || !password) {
  process.stderr.write(
    'ERROR: ZOHO_LOGIN_EMAIL and ZOHO_LOGIN_PASSWORD must be set in .env\n'
  );
  process.exit(1);
}

const server = createServer((req, res) => {
  // CORS for browser fetch from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/credentials') {
    res.end(JSON.stringify({ email, password }));
  } else if (req.url === '/done') {
    res.end(JSON.stringify({ status: 'closing' }));
    setTimeout(() => { server.close(); process.exit(0); }, 200);
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'not found' }));
  }
});

// Listen on random available port
server.listen(0, '127.0.0.1', () => {
  const port = server.address().port;
  // Only output the port — no credentials
  process.stdout.write(JSON.stringify({ port }) + '\n');
});

// Auto-close after 60 seconds
setTimeout(() => {
  server.close();
  process.exit(0);
}, 60_000);
