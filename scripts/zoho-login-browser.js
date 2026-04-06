/**
 * Browser-side login script for Zoho accounts.
 *
 * Executed via Playwright MCP `browser_evaluate`.
 * Fetches credentials from the local zoho-login-server,
 * then fills the multi-step Zoho login form.
 *
 * Usage (from browser_evaluate):
 *   Replace PORT with the actual port from zoho-login-server.
 *
 *   const PORT = <port>;
 *   <paste this script>
 *
 * The script handles:
 *   Step 1: Email input → click Next
 *   Step 2: Password input → click Sign In
 *   Step 3: Wait for redirect (login complete)
 *   Step 4: Signal the server to shut down
 */

async function zohoLogin(port) {
  const SERVER = `http://127.0.0.1:${port}`;

  // Helper: wait for an element to appear in DOM
  function waitFor(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el && el.offsetParent !== null) return resolve(el);

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el && el.offsetParent !== null) {
          observer.disconnect();
          clearTimeout(timer);
          resolve(el);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });

      const timer = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for ${selector}`));
      }, timeout);
    });
  }

  // Helper: small delay
  const delay = ms => new Promise(r => setTimeout(r, ms));

  try {
    // Fetch credentials from local server
    const resp = await fetch(`${SERVER}/credentials`);
    const { email, password } = await resp.json();

    // Step 1: Fill email
    const emailInput = await waitFor('#login_id');
    emailInput.value = '';
    emailInput.focus();
    // Simulate real typing for Zoho's event listeners
    for (const ch of email) {
      emailInput.value += ch;
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    await delay(300);

    // Click "Next" button
    const nextBtn = document.querySelector('#nextbtn');
    if (nextBtn) nextBtn.click();
    await delay(2000);

    // Step 2: Fill password
    const passInput = await waitFor('#password');
    passInput.value = '';
    passInput.focus();
    for (const ch of password) {
      passInput.value += ch;
      passInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    passInput.dispatchEvent(new Event('change', { bubbles: true }));
    await delay(300);

    // Click "Sign In" button
    const signInBtn = document.querySelector('#nextbtn');
    if (signInBtn) signInBtn.click();

    // Step 3: Wait for navigation away from login page
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve('timeout-ok'), 20000);
      const interval = setInterval(() => {
        if (!window.location.hostname.includes('accounts.zoho')) {
          clearInterval(interval);
          clearTimeout(timer);
          resolve('redirected');
        }
      }, 500);
    });

    // Step 4: Tell the server to shut down
    try { await fetch(`${SERVER}/done`); } catch {}

    return 'LOGIN_OK';
  } catch (err) {
    // Try to shut down server even on error
    try { await fetch(`${SERVER}/done`); } catch {}
    return `LOGIN_ERROR: ${err.message}`;
  }
}
