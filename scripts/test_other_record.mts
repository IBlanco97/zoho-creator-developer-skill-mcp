import 'dotenv/config';
import { zohoClient } from "../src/zoho-client.js";
import { updateRecord } from "../src/tools/records.js";

const owner = process.env.ZOHO_OWNER_ID!;
const app = process.env.ZOHO_APP_LINK_NAME!;

async function fetchAll() {
  const out: any[] = [];
  let cursor: string | undefined;
  while (true) {
    const headers: any = { Accept: "application/json" };
    if (cursor) headers.record_cursor = cursor;
    const r = await zohoClient.get(`/data/${owner}/${app}/report/Clientes`, { params: { max_records: 200, field_config: "all" }, headers });
    const data = r.data?.data ?? [];
    out.push(...data);
    cursor = r.headers["record_cursor"];
    if (!cursor || data.length === 0) break;
  }
  return out;
}

const all = await fetchAll();
const candidates = all.filter(r => r.Localizacion && Number(r.Localizacion.latitude||0)===0 && r.Localizacion.country==="Spain").slice(0, 5);

for (const c of candidates) {
  console.log(`\nID ${c.ID}: ${c.Localizacion.zc_display_value}`);
  try {
    const r = await updateRecord("Clientes", c.ID, { Localizacion: { ...c.Localizacion, latitude: "41.5", longitude: "2.2" } });
    console.log(" → PATCH ok");
  } catch(e:any){ console.log(" → ERR:", e.message?.slice(0,150)); }
}
