import 'dotenv/config';
import { zohoClient } from "../src/zoho-client.js";

const owner = process.env.ZOHO_OWNER_ID!;
const app = process.env.ZOHO_APP_LINK_NAME!;

async function fetchAll(report: string) {
  const out: any[] = [];
  let cursor: string | undefined;
  while (true) {
    const headers: any = { Accept: "application/json" };
    if (cursor) headers.record_cursor = cursor;
    const r = await zohoClient.get(`/data/${owner}/${app}/report/${report}`, {
      params: { max_records: 200, field_config: "all" },
      headers,
    });
    const data = r.data?.data ?? [];
    out.push(...data);
    cursor = r.headers["record_cursor"] || r.headers["Record_Cursor"];
    if (!cursor || data.length === 0) break;
    if (out.length > 5000) break;
  }
  return out;
}

function inspect(rows: any[], geoField: string, label: string) {
  let withGeo = 0, withCoords = 0, empty = 0, sample: any[] = [];
  for (const r of rows) {
    const v = r[geoField];
    if (!v || (typeof v === "object" && Object.keys(v).length === 0)) { empty++; continue; }
    withGeo++;
    const lat = v.latitude ?? v.Latitude;
    const lng = v.longitude ?? v.Longitude;
    if (lat && lng && Number(lat) !== 0) withCoords++;
    if (sample.length < 3) sample.push({ id: r.ID, name: r.Nombre_del_Cliente || r.Name || r.Nombre, geo: v });
  }
  console.log(`\n=== ${label} (total: ${rows.length}) ===`);
  console.log(`con geo objeto: ${withGeo}`);
  console.log(`con lat/lng numéricos no-cero: ${withCoords}`);
  console.log(`vacíos: ${empty}`);
  console.log("samples con geo:", JSON.stringify(sample, null, 2));
  // Sample empty
  const emptySample = rows.filter(r => !r[geoField] || Object.keys(r[geoField]||{}).length===0).slice(0,3);
  console.log("samples sin geo:", JSON.stringify(emptySample.map(r=>({id:r.ID,name:r.Nombre_del_Cliente||r.Name||r.Nombre, addrField: r[geoField]})), null, 2));
}

const clientes = await fetchAll("Clientes");
inspect(clientes, "Localizacion", "Clientes report");

// breakdown by country and missing lat/lng
const buckets: Record<string, {total:number, conLat:number, sinLat:number}> = {};
for (const r of clientes) {
  const v = r.Localizacion || {};
  const c = (v.country || "(sin pais)").trim();
  const lat = v.latitude ? Number(v.latitude) : 0;
  buckets[c] ||= {total:0,conLat:0,sinLat:0};
  buckets[c].total++;
  if (lat) buckets[c].conLat++; else buckets[c].sinLat++;
}
console.log("\n=== Breakdown por country ===");
console.table(buckets);

// Empleados
const emps = await fetchAll("Empleados");
inspect(emps, "Address", "Empleados (Address)");
const empBuckets: Record<string, {total:number, conLat:number, sinLat:number}> = {};
for (const r of emps) {
  const v = r.Address || {};
  const c = (v.country || "(vacio)").trim() || "(vacio)";
  const lat = v.latitude ? Number(v.latitude) : 0;
  empBuckets[c] ||= {total:0,conLat:0,sinLat:0};
  empBuckets[c].total++;
  if (lat) empBuckets[c].conLat++; else empBuckets[c].sinLat++;
}
console.log("\n=== Empleados breakdown country ===");
console.table(empBuckets);

// Sample sin lat/lng
const sinLat = clientes.filter(r => !r.Localizacion?.latitude || Number(r.Localizacion.latitude)===0);
console.log(`\nClientes sin coords: ${sinLat.length}`);
console.log("3 primeros sin coords:");
console.log(JSON.stringify(sinLat.slice(0,3).map(r=>({id:r.ID,name:r.Nombre_del_Cliente||r.Cliente,loc:r.Localizacion})),null,2));

