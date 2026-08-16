import 'dotenv/config';
import { zohoClient } from "../src/zoho-client.js";
import { updateRecord } from "../src/tools/records.js";

const owner = process.env.ZOHO_OWNER_ID!;
const app = process.env.ZOHO_APP_LINK_NAME!;
const APPLY = process.argv.includes("--apply");
const FIX_TOLEDO_ONLY = process.argv.includes("--fix-toledo");

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

async function geocode(query: string): Promise<{lat:number,lng:number}|null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const r = await fetch(url, { headers: { "User-Agent": "sicma21-zoho-geocoder/1.0 bfrias@sicma21.com" } });
  if (!r.ok) return null;
  const j: any = await r.json();
  if (!j?.length) return null;
  return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) };
}

function buildQuery(loc: any): string {
  const parts = [loc.address_line_1, loc.district_city, loc.state_province, loc.postal_code, loc.country || "Spain"]
    .filter(s => s && String(s).trim() && String(s).trim() !== ".").map(s => String(s).trim());
  return parts.join(", ");
}

if (FIX_TOLEDO_ONLY) {
  // I wrote bogus 41.5/2.2 to Toledo earlier. Fix only that.
  const id = "4790826000000910491";
  const cur = (await zohoClient.get(`/data/${owner}/${app}/report/Clientes/${id}`)).data;
  const loc = (cur.data?.[0] ?? cur.data).Localizacion;
  const q = buildQuery(loc);
  console.log("geocoding:", q);
  let g = await geocode(q);
  if (!g) {
    await new Promise(r=>setTimeout(r,1100));
    const fb = [loc.district_city, loc.state_province, "Spain"].filter(Boolean).join(", ");
    console.log("fallback:", fb);
    g = await geocode(fb);
  }
  console.log("→", g);
  if (g) {
    await updateRecord("Clientes", id, { Localizacion: { ...loc, latitude: String(g.lat), longitude: String(g.lng) } });
    console.log("FIXED Toledo");
  }
  process.exit(0);
}

const all = await fetchAll();
const todo = all.filter(r => r.Localizacion && Number(r.Localizacion.latitude||0)===0 && r.Localizacion.address_line_1);
console.log(`Modo: ${APPLY ? "APPLY" : "DRY"}`);
console.log(`Sin lat/lng: ${todo.length}`);

const results = { ok: 0, geocodeFail: 0, patchFail: 0, errs: [] as any[] };

for (let i = 0; i < todo.length; i++) {
  const c = todo[i];
  const loc = c.Localizacion;
  // normalize country to Spain when in Spanish to improve geocode hit rate
  if (/^espa(ñ|n)a$/i.test((loc.country||"").trim())) loc.country = "Spain";
  const q = buildQuery(loc);
  process.stdout.write(`[${i+1}/${todo.length}] ${c.ID} "${q.slice(0,80)}" ... `);
  let g: {lat:number,lng:number} | null = null;
  try { g = await geocode(q); } catch (e:any) { console.log("geocodeERR", e.message?.slice(0,80)); }
  if (!g) {
    // retry without address_line_1 (city-level fallback)
    const fallback = [loc.district_city, loc.state_province, loc.country || "Spain"].filter(Boolean).join(", ");
    try { g = await geocode(fallback); } catch {}
    if (!g) { results.geocodeFail++; console.log("NO_GEO"); await new Promise(r=>setTimeout(r,1100)); continue; }
    process.stdout.write("(fallback) ");
  }
  console.log(`→ ${g.lat.toFixed(4)},${g.lng.toFixed(4)}`);
  if (APPLY) {
    try {
      await updateRecord("Clientes", c.ID, { Localizacion: { ...loc, latitude: String(g.lat), longitude: String(g.lng) } });
      results.ok++;
    } catch(e:any) {
      results.patchFail++;
      results.errs.push({ id: c.ID, name: c.Nombre_del_Cliente, q, err: e.message?.slice(0,120) });
    }
  }
  await new Promise(r => setTimeout(r, 1100)); // Nominatim 1 req/s policy
}

console.log("\n=== Resumen ===");
console.log(JSON.stringify({ ok: results.ok, geocodeFail: results.geocodeFail, patchFail: results.patchFail }, null, 2));
if (results.errs.length) console.log("Patch errors (primeros 10):", JSON.stringify(results.errs.slice(0,10), null, 2));
