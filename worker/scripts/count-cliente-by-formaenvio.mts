/**
 * count-cliente-by-formaenvio.mts
 *
 * Para cada Forma de Envío UCAE, lista los clientes que la referencian via
 * Nuevo_Cliente.Formas_de_Env_o. Output: ¿modelo compartido (1 Forma → N clientes)
 * o modelo 1:1?
 */
import { config } from "dotenv";
import axios from "axios";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(here, "../../.env") });

const ACCOUNTS_DOMAIN = process.env.ZOHO_ACCOUNTS_DOMAIN || "accounts.zoho.com";

async function getToken(): Promise<string> {
  const r = await axios.post(`https://${ACCOUNTS_DOMAIN}/oauth/v2/token`, null, {
    params: {
      refresh_token: process.env.ZOHO_REFRESH_TOKEN,
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
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

const UCAE_FORMA_IDS = new Set([
  "4790826000000845669", // 4xf7.cae
  "4790826000000845345", // 4xf7.cae
  "4790826000000833342", // sicma21.rrhh
]);

async function main() {
  const token = await getToken();
  const headers = { Authorization: `Zoho-oauthtoken ${token}`, Accept: "application/json" };

  // List all reports first (metadata API), then try Cliente reports.
  try {
    const meta = await axios.get(
      `https://creator.zoho.com/creator/v2.1/meta/${process.env.ZOHO_OWNER_ID}/${process.env.ZOHO_APP_LINK_NAME}/reports`,
      { headers }
    );
    const reports = (meta.data.reports || []) as Array<Record<string, string>>;
    const clienteReports = reports.filter((r) => /cliente/i.test(r.link_name || "") || /cliente/i.test(r.display_name || ""));
    console.error("Cliente-related reports:");
    for (const r of clienteReports) console.error(`  ${r.link_name}  (${r.display_name}, base form: ${r.base_form || "?"})`);
  } catch (e) {
    console.error("Meta /reports failed:", (e as Error).message);
  }
  const reportCandidates = ["All_Cliente_Mantenimiento", "Mantenimiento_Clientes", "Mantenimiento_Cliente", "Clientes", "All_Nuevo_Cliente", "Nuevo_Cliente_Report", "All_Cliente", "Cliente_Report", "Ver_Clientes"];
  let workingReport: string | null = null;
  let recs: Record<string, unknown>[] = [];

  for (const report of reportCandidates) {
    try {
      let cursor: string | null = null;
      let firstPage = true;
      let pageRecs: Record<string, unknown>[] = [];
      while (true) {
        const params: Record<string, unknown> = { limit: 200 };
        if (cursor) params.record_cursor = cursor;
        else params.from = 1;
        const resp = await axios.get(
          `https://creator.zoho.com/creator/v2.1/data/${process.env.ZOHO_OWNER_ID}/${process.env.ZOHO_APP_LINK_NAME}/report/${report}`,
          { headers, params }
        );
        const data: Record<string, unknown>[] = resp.data.data || [];
        if (firstPage) console.error(`[${report}] first page rows: ${data.length}`);
        firstPage = false;
        if (data.length === 0) break;
        pageRecs = pageRecs.concat(data);
        cursor = (resp.headers["x-zc-record-cursor"] as string) || null;
        if (!cursor || data.length < 200) break;
      }
      if (pageRecs.length > 0) {
        workingReport = report;
        recs = pageRecs;
        break;
      }
    } catch (e) {
      const err = e as { response?: { status?: number } };
      console.error(`[${report}] HTTP ${err.response?.status ?? "??"}`);
    }
  }

  if (!workingReport) throw new Error("No working Cliente report found");
  console.error(`Using report: ${workingReport} (total ${recs.length} clientes)\n`);

  // Sample first record to find the formas-envio field name
  const sample = recs[0]!;
  console.error(`Sample record keys: ${Object.keys(sample).join(", ")}\n`);
  const fieldKeys = Object.keys(sample).filter((k) => /forma|envio|plataforma/i.test(k));
  console.error(`Possible forma-envio fields on Cliente: ${fieldKeys.join(", ")}\n`);

  const formaCounts = new Map<string, { ucae: boolean; count: number; clienteIds: string[]; clienteNames: string[] }>();
  let clientesWithUcae = 0;

  for (const c of recs) {
    const cliId = asString(c.ID);
    const cliName = asString(c.Nombre_de_Cuenta) || asString(c.Nombre_Cliente) || asString(c.Cliente) || cliId;
    // Forma_de_Env_o is a multi-lookup → array of IDs (may be string ids or { display_value, ID })
    const raw = c.Formas_de_Env_o;
    if (!Array.isArray(raw)) continue;
    let cliHasUcae = false;
    for (const fEntry of raw) {
      let fId = "";
      if (typeof fEntry === "string") fId = fEntry;
      else if (fEntry && typeof fEntry === "object") fId = (fEntry as Record<string, string>).ID || (fEntry as Record<string, string>).id || "";
      if (!fId) continue;
      const isUcae = UCAE_FORMA_IDS.has(fId);
      if (isUcae) cliHasUcae = true;
      const cur = formaCounts.get(fId) || { ucae: isUcae, count: 0, clienteIds: [], clienteNames: [] };
      cur.count++;
      cur.clienteIds.push(cliId);
      cur.clienteNames.push(cliName);
      formaCounts.set(fId, cur);
    }
    if (cliHasUcae) clientesWithUcae++;
  }

  console.log(`Clientes totales: ${recs.length}`);
  console.log(`Clientes con AL MENOS UNA Forma_de_Envío UCAE: ${clientesWithUcae}\n`);

  console.log("=== Formas UCAE → Clientes que la referencian ===");
  for (const fId of UCAE_FORMA_IDS) {
    const info = formaCounts.get(fId);
    if (!info) {
      console.log(`  ${fId}: 0 clientes (huérfana — nadie la referencia)`);
      continue;
    }
    console.log(`  ${fId}: ${info.count} cliente${info.count === 1 ? "" : "s"}`);
    info.clienteNames.slice(0, 30).forEach((n, i) => console.log(`    - [${info.clienteIds[i]}] ${n}`));
    if (info.clienteNames.length > 30) console.log(`    ... y ${info.clienteNames.length - 30} más`);
  }
}

main().catch((e: unknown) => {
  const err = e as { response?: { data?: unknown }; message?: string };
  console.error("FATAL:", err.response?.data || err.message);
  process.exit(1);
});
