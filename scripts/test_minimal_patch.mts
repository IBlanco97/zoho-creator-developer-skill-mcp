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
const sinLat = all.filter(r => r.Localizacion && Number(r.Localizacion.latitude||0)===0);
console.log("sin lat total:", sinLat.length);

// pick a Spain one without lat
const spainSinLat = sinLat.filter(r => r.Localizacion.country === "Spain")[0];
console.log("test on:", spainSinLat?.ID, spainSinLat?.Localizacion?.zc_display_value);

// Try empty update first
try {
  const r = await updateRecord("Clientes", spainSinLat.ID, {});
  console.log("empty ok:", JSON.stringify(r).slice(0,200));
} catch(e:any){ console.log("empty err:", e.message?.slice(0,200)); }

// Try just touching a different field
try {
  const r = await updateRecord("Clientes", spainSinLat.ID, { Nota_de_Direcci_n: (spainSinLat.Nota_de_Direcci_n||"") + "" });
  console.log("nota ok:", JSON.stringify(r).slice(0,200));
} catch(e:any){ console.log("nota err:", e.message?.slice(0,200)); }
