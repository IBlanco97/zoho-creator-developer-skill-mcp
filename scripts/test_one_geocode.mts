import 'dotenv/config';
import { zohoClient } from "../src/zoho-client.js";
import { updateRecord } from "../src/tools/records.js";

const owner = process.env.ZOHO_OWNER_ID!;
const app = process.env.ZOHO_APP_LINK_NAME!;

const id = "4790826000001085002";
const before = await zohoClient.get(`/data/${owner}/${app}/report/Clientes/${id}`);
console.log("ANTES:", JSON.stringify((before.data?.data?.[0] ?? before.data?.data)?.Localizacion, null, 2));

// strategy: re-send address_line_1 + state + country forcing geocoding (omit lat/lng so Zoho re-resolves)
const cur = (before.data?.data?.[0] ?? before.data?.data).Localizacion;
const newLoc = {
  address_line_1: cur.address_line_1,
  address_line_2: cur.address_line_2 || "",
  district_city: cur.district_city,
  state_province: cur.state_province,
  postal_code: cur.postal_code,
  country: "Spain",
  latitude: "",
  longitude: "",
};
console.log("Sending:", JSON.stringify(newLoc, null, 2));
const r = await updateRecord("Clientes", id, { Localizacion: newLoc });
console.log("RESP:", JSON.stringify(r, null, 2).slice(0, 800));

await new Promise(res => setTimeout(res, 4000));
const after = await zohoClient.get(`/data/${owner}/${app}/report/Clientes/${id}`);
console.log("DESPUES:", JSON.stringify((after.data?.data?.[0] ?? after.data?.data)?.Localizacion, null, 2));
