/**
 * populate-codigo-ucae.mts
 *
 * Lee todas las plantillas de Zoho (form Plantilla, report All_Plantilla) y propone un
 * Codigo_UCAE + Bulk_SS_UCAE para cada una basándose en regex sobre Nombre_de_la_plantilla.
 *
 * Uso:
 *   npx tsx worker/scripts/populate-codigo-ucae.mts            # dry-run, imprime plan
 *   npx tsx worker/scripts/populate-codigo-ucae.mts --apply    # aplica los PATCH
 *
 * Mapeo basado en discovery 2026-05-04 (worker/discovery/ucae/.../11-form-structure.json).
 */
import { config } from "dotenv";
import axios from "axios";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(here, "../../.env") });

const {
  ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET,
  ZOHO_REFRESH_TOKEN,
  ZOHO_OWNER_ID,
  ZOHO_APP_LINK_NAME,
} = process.env;
const ACCOUNTS_DOMAIN = process.env.ZOHO_ACCOUNTS_DOMAIN || "accounts.zoho.com";

const APPLY = process.argv.includes("--apply");

interface Mapping {
  /** Regex (case-insensitive) que matchea contra Nombre_de_la_plantilla. */
  pattern: RegExp;
  codigo: string;
  bulkSs?: boolean;
}

// Orden = prioridad. La primera coincidencia gana. Patrones más específicos arriba.
const MAPPINGS: Mapping[] = [
  // SS bulk (auto-clasifica ITA/RNT/IDC/RLC)
  { pattern: /\bRLC\b|recibo[\s-]*liquidaci/i, codigo: "RLC", bulkSs: true },
  { pattern: /\bITA\b|trabajadores?\s+(en\s+)?activo/i, codigo: "ITA", bulkSs: true },
  { pattern: /\bRNT\b|\bTC2\b|relaci[oó]n\s+nominal/i, codigo: "TC2T-ACT", bulkSs: true },
  { pattern: /\bIDC\b|\bTA2\b|alta[\s-]*ss|alta[\s-]*seguridad\s+social/i, codigo: "ESCANTA2", bulkSs: true },
  // Empresa - Laboral
  { pattern: /agencia\s+tributaria|hacienda/i, codigo: "AG TRIBUT" },
  // SS al corriente (orden libre — "al corriente con SS" o "SS al corriente")
  { pattern: /(seguridad\s+social|\bss\b).{0,30}corriente|corriente.{0,30}(seguridad\s+social|\bss\b)/i, codigo: "CERT SS MENSUAL" },
  // Empresa - PRL
  { pattern: /concierto.*prl|concierto.*prevenci/i, codigo: "CERT GBL CONC" },
  { pattern: /recurso\s+preventivo/i, codigo: "ARD11" },
  // Trabajador - PRL
  { pattern: /apto\s+m[eé]dico|reconocimiento\s+m[eé]dico|aptitud\s+m[eé]dica/i, codigo: "L01" },
  { pattern: /altura/i, codigo: "F.ALT.5" },
  { pattern: /art\.?\s*19|formaci[oó]n\s+(b[aá]sica\s+)?prl(?!\s*espec[ií]fica)/i, codigo: "F19MANTENIM" },
  { pattern: /\bEPI\b|equipos?\s+de\s+protecci[oó]n/i, codigo: "EPI" },
  { pattern: /anexo\s*iv|acceso.*trabajadores?|acuse.*recibo.*evaluaci[oó]n.*riesgos.*externas/i, codigo: "anexo IV" },
  // Trabajador - Otros
  { pattern: /listado.*equipos?(\s+de\s+trabajo)?|equipos?\s+de\s+trabajo/i, codigo: "L02" },
];

async function getToken(): Promise<string> {
  const r = await axios.post(`https://${ACCOUNTS_DOMAIN}/oauth/v2/token`, null, {
    params: {
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: "refresh_token",
    },
  });
  return r.data.access_token as string;
}

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as Record<string, string>;
    return o.value || o.display_value || "";
  }
  return String(v);
}

let RESOLVED_REPORT = "Ver_Plantillas";

