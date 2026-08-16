/**
 * fetch-ctaima-creds.mts
 *
 * Lee del Zoho los registros de Nueva_Plantilla_Env_o_de_Documentaci_n
 * cuyo Link_de_la_plataforma apunta a CTAIMA y tienen credenciales.
 * NO PERSISTE las credenciales en disco — sólo las imprime para que el
 * operador las pase al discover-ctaima.mts via stdin o argv.
 *
 * Uso:
 *   npx tsx worker/scripts/fetch-ctaima-creds.mts
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
  if (typeof v === "object") return (v as Record<string, string>).value || (v as Record<string, string>).url || "";
  return String(v);
}

async function main() {
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

  const ctaima = recs.filter((r) => {
    const linkRaw = JSON.stringify(r.Link_de_la_plataforma || "").toLowerCase();
    const tipo = asString(r.Forma_de_env_o1).toLowerCase();
    return tipo.includes("plataforma") && /ctaima|ctaimacae/.test(linkRaw);
  });

  console.error(`CTAIMA forma-envio records found: ${ctaima.length}`);
  const usable = ctaima.filter((r) => {
    const url = asString(r.Link_de_la_plataforma);
    return asString(r.Usuario).trim() && asString(r.Contrase_a).trim() && /^https?:\/\//i.test(url);
  });
  console.error(`With credentials + valid URL: ${usable.length}`);

  // Print as JSON to stdout so operator can pipe/select
  const out = usable.map((r) => ({
    formaEnvioId: asString(r.ID),
    nombre: asString(r.Nombre_de_Plantilla_Env_o),
    url: asString(r.Link_de_la_plataforma),
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
