import 'dotenv/config';
import { listReports } from "../src/tools/metadata.js";
const r: any = await listReports();
const matches = (r.reports ?? []).filter((x: any) => /Solicitud/i.test(x.link_name) || /Solicitud/i.test(x.display_name));
console.log(JSON.stringify(matches, null, 2));
