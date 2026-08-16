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

// 1. List forms — find Envio_Plataforma_Log (or variants)
const formsRes = await axios.get(
  `https://creator.zoho.com/creator/v2.1/meta/${process.env.ZOHO_OWNER_ID}/${process.env.ZOHO_APP_LINK_NAME}/forms`,
  { headers }
);
const forms = (formsRes.data.forms || []) as Array<Record<string, string>>;
const matches = forms.filter((f) => /env(io|ío).*plataforma|plataforma.*log|upload.*log/i.test(f.link_name + " " + f.display_name));
console.log("Forms candidatos:");
for (const f of matches) console.log(`  ${f.link_name}  (${f.display_name})`);
if (matches.length === 0) {
  console.log("  (none) — el form no existe todavía. Hay que crearlo.");
}

// 2. List reports too
const reportsRes = await axios.get(
  `https://creator.zoho.com/creator/v2.1/meta/${process.env.ZOHO_OWNER_ID}/${process.env.ZOHO_APP_LINK_NAME}/reports`,
  { headers }
);
const reports = (reportsRes.data.reports || []) as Array<Record<string, string>>;
const reportMatches = reports.filter((r) => /env(io|ío).*plataforma|plataforma.*log|upload.*log/i.test(r.link_name + " " + r.display_name));
console.log("\nReports candidatos:");
for (const r of reportMatches) console.log(`  ${r.link_name}  (${r.display_name})`);

// 3. If form exists, list its fields
if (matches.length > 0) {
  const linkName = matches[0]!.link_name;
  console.log(`\n=== Campos de ${linkName} ===`);
  const fieldsRes = await axios.get(
    `https://creator.zoho.com/creator/v2.1/meta/${process.env.ZOHO_OWNER_ID}/${process.env.ZOHO_APP_LINK_NAME}/form/${linkName}/fields`,
    { headers }
  );
  const fields = (fieldsRes.data.fields || []) as Array<Record<string, string>>;
  for (const f of fields) console.log(`  ${f.field_name || f.link_name}  (${f.display_name})  type=${f.type}`);
}
