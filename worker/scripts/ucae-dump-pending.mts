/**
 * Dumps the raw /empresa/contrata/documentacion/pendiente HTML for inspection.
 */
import "../src/config.js";
import { writeFile } from "node:fs/promises";

const [, , user, pass, idp] = process.argv;
if (!user || !pass || !idp) {
  console.error("Usage: tsx ucae-dump-pending.mts <user> <pass> <idprincipal>");
  process.exit(2);
}

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
  headers.set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
  const res = await fetch(url, { ...init, headers, redirect: init.manual ? "manual" : "follow" });
  jar.ingest(res.headers);
  return res;
}

// Login
const r1 = await req("https://u5.ucae.es/login");
const html1 = await r1.text();
const csrf = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/i.exec(html1)![1]!;
const r2 = await req("https://u5.ucae.es/dologin", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ _csrf: csrf, username: user, password: pass }).toString(),
  manual: true,
});
console.log("Login:", r2.status, r2.headers.get("location"));

// Pending list
const r3 = await req(`https://u5.ucae.es/empresa/contrata/documentacion/pendiente?q=${idp}`);
const html3 = await r3.text();
const out = `discovery/ucae/pending-${idp}.html`;
await writeFile(out, html3, "utf8");
console.log(`Wrote ${html3.length} bytes to ${out}`);
console.log("data-clave count:", (html3.match(/data-clave="/g) || []).length);
console.log("data-ambito count:", (html3.match(/data-ambito="/g) || []).length);
console.log("<tr count:", (html3.match(/<tr\b/g) || []).length);
console.log("\nFirst 200 chars after first <table:");
const tableIdx = html3.indexOf("<table");
console.log(tableIdx >= 0 ? html3.slice(tableIdx, tableIdx + 500).replace(/\s+/g, " ") : "no <table>");

// Permisos list (alternative path)
const r4 = await req(`https://u5.ucae.es/empresa/consulta/permiso/list?q=${idp}`);
const html4 = await r4.text();
console.log("\nPermisos page:");
console.log("tr-permiso count:", (html4.match(/tr-permiso/g) || []).length);
console.log("idpermiso count:", (html4.match(/data-idpermiso=/g) || []).length);
const idpermisos = Array.from(html4.matchAll(/data-idpermiso="([^"]+)"/g)).map(m => m[1]).slice(0, 5);
console.log("first 5 idpermisos:", idpermisos);
