/**
 * debug-platform-records.mts — imprime los registros raw de un pattern
 * para entender por qué el filtro no encuentra credenciales.
 */
import { config } from "dotenv";
import axios from "axios";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(here, "../../.env") });

const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_OWNER_ID, ZOHO_APP_LINK_NAME } = process.env;
const ACCOUNTS_DOMAIN = process.env.ZOHO_ACCOUNTS_DOMAIN || "accounts.zoho.com";

async function getToken() {
  const r = await axios.post(`https://${ACCOUNTS_DOMAIN}/oauth/v2/token`, null, {
    params: { refresh_token: ZOHO_REFRESH_TOKEN, client_id: ZOHO_CLIENT_ID, client_secret: ZOHO_CLIENT_SECRET, grant_type: "refresh_token" },
  });
  return r.data.access_token as string;
}

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") return (v as Record<string, string>).value || (v as Record<string, string>).url || "";
  return String(v);
}

async function main() {
  const pattern = process.argv[2] || "dokify";
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
    const linkRaw = asString(r.Link_de_la_plataforma);
    const tipo = asString(r.Forma_de_env_o1).toLowerCase();
    return tipo.includes("plataforma") && re.test(linkRaw);
  });

  console.log(`[${pattern}] matches: ${matches.length}`);
  for (const r of matches) {
    console.log("---");
    console.log("ID:", asString(r.ID));
    console.log("Nombre:", asString(r.Nombre_de_Plantilla_Env_o));
    console.log("Link RAW:", JSON.stringify(r.Link_de_la_plataforma));
    console.log("Link asString:", asString(r.Link_de_la_plataforma));
    console.log("Usuario:", asString(r.Usuario));
    console.log("Pass length:", asString(r.Contrase_a).length);
    console.log("Forma_de_env_o1:", asString(r.Forma_de_env_o1));
  }
}

main().catch((e: any) => { console.error("FATAL:", e.response?.data || e.message); process.exit(1); });
