import { Router } from "express";
import type { Request, Response } from "express";
import { listRecords, getRecord } from "./zoho.js";
import { enqueue, listJobs, getJob } from "./queue.js";
import type { DocumentRef, Job, PlatformCredentials, UploadJobInput } from "./types.js";

// ── Zoho report names — adjust here if needed ────────────────────────────────
const R = {
  clientes:   "All_Nuevo_Cliente",
  docs:       "All_Subir_Documento",
  formas:     "All_Nueva_Plantilla_Env_o_de_Documentaci_n",
  plantillas: "All_Plantilla",
} as const;

export const uiRouter = Router();

// ── HTML helpers ──────────────────────────────────────────────────────────────
function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function badge(text: string, cls: string): string {
  return `<span class="badge ${cls}">${esc(text)}</span>`;
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Upload Worker</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;background:#f0f2f5}
nav{width:190px;background:#0f172a;color:#e2e8f0;padding:20px 14px;flex-shrink:0;display:flex;flex-direction:column;gap:4px}
nav .logo{font-size:13px;font-weight:700;color:#38bdf8;margin-bottom:16px;letter-spacing:.03em}
nav a{color:#94a3b8;text-decoration:none;padding:7px 10px;border-radius:6px;font-size:13px;display:block}
nav a:hover,nav a.active{background:#1e293b;color:#f1f5f9}
main{flex:1;padding:28px;overflow-x:auto;max-width:1200px}
h2{font-size:20px;font-weight:700;color:#0f172a;margin-bottom:18px}
h3{font-size:14px;font-weight:600;color:#374151;margin-bottom:10px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)}
th{background:#f8fafc;padding:10px 14px;text-align:left;font-size:12px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:.04em}
td{padding:9px 14px;font-size:13px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:#fafcff}
.badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em}
.ok,.done{background:#dcfce7;color:#166534}
.fail,.failed{background:#fee2e2;color:#991b1b}
.running{background:#dbeafe;color:#1e40af}
.queued{background:#f1f5f9;color:#475569}
.skipped{background:#fef9c3;color:#854d0e}
.empresa{background:#dbeafe;color:#1e40af}
.trabajador{background:#f3e8ff;color:#6b21a8}
.autonomo{background:#dcfce7;color:#166534}
.bulk{background:#fef3c7;color:#b45309;font-size:10px;margin-left:4px;padding:1px 6px}
.btn{display:inline-flex;align-items:center;gap:5px;padding:8px 16px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:500;text-decoration:none;transition:filter .15s}
.btn:hover{filter:brightness(.92)}
.btn-primary{background:#2563eb;color:#fff}
.btn-ghost{background:#e2e8f0;color:#374151}
.card{background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:18px;margin-bottom:16px}
.meta{font-size:12px;color:#94a3b8;margin-bottom:4px}
.empty{color:#94a3b8;font-style:italic;padding:12px 0;font-size:13px}
pre{background:#0f172a;color:#7ee787;padding:14px;border-radius:8px;font-size:11px;overflow-x:auto;white-space:pre-wrap}
.alert-warn{background:#fffbeb;border:1px solid #fcd34d;color:#78350f;padding:10px 14px;border-radius:8px;margin-bottom:14px;font-size:13px}
.alert-err{background:#fef2f2;border:1px solid #fca5a5;color:#7f1d1d;padding:10px 14px;border-radius:8px;margin-bottom:14px;font-size:13px}
.alert-ok{background:#f0fdf4;border:1px solid #86efac;color:#14532d;padding:10px 14px;border-radius:8px;margin-bottom:14px;font-size:13px}
label{font-size:13px;color:#374151;display:block;margin-bottom:4px;margin-top:12px;font-weight:500}
input[type=text]{padding:7px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;width:260px}
input[type=text]:focus{outline:2px solid #2563eb;border-color:transparent}
code{font-family:ui-monospace,monospace;font-size:12px;background:#f1f5f9;padding:1px 5px;border-radius:4px}
details summary{cursor:pointer;font-size:12px;color:#94a3b8;margin-top:12px;user-select:none}
.kv{display:flex;gap:24px;margin-bottom:16px;flex-wrap:wrap}
.kv-item{background:#f8fafc;padding:10px 16px;border-radius:8px;border:1px solid #e2e8f0}
.kv-label{font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600;letter-spacing:.05em}
.kv-value{font-size:20px;font-weight:700;color:#0f172a;margin-top:2px}
</style>
</head>
<body>
<nav>
  <div class="logo">⚡ Upload Worker</div>
  <a href="/ui">🏠 Dashboard</a>
  <a href="/ui/clientes">🏢 Clientes</a>
  <a href="/ui/jobs">📋 Jobs</a>
  <div style="flex:1"></div>
  <div style="font-size:11px;color:#475569;padding:0 10px">Puerto ${esc(process.env.PORT ?? "8787")}</div>
</nav>
<main>
${body}
</main>
</body>
</html>`;
}

function jobRow(job: Job): string {
  const elapsed = job.finishedAt && job.startedAt
    ? `${((job.finishedAt - job.startedAt) / 1000).toFixed(1)}s`
    : job.startedAt ? "en curso…" : "—";
  const ok = job.results.filter(r => r.status === "ok").length;
  const fail = job.results.filter(r => r.status === "fail").length;
  const skip = job.results.filter(r => r.status === "skipped").length;
  const total = job.input.documentos.length;
  return `<tr>
    <td><a href="/ui/jobs/${esc(job.id)}" style="font-family:ui-monospace,monospace;font-size:12px">${esc(job.id.slice(0, 8))}…</a></td>
    <td>${esc(job.input.clienteNombre)}</td>
    <td>${badge(job.status, job.status)}</td>
    <td style="font-size:12px">
      <span style="color:#16a34a">${ok}✓</span>
      <span style="color:#dc2626;margin-left:6px">${fail}✗</span>
      <span style="color:#94a3b8;margin-left:6px">${skip}⟳</span>
      <span style="color:#94a3b8;margin-left:6px">/ ${total}</span>
    </td>
    <td style="font-size:12px;color:#94a3b8">${new Date(job.createdAt).toLocaleTimeString("es")}</td>
    <td style="font-size:12px;color:#64748b">${elapsed}</td>
  </tr>`;
}

// ── Field extractors (Zoho REST returns URLs and lookups as objects) ───────────
function extractUrl(field: unknown): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null) {
    const f = field as Record<string, unknown>;
    return String(f.value ?? f.url ?? "");
  }
  return String(field);
}

function lookupId(field: unknown): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null) {
    return String((field as Record<string, unknown>).ID ?? "");
  }
  return "";
}

function lookupName(field: unknown): string {
  if (!field) return "";
  if (typeof field === "object" && field !== null) {
    const f = field as Record<string, unknown>;
    return String(f.display_value ?? f.Nombre ?? f.Nombre_de_la_plantilla ?? "");
  }
  return String(field);
}

function hasFile(field: unknown): boolean {
  if (!field) return false;
  if (typeof field === "string") return field !== "" && field !== "0";
  if (typeof field === "object" && field !== null) {
    const f = field as Record<string, unknown>;
    return !!(f.file_name ?? f.fileName ?? f.url);
  }
  return true;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Dashboard
uiRouter.get("/", (_req: Request, res: Response): void => {
  const jobs = listJobs().sort((a, b) => b.createdAt - a.createdAt).slice(0, 30);
  const active = jobs.filter(j => j.status === "running" || j.status === "queued");
  const done = jobs.filter(j => j.status === "done").length;
  const failed = jobs.filter(j => j.status === "failed").length;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(layout("Dashboard", `
    <h2>Dashboard</h2>
    <div class="kv">
      <div class="kv-item"><div class="kv-label">Total jobs</div><div class="kv-value">${jobs.length}</div></div>
      <div class="kv-item"><div class="kv-label">Completados</div><div class="kv-value" style="color:#16a34a">${done}</div></div>
      <div class="kv-item"><div class="kv-label">Fallidos</div><div class="kv-value" style="color:#dc2626">${failed}</div></div>
      <div class="kv-item"><div class="kv-label">En curso</div><div class="kv-value" style="color:#2563eb">${active.length}</div></div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:22px">
      <a class="btn btn-primary" href="/ui/clientes">🏢 Nuevo envío</a>
      <a class="btn btn-ghost" href="/ui/jobs">📋 Ver todos los jobs</a>
    </div>
    ${active.length > 0 ? `<div class="alert-ok">🔄 ${active.length} job(s) activos — recarga en 4s</div>` : ""}
    <h3>Últimos jobs</h3>
    ${jobs.length === 0
      ? `<p class="empty">Sin jobs todavía. <a href="/ui/clientes" style="color:#2563eb">Lanza uno →</a></p>`
      : `<table>
          <tr><th>ID</th><th>Cliente</th><th>Estado</th><th>Resultados</th><th>Hora</th><th>Tiempo</th></tr>
          ${jobs.map(jobRow).join("")}
        </table>`}
    ${active.length > 0 ? `<script>setTimeout(()=>location.reload(),4000)</script>` : ""}
  `));
});

// Clientes list
uiRouter.get("/clientes", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [clientes, todasFormas] = await Promise.all([
      listRecords(R.clientes),
      listRecords(R.formas),
    ]);
    const ucaeFormaIds = new Set(
      todasFormas
        .filter(f => /ucae/i.test(extractUrl(f.Link_de_la_plataforma)))
        .map(f => String(f.ID)),
    );

    const withUcae = clientes.filter(c => {
      const formasField = c.Formas_de_Env_o;
      if (!Array.isArray(formasField)) return false;
      return formasField.some(f => ucaeFormaIds.has(lookupId(f)));
    });

    const lista = withUcae.length > 0 ? withUcae : clientes;
    const filtered = withUcae.length > 0;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(layout("Clientes", `
      <h2>Clientes${filtered ? " con UCAE" : ""}</h2>
      <p class="meta" style="margin-bottom:16px">
        ${lista.length} cliente(s)
        ${!filtered ? " — <span style='color:#f59e0b'>multi-lookup no detectado, mostrando todos</span>" : ""}
      </p>
      <table>
        <tr><th>ID</th><th>Nombre</th><th>Formas UCAE</th><th></th></tr>
        ${lista.map(c => {
          const id = String(c.ID);
          const nombre = lookupName(c) || String(c.Nombre ?? id);
          const formasField = c.Formas_de_Env_o;
          const formasArr = Array.isArray(formasField) ? formasField : [];
          const nUcae = formasArr.filter(f => ucaeFormaIds.has(lookupId(f))).length;
          return `<tr>
            <td><code>${esc(id)}</code></td>
            <td>${esc(nombre)}</td>
            <td>${nUcae > 0 ? badge(`${nUcae} UCAE`, "ok") : badge("—", "queued")}</td>
            <td><a class="btn btn-primary" style="font-size:12px;padding:5px 12px" href="/ui/cliente/${esc(id)}">Ver docs →</a></td>
          </tr>`;
        }).join("")}
      </table>
    `));
  } catch (e) {
    res.send(layout("Error", `<div class="alert-err">Error cargando clientes: ${esc((e as Error).message)}</div>`));
  }
});

// Client detail + launch form
uiRouter.get("/cliente/:id", async (req: Request, res: Response): Promise<void> => {
  const clienteId = String(req.params.id);
  try {
    const clienteRec = await getRecord(R.clientes, clienteId).catch(() => null);
    const clienteNombre = clienteRec
      ? (lookupName(clienteRec) || String(clienteRec.Nombre ?? clienteId))
      : clienteId;

    // Resolve UCAE formas
    let ucaeFormas: Record<string, unknown>[] = [];
    if (clienteRec) {
      const formasField = clienteRec.Formas_de_Env_o;
      if (Array.isArray(formasField) && formasField.length > 0) {
        const fetched = await Promise.all(
          formasField.map(f => getRecord(R.formas, lookupId(f)).catch(() => null)),
        );
        ucaeFormas = fetched.filter(
          f => f && /ucae/i.test(extractUrl((f as Record<string, unknown>).Link_de_la_plataforma)),
        ) as Record<string, unknown>[];
      }
    }
    // Fallback: query all UCAE formas (only if multi-lookup gave nothing)
    if (ucaeFormas.length === 0) {
      const all = await listRecords(R.formas);
      ucaeFormas = all.filter(f => /ucae/i.test(extractUrl(f.Link_de_la_plataforma)));
    }

    // Documentos vigentes del cliente
    const docs = await listRecords(R.docs, `(CLIENTE==${clienteId})`);
    const docsConFile = docs.filter(d => hasFile(d.Documento));

    // Plantilla details (cached)
    const plantCache = new Map<string, Record<string, unknown>>();
    for (const doc of docsConFile) {
      const pid = lookupId(doc.Plantilla);
      if (pid && !plantCache.has(pid)) {
        const p = await getRecord(R.plantillas, pid).catch(() => null);
        if (p) plantCache.set(pid, p);
      }
    }

    // Build preview credentials and docRefs
    const formasCreds: PlatformCredentials[] = ucaeFormas.map(f => ({
      formaEnvioId: String(f.ID),
      url: extractUrl(f.Link_de_la_plataforma),
      usuario: String(f.Usuario ?? ""),
      password: String(f.Contrase_a ?? ""),
      remoteClientId: String(f.IdPrincipal_UCAE ?? f.UCAE_IdPrincipal ?? ""),
    }));

    const docRefs: DocumentRef[] = docsConFile.map(d => {
      const pid = lookupId(d.Plantilla);
      const pRec = plantCache.get(pid);
      const scope: "trabajador" | "empresa" | "autonomo" = lookupId(d.TRABAJADOR)
        ? "trabajador"
        : lookupId(d.EMPRESA) ? "empresa" : "empresa";
      return {
        plantillaId: pid,
        plantillaNombre: pRec
          ? String(pRec.Nombre_de_la_plantilla ?? pRec.display_value ?? lookupName(d.Plantilla) ?? pid)
          : lookupName(d.Plantilla) || pid,
        scope,
        trabajadorId: lookupId(d.TRABAJADOR) || undefined,
        subirDocumentoId: String(d.ID),
        fileFieldName: "Documento",
        fileReportName: "All_Subir_Documento",
        fechaCaducidad: d.Fecha_caducidad_documento ? String(d.Fecha_caducidad_documento) : undefined,
        remoteCodigo: pRec ? String(pRec.Codigo_UCAE ?? "") || undefined : undefined,
        bulkSsUcae: pRec ? (String(pRec.Bulk_SS_UCAE) === "true" || String(pRec.Bulk_SS_UCAE) === "1") : false,
      };
    });

    const missingIdprincipal = formasCreds.some(f => !f.remoteClientId);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(layout(`Cliente: ${clienteNombre}`, `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
        <a href="/ui/clientes" style="color:#94a3b8;font-size:13px">← Clientes</a>
        <h2 style="margin:0">${esc(clienteNombre)}</h2>
      </div>

      <div class="card">
        <h3>Formas de Envío UCAE detectadas (${ucaeFormas.length})</h3>
        ${ucaeFormas.length === 0
          ? `<p class="empty">Sin formas UCAE. Verifica el campo <code>Formas_de_Env_o</code> del cliente en Zoho.</p>`
          : `<table>
              <tr><th>ID</th><th>URL</th><th>Usuario</th><th>IdPrincipal</th></tr>
              ${ucaeFormas.map(f => `<tr>
                <td><code style="font-size:11px">${esc(f.ID)}</code></td>
                <td><code>${esc(extractUrl(f.Link_de_la_plataforma))}</code></td>
                <td>${esc(f.Usuario)}</td>
                <td>${f.IdPrincipal_UCAE ? `<code>${esc(f.IdPrincipal_UCAE)}</code>` : `<span style="color:#f59e0b">⚠ falta</span>`}</td>
              </tr>`).join("")}
            </table>`}
      </div>

      <div class="card">
        <h3>Documentos (${docsConFile.length} con fichero / ${docs.length} total)</h3>
        ${docsConFile.length === 0
          ? `<p class="empty">Sin documentos con fichero adjunto para este cliente.</p>`
          : `<table>
              <tr><th>Modelo</th><th>Ámbito</th><th>Cód. UCAE</th><th>Caducidad</th><th>Flags</th></tr>
              ${docRefs.map(d => `<tr>
                <td>${esc(d.plantillaNombre)}</td>
                <td>${badge(d.scope, d.scope)}</td>
                <td>${d.remoteCodigo ? `<code>${esc(d.remoteCodigo)}</code>` : `<span style="color:#94a3b8">—</span>`}</td>
                <td style="font-size:12px;color:#64748b">${d.fechaCaducidad ? esc(d.fechaCaducidad) : "—"}</td>
                <td>${d.bulkSsUcae ? `<span class="badge bulk">BULK SS</span>` : "—"}</td>
              </tr>`).join("")}
            </table>`}
      </div>

      ${ucaeFormas.length === 0 || docsConFile.length === 0
        ? `<div class="alert-warn">⚠ ${ucaeFormas.length === 0 ? "Sin formas UCAE" : "Sin documentos con fichero"} — no se puede lanzar.</div>`
        : `<div class="card">
            <h3>🚀 Lanzar envío a UCAE</h3>
            ${missingIdprincipal
              ? `<div class="alert-warn" style="margin-bottom:12px">⚠ Faltan <code>IdPrincipal_UCAE</code> en ${formasCreds.filter(f => !f.remoteClientId).length} forma(s). Introdúcelo manualmente:</div>`
              : ""}
            <form method="POST" action="/ui/launch">
              <input type="hidden" name="clienteId" value="${esc(clienteId)}">
              <input type="hidden" name="clienteNombre" value="${esc(clienteNombre)}">
              <input type="hidden" name="payload" value="${esc(JSON.stringify({ formasEnvio: formasCreds, documentos: docRefs }))}">
              ${formasCreds.map((f, i) => !f.remoteClientId ? `
              <label>IdPrincipal UCAE · <code>${esc(f.usuario)}</code> (${esc(f.url)})</label>
              <input type="text" name="idprincipal_${i}" placeholder="ej: 22852" autocomplete="off">
              ` : "").join("")}
              <div style="margin-top:16px;display:flex;align-items:center;gap:14px">
                <button type="submit" class="btn btn-primary">🚀 Lanzar job</button>
                <span style="font-size:12px;color:#94a3b8">${docsConFile.length} docs × ${ucaeFormas.length} forma(s)</span>
              </div>
            </form>
            <details>
              <summary>Ver JSON del payload</summary>
              <pre>${esc(JSON.stringify({ formasEnvio: formasCreds, documentos: docRefs }, null, 2))}</pre>
            </details>
          </div>`}
    `));
  } catch (e) {
    res.send(layout("Error", `<div class="alert-err">Error cargando cliente <code>${esc(clienteId)}</code>: ${esc((e as Error).message)}</div>`));
  }
});

// POST /ui/launch → enqueue + redirect to job page
uiRouter.post("/launch", (req: Request, res: Response): void => {
  const body = req.body as Record<string, string>;
  const { clienteId, clienteNombre, payload } = body;

  if (!clienteId || !payload) {
    res.send(layout("Error", `<div class="alert-err">Payload inválido — faltan campos.</div>`));
    return;
  }

  let parsed: { formasEnvio: PlatformCredentials[]; documentos: DocumentRef[] };
  try {
    parsed = JSON.parse(payload) as typeof parsed;
  } catch {
    res.send(layout("Error", `<div class="alert-err">JSON payload inválido.</div>`));
    return;
  }

  // Apply manual idprincipal overrides from form inputs
  parsed.formasEnvio.forEach((f, i) => {
    const override = body[`idprincipal_${i}`]?.trim();
    if (override) f.remoteClientId = override;
  });

  const input: UploadJobInput = {
    clienteId,
    clienteNombre: clienteNombre || clienteId,
    formasEnvio: parsed.formasEnvio,
    documentos: parsed.documentos,
  };

  const job = enqueue(input);
  res.redirect(`/ui/jobs/${job.id}`);
});

// Job detail
uiRouter.get("/jobs/:id", (req: Request, res: Response): void => {
  const job = getJob(String(req.params.id));
  if (!job) {
    res.send(layout("Job no encontrado", `<div class="alert-err">Job <code>${esc(req.params.id)}</code> no encontrado (se pierde al reiniciar el worker).</div>`));
    return;
  }

  const isActive = job.status === "queued" || job.status === "running";
  const elapsed = job.finishedAt && job.startedAt
    ? `${((job.finishedAt - job.startedAt) / 1000).toFixed(1)}s`
    : "—";
  const ok = job.results.filter(r => r.status === "ok").length;
  const fail = job.results.filter(r => r.status === "fail").length;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(layout(`Job ${job.id.slice(0, 8)}`, `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
      <a href="/ui/jobs" style="color:#94a3b8;font-size:13px">← Jobs</a>
      <h2 style="margin:0">Job <code style="font-size:18px">${esc(job.id.slice(0, 8))}…</code> ${badge(job.status, job.status)}</h2>
    </div>

    <div class="kv" style="margin-bottom:16px">
      <div class="kv-item"><div class="kv-label">Cliente</div><div class="kv-value" style="font-size:16px">${esc(job.input.clienteNombre)}</div></div>
      <div class="kv-item"><div class="kv-label">OK</div><div class="kv-value" style="color:#16a34a">${ok}</div></div>
      <div class="kv-item"><div class="kv-label">Fail</div><div class="kv-value" style="color:#dc2626">${fail}</div></div>
      <div class="kv-item"><div class="kv-label">Total docs</div><div class="kv-value">${job.input.documentos.length}</div></div>
      <div class="kv-item"><div class="kv-label">Tiempo</div><div class="kv-value" style="font-size:16px">${elapsed}</div></div>
    </div>

    ${job.error ? `<div class="alert-err">Error fatal: ${esc(job.error)}</div>` : ""}
    ${isActive ? `<div class="alert-ok">🔄 Job en curso — recarga en 3s</div>` : ""}

    <div class="card">
      <h3>Resultados (${job.results.length} / ${job.input.documentos.length} docs)</h3>
      ${job.results.length === 0
        ? `<p class="empty">Sin resultados aún…</p>`
        : `<table>
            <tr><th>Estado</th><th>Plantilla</th><th>Doc ID</th><th>Remote ID</th><th>Mensaje</th></tr>
            ${job.results.map(r => {
              const docRef = job.input.documentos.find(d => d.subirDocumentoId === r.subirDocumentoId);
              return `<tr>
                <td>${badge(r.status, r.status)}</td>
                <td style="font-size:12px">${esc(docRef?.plantillaNombre ?? r.plantillaId)}</td>
                <td><code>${esc(r.subirDocumentoId)}</code></td>
                <td style="font-size:12px">${r.remoteId ? `<code>${esc(r.remoteId)}</code>` : "—"}</td>
                <td style="font-size:12px;max-width:280px;word-break:break-word;color:#64748b">${esc(r.message ?? "")}</td>
              </tr>`;
            }).join("")}
          </table>`}
    </div>

    <details>
      <summary>Input completo (JSON)</summary>
      <pre>${esc(JSON.stringify(job.input, null, 2))}</pre>
    </details>

    ${isActive ? `<script>setTimeout(()=>location.reload(),3000)</script>` : ""}
  `));
});

// Jobs list
uiRouter.get("/jobs", (_req: Request, res: Response): void => {
  const jobs = listJobs().sort((a, b) => b.createdAt - a.createdAt);
  const hasActive = jobs.some(j => j.status === "queued" || j.status === "running");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(layout("Jobs", `
    <h2>Todos los jobs (${jobs.length})</h2>
    ${hasActive ? `<div class="alert-ok" style="margin-bottom:14px">🔄 Jobs activos — recarga en 4s</div>` : ""}
    ${jobs.length === 0
      ? `<p class="empty">Sin jobs. <a href="/ui/clientes" style="color:#2563eb">Lanza uno →</a></p>`
      : `<table>
          <tr><th>ID</th><th>Cliente</th><th>Estado</th><th>Resultados</th><th>Hora</th><th>Tiempo</th></tr>
          ${jobs.map(jobRow).join("")}
        </table>`}
    ${hasActive ? `<script>setTimeout(()=>location.reload(),4000)</script>` : ""}
  `));
});
