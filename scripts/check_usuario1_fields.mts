import 'dotenv/config';
import { getFormFields } from "../src/tools/metadata.js";
const fields = await getFormFields("Usuario1");
console.log(JSON.stringify(fields, null, 2));
