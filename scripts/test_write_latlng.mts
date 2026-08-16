import 'dotenv/config';
import { zohoClient } from "../src/zoho-client.js";
import { updateRecord } from "../src/tools/records.js";

const owner = process.env.ZOHO_OWNER_ID!;
const app = process.env.ZOHO_APP_LINK_NAME!;
const id = "4790826000001085002";

const cur = (await zohoClient.get(`/data/${owner}/${app}/report/Clientes/${id}`)).data;
const loc = (cur.data?.[0] ?? cur.data).Localizacion;
console.log("ANTES:", loc.latitude, loc.longitude);

// Try writing lat/lng directly with full preserved address
const newLoc = {
  ...loc,
  latitude: "41.51722",
  longitude: "2.19222",
};
delete newLoc.zc_display_value;
try {
  const r = await updateRecord("Clientes", id, { Localizacion: newLoc });
  console.log("PATCH ok:", JSON.stringify(r).slice(0, 300));
} catch (e: any) {
  console.log("PATCH ERR:", e.message?.slice(0, 300));
}

await new Promise(r => setTimeout(r, 2000));
const after = (await zohoClient.get(`/data/${owner}/${app}/report/Clientes/${id}`)).data;
const loc2 = (after.data?.[0] ?? after.data).Localizacion;
console.log("DESPUES:", loc2.latitude, loc2.longitude);
