import 'dotenv/config';
import { getRecords } from "../src/tools/records.js";

// Try criteria: a Solicitud where Trabajador_Solicitante.Usuario11.User_Email matches a known login
// Use ecama@sicma21.com (visible in earlier snapshot)
const tries = [
  { tag: "direct lookup match (preferred)", crit: 'Trabajador_Solicitante == 4790826000000175195' }, // example Empleado ID
];

for (const t of tries) {
  try {
    const r: any = await getRecords({ reportLinkName: "Ver_Solicitud", criteria: t.crit, pageSize: 5 });
    const n = (r.data ?? []).length;
    console.log(`${t.tag}: OK (${n} rows)`);
  } catch (e: any) {
    console.log(`${t.tag}: ERROR ${e?.message?.substring(0, 200)}`);
  }
}
