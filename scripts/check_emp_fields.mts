import 'dotenv/config';
import { getFormFields } from "../src/tools/metadata.js";
const f: any = await getFormFields("Nuevo_Empleado");
const emails = f.fields.filter((x: any) =>
  /email|mail|correo/i.test(x.link_name) || /email|mail|correo/i.test(x.display_name)
);
console.log(JSON.stringify(emails.map((x: any) => ({ link: x.link_name, name: x.display_name, type: x.type })), null, 2));
