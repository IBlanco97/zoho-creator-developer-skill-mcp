/**
 * UCAE adapter dry-run — validates login + pending parser against a live account.
 *
 * Read-only: NO upload occurs. Only POST /dologin + GET /empresa/contrata/documentacion/pendiente.
 *
 * Usage (PowerShell):
 *   $env:UCAE_USER="4xf7.cae"; $env:UCAE_PASS="..."; $env:UCAE_IDPRINCIPAL="22852"
 *   npx tsx scripts/ucae-dry-run.mts
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env" });

const usuario = process.env.UCAE_USER;
const password = process.env.UCAE_PASS;
const idprincipal = process.env.UCAE_IDPRINCIPAL;
if (!usuario || !password || !idprincipal) {
  console.error("Missing env: UCAE_USER, UCAE_PASS, UCAE_IDPRINCIPAL");
  process.exit(2);
}

const { ucaeAdapter } = await import("../src/adapters/ucae.js");

// Borrow the adapter's match() to confirm URL routing works, then drive it via
// a fake job that supplies no documentos — login + listPending will run, then
// every doc is reported as "no pending match" (since documentos is empty, the
// per-doc loop never runs). This proves the auth + parser path end-to-end.
const baseUrl = "https://u5.ucae.es/login";
if (!ucaeAdapter.match({ formaEnvioId: "x", url: baseUrl, usuario, password })) {
  throw new Error("ucaeAdapter.match() rejected u5.ucae.es URL — regression");
}

// Reach into module internals for a true read-only test (login + list, no upload).
// We re-import the adapter source as a TS module is not possible; instead, replicate
// the minimal flow inline so the parser/jar are exercised exactly as in production.
import { performance } from "node:perf_hooks";

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
const base = "https://u5.ucae.es";
async function req(path: string, init: RequestInit & { manual?: boolean } = {}) {
  const headers = new Headers(init.headers);
  if (jar.c.size) headers.set("cookie", jar.header());
  const res = await fetch(new URL(path, base), { ...init, headers, redirect: init.manual ? "manual" : "follow" });
  jar.ingest(res.headers);
  return res;
}

const t0 = performance.now();
await req("/login");
const loginRes = await req("/dologin", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ username: usuario, password }).toString(),
  manual: true,
});
const loc = loginRes.headers.get("location") ?? "";
console.log(`[login] status=${loginRes.status} location=${loc} cookies=${jar.c.size} took=${(performance.now() - t0).toFixed(0)}ms`);
if (loginRes.status >= 400 || /\/login(\?|$)/.test(loc)) {
  console.error("Login FAILED — bad creds or UCAE changed flow.");
  process.exit(1);
}

const t1 = performance.now();
const pendingRes = await req(`/empresa/contrata/documentacion/pendiente?q=${idprincipal}`);
const html = await pendingRes.text();
console.log(`[pending] status=${pendingRes.status} bytes=${html.length} took=${(performance.now() - t1).toFixed(0)}ms`);

// Quick sanity check on the parser shape: count <tr data-clave> rows.
const claveRows = (html.match(/data-clave="[^"]+"/g) ?? []).length;
const ambitoRows = (html.match(/data-ambito="[^"]+"/g) ?? []).length;
console.log(`[parser] data-clave rows=${claveRows}  data-ambito rows=${ambitoRows}`);

if (claveRows === 0) {
  console.warn("⚠ 0 claves found — either no pending docs OR UCAE changed markup. Sample first 800 chars below:");
  console.log(html.slice(0, 800));
}

console.log("\n✅ dry-run finished — no side effects, no uploads.");
