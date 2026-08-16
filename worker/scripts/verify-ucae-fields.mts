import { config } from "dotenv";
import axios from "axios";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(here, "../../.env") });

const t = await axios.post(`https://${process.env.ZOHO_ACCOUNTS_DOMAIN || "accounts.zoho.com"}/oauth/v2/token`, null, {
  params: {
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    grant_type: "refresh_token",
  },
});
const headers = { Authorization: `Zoho-oauthtoken ${t.data.access_token}`, Accept: "application/json" };

// Verify a few patched records
const ids = [
  ["4790826000000294063", "ITA"],
  ["4790826000000294067", "RNT/TC2"],
  ["4790826000000382190", "RLC"],
  ["4790826000000278003", "EPI"],
  ["4790826000000543007", "L02"],
];
for (const [id, label] of ids) {
  const r = await axios.get(
    `https://creator.zoho.com/creator/v2.1/data/${process.env.ZOHO_OWNER_ID}/${process.env.ZOHO_APP_LINK_NAME}/report/Ver_Plantillas/${id}`,
    { headers }
  );
  const d = r.data.data;
  console.log(`[${label}] keys: ${Object.keys(d).filter(k=>/UCAE|nombre|ID/i.test(k)).join(', ')}`);
  console.log(`         Codigo_UCAE="${d.Codigo_UCAE}"  Bulk_SS_UCAE=${d.Bulk_SS_UCAE}`);
}
