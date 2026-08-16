import 'dotenv/config';
import { listReports } from "../src/tools/metadata.js";
const r: any = await listReports();
const matches = (r.reports ?? []).filter((x: any) =>
  /usuario/i.test(x.link_name) || /usuario/i.test(x.display_name)
);
console.log(JSON.stringify(matches, null, 2));
