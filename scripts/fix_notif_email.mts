import 'dotenv/config';
import { getRecords, updateRecord } from "../src/tools/records.js";

const REPORT = "Usuario1_Report";
const dryRun = process.argv.includes("--dry-run");

let page = 1;
const pageSize = 200;
const all: any[] = [];
while (true) {
  const r: any = await getRecords({ reportLinkName: REPORT, page, pageSize });
  const data = r.data ?? [];
  all.push(...data);
  if (data.length < pageSize) break;
  page++;
  if (page > 20) break;
}
console.log(`Total usuarios: ${all.length}`);

const empty = all.filter((u) => {
  const n = (u.Email_para_notificaciones ?? "").toString().trim();
  return n === "";
});
console.log(`Con Email_para_notificaciones vacio: ${empty.length}`);

const noUserEmail = empty.filter((u) => !(u.User_Email ?? "").toString().trim());
if (noUserEmail.length) {
  console.log(`Sin User_Email tampoco (saltados): ${noUserEmail.length}`);
  for (const u of noUserEmail) console.log(`  - ID ${u.ID} (${u["Nombre.first_name"] ?? ""} ${u["Nombre.last_name"] ?? ""})`);
}

const toUpdate = empty.filter((u) => (u.User_Email ?? "").toString().trim());
console.log(`A actualizar: ${toUpdate.length}`);

for (const u of toUpdate) {
  const target = u.User_Email.toString().trim();
  console.log(`${dryRun ? "[DRY]" : "[UPD]"} ${u.ID}  ${target}`);
  if (!dryRun) {
    try {
      await updateRecord(REPORT, u.ID, { Email_para_notificaciones: target });
    } catch (e: any) {
      console.log(`  ERROR: ${e?.response?.data ? JSON.stringify(e.response.data) : e?.message}`);
    }
  }
}
console.log("Listo.");
