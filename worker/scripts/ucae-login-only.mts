/**
 * Tests UCAE adapter login + listPending end-to-end via the actual adapter
 * code (not inline replication). Read-only: no upload.
 *
 * Usage:
 *   npx tsx worker/scripts/ucae-login-only.mts <user> <pass> <idprincipal>
 */
import "../src/config.js"; // forces env validation; pass dummy values via env
import { logger } from "../src/logger.js";

const [, , user, pass, idp] = process.argv;
if (!user || !pass || !idp) {
  console.error("Usage: tsx ucae-login-only.mts <user> <pass> <idprincipal>");
  process.exit(2);
}

// Re-implement minimal slice that exercises adapter path: import and use the
// internal session class. We export it for testing.
const mod = await import("../src/adapters/ucae.js") as { ucaeAdapter: { name: string; match: (c: { url: string }) => boolean; upload: (a: unknown) => Promise<unknown[]> } };

const fakeCreds = {
  formaEnvioId: "test",
  url: "https://u5.ucae.es/UCAE",
  usuario: user,
  password: pass,
  remoteClientId: idp,
};

logger.info({ adapter: mod.ucaeAdapter.name }, "running adapter with empty docs (login + list only)");
const results = await mod.ucaeAdapter.upload({ creds: fakeCreds, documentos: [] });
console.log("results count:", results.length); // Should be 0 since no docs
console.log("If no exception: login + listPending succeeded ✓");
