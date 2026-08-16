import 'dotenv/config';
import { updateRecord } from "../src/tools/records.js";
import { zohoClient } from "../src/zoho-client.js";
const owner = process.env.ZOHO_OWNER_ID!;
const app = process.env.ZOHO_APP_LINK_NAME!;
const id = "4790826000001085002";
try {
  const cur = (await zohoClient.get(`/data/${owner}/${app}/report/Clientes/${id}`)).data;
  const loc = (cur.data?.[0] ?? cur.data).Localizacion;
  await updateRecord("Clientes", id, { Localizacion: { ...loc, latitude: "41.51722", longitude: "2.19222" } });
  console.log("OK — bloqueador levantado!");
} catch(e:any){ console.log("STILL BLOCKED:", e.message?.slice(0,200)); }