async function fetchAllPlantillas(token: string): Promise<Record<string, unknown>[]> {
  const headers = { Authorization: `Zoho-oauthtoken ${token}`, Accept: "application/json" };
  // Try report names in order of probability.
  const reportCandidates = ["All_Plantilla", "Plantilla_Report", "All_Plantillas", "Ver_Plantillas"];
  for (const report of reportCandidates) {
    let recs: Record<string, unknown>[] = [];
    let cursor: string | null = null;
    let firstPage = true;
    try {
      while (true) {
        const params: Record<string, unknown> = { limit: 200 };
        if (cursor) params.record_cursor = cursor;
        else params.from = 1;
        const resp = await axios.get(
          `https://creator.zoho.com/creator/v2.1/data/${ZOHO_OWNER_ID}/${ZOHO_APP_LINK_NAME}/report/${report}`,
          { headers, params }
        );
        const data: Record<string, unknown>[] = resp.data.data || [];
        if (firstPage) console.error(`[${report}] first page rows: ${data.length}`);
        firstPage = false;
        if (data.length === 0) break;
        recs = recs.concat(data);
        cursor = (resp.headers["x-zc-record-cursor"] as string) || null;
        if (!cursor || data.length < 200) break;
      }
      if (recs.length > 0) {
        console.error(`Using report: ${report} (total ${recs.length} records)`);
        RESOLVED_REPORT = report;
        return recs;
      }
    } catch (e) {
      const err = e as { response?: { status?: number } };
      console.error(`[${report}] HTTP ${err.response?.status ?? "??"} — trying next`);
    }
  }
  throw new Error("No working report found for Plantilla form");
}

function classify(nombre: string): Mapping | null {
  for (const m of MAPPINGS) if (m.pattern.test(nombre)) return m;
  return null;
}

async function patchPlantilla(token: string, id: string, codigo: string, bulkSs: boolean): Promise<{ ok: boolean; msg: string }> {
  const headers = {
    Authorization: `Zoho-oauthtoken ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const body: Record<string, unknown> = {
    data: {
      Codigo_UCAE: codigo,
      Bulk_SS_UCAE: bulkSs,
    },
  };
  try {
    const resp = await axios.patch(
      `https://creator.zoho.com/creator/v2.1/data/${ZOHO_OWNER_ID}/${ZOHO_APP_LINK_NAME}/report/${RESOLVED_REPORT}/${id}`,
      body,
      { headers, validateStatus: () => true }
    );
    const code = resp.data?.code ?? resp.data?.data?.code;
    return { ok: code === 3000 || resp.status === 200, msg: `code=${code} status=${resp.status} ${JSON.stringify(resp.data?.error || resp.data?.data?.error || "").slice(0, 120)}` };
  } catch (e) {
    const err = e as { message?: string };
    return { ok: false, msg: err.message || "exception" };
  }
}

async function main() {
  if (!ZOHO_CLIENT_ID || !ZOHO_REFRESH_TOKEN) {
    console.error("Missing ZOHO_* env vars — check .env");
    process.exit(2);
  }

  const token = await getToken();
  const recs = await fetchAllPlantillas(token);

  type Plan = { id: string; nombre: string; codigo: string | null; bulkSs: boolean; alreadyHasCodigo: string };
  const plan: Plan[] = recs.map((r) => {
    const nombre = asString(r.Nombre_de_la_plantilla);
    const m = classify(nombre);
    return {
      id: asString(r.ID),
      nombre,
      codigo: m?.codigo ?? null,
      bulkSs: m?.bulkSs ?? false,
      alreadyHasCodigo: asString(r.Codigo_UCAE),
    };
  });

  const matched = plan.filter((p) => p.codigo);
  const unmatched = plan.filter((p) => !p.codigo);

  console.log("\n=== MATCHED PLAN ===");
  for (const p of matched) {
    const skip = p.alreadyHasCodigo === p.codigo;
    console.log(`${skip ? "·" : "→"} ${p.id}  "${p.nombre}"  =>  ${p.codigo}${p.bulkSs ? "  [BULK_SS]" : ""}${skip ? "  (already set, skip)" : ""}`);
  }
  console.log(`\nMatched: ${matched.length} / ${plan.length}`);
  console.log(`Unmatched (no UCAE code proposed): ${unmatched.length}`);
  console.log("\n=== UNMATCHED (review manually) ===");
  for (const p of unmatched.slice(0, 50)) console.log(`  ?  "${p.nombre}"`);
  if (unmatched.length > 50) console.log(`  ... and ${unmatched.length - 50} more`);

  if (!APPLY) {
    console.log("\nDry-run only. Re-run with --apply to PATCH the matched records.");
    return;
  }

  console.log("\n=== APPLYING ===");
  let ok = 0, fail = 0, skipped = 0;
  for (const p of matched) {
    if (p.alreadyHasCodigo === p.codigo) { skipped++; continue; }
    const r = await patchPlantilla(token, p.id, p.codigo!, p.bulkSs);
    console.log(`${r.ok ? "✓" : "✗"} ${p.id} "${p.nombre}" → ${p.codigo}  ${r.ok ? "" : "  " + r.msg}`);
    if (r.ok) ok++; else fail++;
    // light throttle to respect 50 req/min limit
    await new Promise((res) => setTimeout(res, 1300));
  }
  console.log(`\nDone. ok=${ok} fail=${fail} skipped=${skipped}`);
}

main().catch((e: unknown) => {
  const err = e as { response?: { data?: unknown }; message?: string };
  console.error("FATAL:", err.response?.data || err.message);
  process.exit(1);
});
