/**
 * fetch-platform-creds.mts
 *
 * Versión generalizada de fetch-ctaima-creds.mts.
 * Lee del Zoho los registros de Nueva_Plantilla_Env_o_de_Documentaci_n
 * cuyo Link_de_la_plataforma matchea un pattern (case-insensitive regex en
 * el dominio o body de la URL) y tienen credenciales.
 *
 * NO PERSISTE las credenciales en disco — sólo las imprime.
 *
 * Uso:
 *   npx tsx worker/scripts/fetch-platform-creds.mts dokify
 *   npx tsx worker/scripts/fetch-platform-creds.mts ucae
 *   npx tsx worker/scripts/fetch-platform-creds.mts "ecoordina|e-coordina"
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

async function getToken() {
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
  if (typeof v === "object")
    return (v as Record<string, string>).value || (v as Record<string, string>).url || "";
  return String(v);
}

// Prefiere `url` sobre `value` para campos URL — `url` lleva protocolo (https://...).
function asUrl(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as Record<string, string>;
    return o.url || o.value || "";
  }
  return String(v);
}

async function main() {
  const pattern = process.argv[2];
  if (!pattern) {
    console.error("Usage: npx tsx fetch-platform-creds.mts <pattern>");
    console.error("Example: npx tsx fetch-platform-creds.mts dokify");
    process.exit(1);
  }
  const re = new RegExp(pattern, "i");

  const token = await getToken();
  const headers = { Authorization: `Zoho-oauthtoken ${token}`, Accept: "application/json" };

  let recs: Record<string, unknown>[] = [];
  let cursor: string | null = null;
  while (true) {
    const params: Record<string, unknown> = { limit: 200 };
    if (cursor) params.record_cursor = cursor;
    else params.from = 1;
    const resp = await axios.get(
      `https://creator.zoho.com/creator/v2.1/data/${ZOHO_OWNER_ID}/${ZOHO_APP_LINK_NAME}/report/Ver_Plantillas_Env_o`,
      { headers, params }
    );
    const data: Record<string, unknown>[] = resp.data.data || [];
    if (data.length === 0) break;
    recs = recs.concat(data);
    cursor = (resp.headers["x-zc-record-cursor"] as string) || null;
    if (!cursor || data.length < 200) break;
  }

  const matches = recs.filter((r) => {
    const linkRaw = asUrl(r.Link_de_la_plataforma) + " " + asString(r.Link_de_la_plataforma);
    const tipo = asString(r.Forma_de_env_o1).toLowerCase();
    return tipo.includes("plataforma") && re.test(linkRaw);
  });

  console.error(`[${pattern}] forma-envio records found: ${matches.length}`);
  const usable = matches.filter((r) => {
    const url = asUrl(r.Link_de_la_plataforma);
    return asString(r.Usuario).trim() && asString(r.Contrase_a).trim() && /^https?:\/\//i.test(url);
  });
  console.error(`With credentials + valid URL: ${usable.length}`);

  const out = usable.map((r) => ({
    formaEnvioId: asString(r.ID),
    nombre: asString(r.Nombre_de_Plantilla_Env_o),
    url: asUrl(r.Link_de_la_plataforma),
    usuario: asString(r.Usuario),
    password: asString(r.Contrase_a),
    mailEnvio: asString(r.Mail_Env_o),
  }));
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e: unknown) => {
  const err = e as { response?: { data?: unknown }; message?: string };
  console.error("FATAL:", err.response?.data || err.message);
  process.exit(1);
});
