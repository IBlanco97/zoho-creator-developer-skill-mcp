import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(here, "../../.env") });

const usuario = process.argv[2] || process.env.UCAE_USERNAME;
const password = process.argv[3] || process.env.UCAE_PASSWORD;
if (!usuario || !password) {
  console.error("Uso: probe-ucae-login.mts <usuario> <password> (o UCAE_USERNAME/UCAE_PASSWORD en .env)");
  process.exit(1);
}

console.log("Testing UCAE login");
console.log("user:", JSON.stringify(usuario), "len:", usuario.length);
console.log("pass: [REDACTED] len:", password.length);

class Jar {
  c = new Map<string, string>();
  header() { return Array.from(this.c.entries()).map(([k, v]) => `${k}=${v}`).join("; "); }
  ingest(h: Headers) {
    for (const sc of h.getSetCookie?.() ?? []) {
      const f = sc.split(";", 1)[0]!;
      const eq = f.indexOf("=");
      if (eq > 0) this.c.set(f.slice(0, eq).trim(), f.slice(eq + 1).trim());
    }
  }
}

const jar = new Jar();
async function req(url: string, init: RequestInit & { manual?: boolean } = {}) {
  const headers = new Headers(init.headers);
  if (jar.c.size) headers.set("cookie", jar.header());
  headers.set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36");
  const res = await fetch(url, { ...init, headers, redirect: init.manual ? "manual" : "follow" });
  jar.ingest(res.headers);
  return res;
}

// Step 1: GET login page (capture session cookie + any CSRF)
const r1 = await req("https://u5.ucae.es/login");
console.log("\nGET /login status:", r1.status, "cookies after:", jar.c.size);
const html1 = await r1.text();
const tokenMatch = /<input[^>]*name="(_token|csrf_token|_csrf|XSRF-TOKEN|authenticity_token)[^"]*"[^>]*value="([^"]+)"/i.exec(html1);
console.log("CSRF found:", tokenMatch ? `${tokenMatch[1]}=${tokenMatch[2].slice(0,30)}...` : "NONE");
const formAction = /id="flogin"[^>]*action="([^"]+)"/i.exec(html1);
console.log("form action:", formAction?.[1] || "(default /dologin)");

// Step 2: POST /dologin
const body = new URLSearchParams({ username: usuario, password });
const r2 = await req("https://u5.ucae.es/dologin", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: body.toString(),
  manual: true,
});
console.log("\nPOST /dologin status:", r2.status, "location:", r2.headers.get("location"), "cookies:", jar.c.size);
console.log("cookies:", Array.from(jar.c.keys()).join(", "));
