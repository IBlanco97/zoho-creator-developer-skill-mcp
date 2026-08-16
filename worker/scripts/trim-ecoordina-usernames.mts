/**
 * trim-ecoordina-usernames.mts — one-off cleanup.
 *
 * Three e-coordina Forma_de_Envío records have trailing-space in `Usuario`
 * ("B64648546 "). This script trims them via Zoho REST PATCH.
 *
 * Run: npx tsx worker/scripts/trim-ecoordina-usernames.mts
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

const TARGETS = [
  { id: "4790826000000845792", note: "dester" },
  { id: "4790826000000845617", note: "intermasgroup" },
  { id: "4790826000000845377", note: "walstead" },
];

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

async function main() {
  const token = await getToken();
  const headers = {
    Authorization: `Zoho-oauthtoken ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  for (const t of TARGETS) {
    const url = `https://creator.zoho.com/creator/v2.1/data/${ZOHO_OWNER_ID}/${ZOHO_APP_LINK_NAME}/report/Ver_Plantillas_Env_o/${t.id}`;
    const body = { data: { Usuario: "B64648546" } };
    try {
      const resp = await axios.patch(url, body, { headers });
      console.log(`✅ ${t.id} (${t.note}): code=${resp.data.code} msg=${resp.data.message || "ok"}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown }; message?: string };
      console.error(`❌ ${t.id} (${t.note}):`, err.response?.data || err.message);
    }
  }
}

main().catch((e: unknown) => {
  console.error("FATAL:", (e as Error).message);
  process.exit(1);
});
