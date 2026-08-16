/**
 * populate-idprincipal-ucae.mts
 *
 * Patcha el campo IdPrincipal_UCAE en records concretos del form
 * Nueva_Plantilla_Env_o_de_Documentaci_n. Mapping definido inline (basado en
 * discovery 2026-05-04 + count-cliente-by-formaenvio.mts).
 *
 * Uso:
 *   npx tsx worker/scripts/populate-idprincipal-ucae.mts            # dry-run
 *   npx tsx worker/scripts/populate-idprincipal-ucae.mts --apply    # aplica
 */
import { config } from "dotenv";
import axios from "axios";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(here, "../../.env") });

const APPLY = process.argv.includes("--apply");
const ACCOUNTS_DOMAIN = process.env.ZOHO_ACCOUNTS_DOMAIN || "accounts.zoho.com";

interface Mapping {
  formaEnvioId: string;
  cliente: string;
  ucaeUser: string;
  idprincipal: string | null; // null = pendiente de capturar manualmente
}

const MAPPINGS: Mapping[] = [
  { formaEnvioId: "4790826000000845669", cliente: "LUCTA, S.A.", ucaeUser: "4xf7.cae", idprincipal: "22852" },
  { formaEnvioId: "4790826000000845345", cliente: "CORPORACIÓ ALIMENTÀRIA GUISSONA, SA", ucaeUser: "4xf7.cae", idprincipal: "30834" },
  { formaEnvioId: "4790826000000833342", cliente: "AC MARCA (CEYS, S.A.) -BIGUES I RIELLS-", ucaeUser: "sicma21.rrhh", idprincipal: "26974" },
];

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

async function patch(token: string, formaId: string, idprincipal: string): Promise<{ ok: boolean; msg: string }> {
  const headers = {
    Authorization: `Zoho-oauthtoken ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const body = { data: { IdPrincipal_UCAE: idprincipal } };
  const resp = await axios.patch(
    `https://creator.zoho.com/creator/v2.1/data/${process.env.ZOHO_OWNER_ID}/${process.env.ZOHO_APP_LINK_NAME}/report/Ver_Plantillas_Env_o/${formaId}`,
    body,
    { headers, validateStatus: () => true }
  );
  const code = resp.data?.code ?? resp.data?.data?.code;
  return {
    ok: code === 3000 || resp.status === 200,
    msg: `code=${code} status=${resp.status} ${JSON.stringify(resp.data?.error || resp.data?.data?.error || "").slice(0, 120)}`,
  };
}

async function main() {
  console.log("=== PLAN ===");
  for (const m of MAPPINGS) {
    if (m.idprincipal) {
      console.log(`→ ${m.formaEnvioId}  "${m.cliente}"  (user ${m.ucaeUser})  =>  IdPrincipal_UCAE = ${m.idprincipal}`);
    } else {
      console.log(`?  ${m.formaEnvioId}  "${m.cliente}"  (user ${m.ucaeUser})  =>  PENDIENTE de capturar idprincipal en UCAE`);
    }
  }

  if (!APPLY) {
    console.log("\nDry-run only. Re-run with --apply.");
    return;
  }

  const token = await getToken();
  console.log("\n=== APPLYING ===");
  let ok = 0, fail = 0, skipped = 0;
  for (const m of MAPPINGS) {
    if (!m.idprincipal) { skipped++; console.log(`· ${m.formaEnvioId}  ${m.cliente}  — skipped (no idprincipal)`); continue; }
    const r = await patch(token, m.formaEnvioId, m.idprincipal);
    console.log(`${r.ok ? "✓" : "✗"} ${m.formaEnvioId}  ${m.cliente}  → ${m.idprincipal}  ${r.ok ? "" : r.msg}`);
    if (r.ok) ok++; else fail++;
    await new Promise((res) => setTimeout(res, 1300));
  }
  console.log(`\nDone. ok=${ok} fail=${fail} skipped=${skipped}`);
}

main().catch((e: unknown) => {
  const err = e as { response?: { data?: unknown }; message?: string };
  console.error("FATAL:", err.response?.data || err.message);
  process.exit(1);
});
