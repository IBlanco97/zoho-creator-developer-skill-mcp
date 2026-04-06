/**
 * Zoho Login Orchestrator
 *
 * Combines the credential server + browser login script into a
 * single command. Outputs the browser_evaluate JS code to stdout
 * that Claude can pass directly to the Playwright MCP.
 *
 * Usage:
 *   node scripts/zoho-login.mjs
 *
 * Output:
 *   Line 1: JSON with port → {"port": 12345}
 *   Line 2: "EVAL_SCRIPT_START"
 *   Lines 3+: The JS code to pass to browser_evaluate
 *   Last line: "EVAL_SCRIPT_END"
 *
 * Workflow:
 *   1. Claude runs: browser_navigate to https://accounts.zoho.com/signin
 *   2. Claude runs: node scripts/zoho-login.mjs (background)
 *   3. Claude copies the EVAL_SCRIPT block into browser_evaluate
 *   4. Login completes automatically, server self-destructs
 */

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

// Parse .env
function parseEnv(filePath) {
  const vars = {};
  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    vars[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
  return vars;
}

const env = parseEnv(envPath);
const email = env.ZOHO_LOGIN_EMAIL;
const password = env.ZOHO_LOGIN_PASSWORD;

if (!email || !password) {
  process.stderr.write(
    'ERROR: Set ZOHO_LOGIN_EMAIL and ZOHO_LOGIN_PASSWORD in .env\n'
  );
  process.exit(1);
}

const server = createServer((req, res) => {
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

server.listen(0, '127.0.0.1', () => {
  const port = server.address().port;

  // Output the port for reference
  console.log(JSON.stringify({ port }));

  // Output the self-contained browser script with port baked in
  console.log('EVAL_SCRIPT_START');
  console.log(`(async function() {
  const SERVER = 'http://127.0.0.1:${port}';
  const delay = ms => new Promise(r => setTimeout(r, ms));

  function waitFor(sel, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return resolve(el);
      const obs = new MutationObserver(() => {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null) { obs.disconnect(); clearTimeout(t); resolve(el); }
      });
      obs.observe(document.body, { childList: true, subtree: true, attributes: true });
      const t = setTimeout(() => { obs.disconnect(); reject(new Error('Timeout: ' + sel)); }, timeout);
    });
  }

  try {
    const { email, password } = await (await fetch(SERVER + '/credentials')).json();

    // Step 1: Email
    const emailEl = await waitFor('#login_id');
    emailEl.value = '';
    emailEl.focus();
    for (const c of email) { emailEl.value += c; emailEl.dispatchEvent(new Event('input', { bubbles: true })); }
    emailEl.dispatchEvent(new Event('change', { bubbles: true }));
    await delay(500);
    const nextBtn = document.querySelector('#nextbtn');
    if (nextBtn) nextBtn.click();
    await delay(3000);

    // Step 2: Password
    const passEl = await waitFor('#password');
    passEl.value = '';
    passEl.focus();
    for (const c of password) { passEl.value += c; passEl.dispatchEvent(new Event('input', { bubbles: true })); }
    passEl.dispatchEvent(new Event('change', { bubbles: true }));
    await delay(500);
    const signBtn = document.querySelector('#nextbtn');
    if (signBtn) signBtn.click();

    // Step 3: Wait for redirect
    await new Promise((res) => {
      const t = setTimeout(() => res('timeout'), 20000);
      const i = setInterval(() => {
        if (!location.hostname.includes('accounts.zoho')) { clearInterval(i); clearTimeout(t); res('ok'); }
      }, 500);
    });

    try { await fetch(SERVER + '/done'); } catch {}
    return 'LOGIN_OK';
  } catch (e) {
    try { await fetch(SERVER + '/done'); } catch {}
    return 'LOGIN_ERROR: ' + e.message;
  }
})()`);
  console.log('EVAL_SCRIPT_END');
});

// Auto-close after 60s
setTimeout(() => { server.close(); process.exit(0); }, 60_000);
