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

const platforma = recs.filter((r) => String(r.Forma_de_env_o1 || "").toLowerCase().includes("plataforma"));
console.log("First Plataforma record fields:");
console.log(JSON.stringify(platforma[0], null, 2).slice(0, 2000));

console.log("\n=== Searching for CTAIMA-like ===");
const cands = platforma.filter((r) => {
  const lk = JSON.stringify(r.Link_de_la_plataforma || "").toLowerCase();
  return lk.includes("ctaima");
});
console.log(`Found ${cands.length}`);
cands.forEach((r, i) => {
  console.log(`\n--- record ${i} ---`);
  console.log("Link_de_la_plataforma raw:", JSON.stringify(r.Link_de_la_plataforma));
  console.log("Cliente raw:", JSON.stringify(r.Cliente).slice(0, 200));
  console.log("Usuario:", JSON.stringify(r.Usuario));
  console.log("Contrase_a present:", !!r.Contrase_a);
});
