import 'dotenv/config';
import { zohoClient } from "../src/zoho-client.js";
import { updateRecord } from "../src/tools/records.js";

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
  }
  return out;
}

const DRY_RUN = process.argv.includes("--dry") || !process.argv.includes("--apply");

const clientes = await fetchAll("Clientes");
const targets = clientes.filter(r => {
  const v = r.Localizacion;
  if (!v) return false;
  const c = (v.country || "").trim().toLowerCase();
  const lat = Number(v.latitude || 0);
  return (c === "españa" || c === "espana" || c === "es") && !lat;
});

console.log(`Modo: ${DRY_RUN ? "DRY-RUN" : "APPLY"}`);
console.log(`Total clientes: ${clientes.length}`);
console.log(`Targets (country=España, sin lat): ${targets.length}`);

if (DRY_RUN) {
  console.log("Primeros 5 targets:");
  console.log(JSON.stringify(targets.slice(0, 5).map(r => ({
    id: r.ID,
    name: r.Nombre_del_Cliente || r.Cliente,
    country: r.Localizacion.country,
    address: r.Localizacion.zc_display_value,
  })), null, 2));
  console.log("\nPara ejecutar de verdad: npx tsx scripts/fix_clientes_country.mts --apply");
  process.exit(0);
}

let ok = 0, fail = 0;
const errors: any[] = [];
for (const r of targets) {
  const newAddr = { ...r.Localizacion, country: "Spain" };
  try {
    await updateRecord("Clientes", r.ID, { Localizacion: newAddr });
    ok++;
    if (ok % 10 === 0) console.log(`  ... ${ok}/${targets.length}`);
  } catch (e: any) {
    fail++;
    errors.push({ id: r.ID, name: r.Nombre_del_Cliente, err: e.message?.slice(0, 200) });
  }
  await new Promise(r => setTimeout(r, 250)); // rate-limit
}

console.log(`\n=== Resultado ===`);
console.log(`OK: ${ok}`);
console.log(`Fallos: ${fail}`);
if (errors.length) console.log("Errores:", JSON.stringify(errors.slice(0, 10), null, 2));
