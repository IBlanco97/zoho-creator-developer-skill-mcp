import 'dotenv/config';
import { zohoClient } from "../src/zoho-client.js";
const owner = process.env.ZOHO_OWNER_ID!;
const app = process.env.ZOHO_APP_LINK_NAME!;
const r = await zohoClient.get(`/data/${owner}/${app}/report/Clientes/4790826000000910491`);
console.log(JSON.stringify((r.data?.data?.[0] ?? r.data?.data)?.Localizacion, null, 2));
