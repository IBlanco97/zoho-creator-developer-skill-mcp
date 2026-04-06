import { zohoClient } from '../src/zoho-client.js';
import { OWNER, APP } from '../src/config.js';

async function main() {
  try {
    const r = await zohoClient.get(`/meta/${OWNER()}/${APP()}/form/Nueva_Lista_de_Requisitos/fields`);
    const fields = r.data?.fields || r.data;
    if (Array.isArray(fields)) {
      for (const f of fields) {
        const ln = f.link_name || f.linkName || '';
        const dn = f.display_name || f.displayName || '';
        const tp = f.type || '';
        console.log(`${ln} | ${dn} | ${tp}`);
      }
    } else {
      console.log(JSON.stringify(r.data).substring(0, 3000));
    }
  } catch (e: any) {
    console.log('ERR:', e.message);
    if (e.response) console.log('RESP:', JSON.stringify(e.response.data).substring(0, 500));
  }
}
main();
