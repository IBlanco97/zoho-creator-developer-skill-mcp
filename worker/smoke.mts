/**
 * Smoke test:
 *  1. carga .env.smoke (creds dummy)
 *  2. arranca worker
 *  3. golpea /health, encola un job que matchea adapter "generic"
 *  4. polea /jobs/:id hasta done|failed
 *  5. cierra
 *
 * Run: npx tsx smoke.mts
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.smoke" });

const { default: axios } = await import("axios");
const PORT = process.env.PORT ?? "8788";
const SECRET = process.env.WORKER_SHARED_SECRET!;
const BASE = `http://127.0.0.1:${PORT}`;

await import("./src/index.js");

await new Promise((r) => setTimeout(r, 800));

console.log("→ GET /health");
console.log(JSON.stringify((await axios.get(`${BASE}/health`)).data));

console.log("\n→ POST /jobs (cliente fake, plataforma desconocida → adapter generic)");
const job = await axios.post(
  `${BASE}/jobs`,
  {
    clienteId: "999999",
    clienteNombre: "ACME SMOKE",
    formasEnvio: [
      {
        formaEnvioId: "FAKE-FORMA-1",
        url: "https://unknown-platform.example.com/login",
        usuario: "u",
        password: "p",
      },
    ],
    documentos: [
      {
        plantillaId: "FAKE-PLANTILLA-1",
        plantillaNombre: "DOC SMOKE",
        scope: "trabajador",
        subirDocumentoId: "FAKE-DOC-1",
        fileFieldName: "Documento",
        fileReportName: "All_Subir_Documento",
      },
    ],
  },
  { headers: { "x-worker-secret": SECRET } },
);
const jobId = job.data.job_id;
console.log("queued:", jobId);

// polea
for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 500));
  const s = await axios.get(`${BASE}/jobs/${jobId}`, {
    headers: { "x-worker-secret": SECRET },
  });
  console.log(`status[${i}]:`, s.data.status, JSON.stringify(s.data.results));
  if (s.data.status === "done" || s.data.status === "failed") {
    process.exit(0);
  }
}
console.log("TIMEOUT");
process.exit(1);
