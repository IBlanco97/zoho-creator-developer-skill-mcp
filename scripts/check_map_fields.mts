import 'dotenv/config';
import { getFormFields } from "../src/tools/metadata.js";

async function dump(form: string) {
  const f: any = await getFormFields(form);
  const addr = f.fields.filter((x: any) =>
    /address|location|direcc|ubicaci|geo|lat|long|map|cp|postal|coord/i.test(x.link_name) ||
    /address|location|direcc|ubicaci|geo|lat|long|map|cp|postal|coord/i.test(x.display_name) ||
    x.type === 30 || x.type === 23
  );
  console.log(`\n=== ${form} (${f.fields.length} fields) ===`);
  console.log(JSON.stringify(addr.map((x: any) => ({ link: x.link_name, name: x.display_name, type: x.type })), null, 2));
}

await dump("Nuevo_Empleado");
await dump("Nuevo_Cliente");
