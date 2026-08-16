import 'dotenv/config';
import { zohoClient } from "../src/zoho-client.js";
const owner = process.env.ZOHO_OWNER_ID!;
const app = process.env.ZOHO_APP_LINK_NAME!;
const r = await zohoClient.get(`/meta/${owner}/${app}/reports`);
const reports = r.data?.reports ?? [];
console.log("clientes/cliente reports:");
console.log(reports.filter((x:any)=>/client|map/i.test(x.link_name)||/client|mapa/i.test(x.display_name)).map((x:any)=>({link:x.link_name,name:x.display_name,type:x.type})));
