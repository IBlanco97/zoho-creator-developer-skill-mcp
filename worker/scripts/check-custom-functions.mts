import { config } from "dotenv";
import axios from "axios";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(here, "../../.env") });

const t = await axios.post(
  `https://${process.env.ZOHO_ACCOUNTS_DOMAIN || "accounts.zoho.com"}/oauth/v2/token`,
  null,
  {
    params: {
      refresh_token: process.env.ZOHO_REFRESH_TOKEN,
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      grant_type: "refresh_token",
    },
  }
);
const headers = { Authorization: `Zoho-oauthtoken ${t.data.access_token}`, Accept: "application/json" };

// Try several REST endpoint paths in v2.1 to find functions
const paths = [
  `meta/${process.env.ZOHO_OWNER_ID}/${process.env.ZOHO_APP_LINK_NAME}/functions`,
  `meta/${process.env.ZOHO_OWNER_ID}/${process.env.ZOHO_APP_LINK_NAME}/customfunctions`,
  `meta/${process.env.ZOHO_OWNER_ID}/${process.env.ZOHO_APP_LINK_NAME}/custom_functions`,
  `meta/${process.env.ZOHO_OWNER_ID}/${process.env.ZOHO_APP_LINK_NAME}/restapi`,
];
for (const p of paths) {
  try {
    const r = await axios.get(`https://creator.zoho.com/creator/v2.1/${p}`, { headers, validateStatus: () => true });
    console.log(`[${p}] HTTP ${r.status}  ${r.status < 400 ? JSON.stringify(r.data).slice(0, 300) : ""}`);
  } catch (e) {
    console.log(`[${p}] error: ${(e as Error).message}`);
  }
}

// Try invoking the callback as a sanity check (with empty body — will fail validation but tells us if endpoint exists)
console.log("\n=== Probe: Plataforma_Upload_Callback as custom REST endpoint ===");
const probeUrls = [
  `https://creator.zoho.com/api/v2.1/${process.env.ZOHO_OWNER_ID}/${process.env.ZOHO_APP_LINK_NAME}/Plataforma_Upload_Callback`,
  `https://creator.zoho.com/api/v2/${process.env.ZOHO_OWNER_ID}/${process.env.ZOHO_APP_LINK_NAME}/Plataforma_Upload_Callback`,
];
for (const u of probeUrls) {
  try {
    const r = await axios.post(u, {}, { headers: { ...headers, "Content-Type": "application/json" }, validateStatus: () => true });
    console.log(`[${u}] HTTP ${r.status}  ${JSON.stringify(r.data).slice(0, 200)}`);
  } catch (e) {
    console.log(`[${u}] error: ${(e as Error).message}`);
  }
}
