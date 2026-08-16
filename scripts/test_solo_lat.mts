import 'dotenv/config';
import { updateRecord } from "../src/tools/records.js";
import { zohoClient } from "../src/zoho-client.js";
const owner = process.env.ZOHO_OWNER_ID!;
const app = process.env.ZOHO_APP_LINK_NAME!;

// Try patching unrelated field on a record that fails
const id = "4790826000001085002";
const tests: Array<[string, any]> = [
  ["solo nota", { Nota_de_Direcci_n: "test" }],
  ["solo DETALLE_LOCALIZACI_N", { DETALLE_LOCALIZACI_N: "" }],
];
for (const [n, p] of tests) {
  try { await updateRecord("Clientes", id, p); console.log(n, "OK"); }
  catch(e:any){ console.log(n, "ERR:", e.message?.slice(0,180)); }
}
