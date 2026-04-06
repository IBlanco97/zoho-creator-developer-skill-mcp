import 'dotenv/config';
import { getAccessToken } from '../src/auth.js';
import axios from 'axios';

const token = await getAccessToken();
const owner = process.env.ZOHO_OWNER_ID as string;
const app = process.env.ZOHO_APP_LINK_NAME as string;
const hdrs = {Authorization: `Zoho-oauthtoken ${token}`, Accept: 'application/json'};

// Fetch a single record to see full details including lookup values
const recId = '4790826000000434007';
const r = await axios.get(
  `https://creator.zoho.com/api/v2.1/${owner}/${app}/report/Documentos_Trabajador/${recId}`,
  { headers: hdrs }
);
process.stdout.write(JSON.stringify(r.data, null, 2).substring(0, 2000) + '\n');
