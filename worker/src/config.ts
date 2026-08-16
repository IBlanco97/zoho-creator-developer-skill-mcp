import { config as loadEnv } from "dotenv";
loadEnv();

function need(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

export const cfg = {
  port: Number(process.env.PORT ?? 8787),
  sharedSecret: need("WORKER_SHARED_SECRET"),
  headless: process.env.HEADLESS !== "false",
  logLevel: process.env.LOG_LEVEL ?? "info",

  zoho: {
    clientId: need("ZOHO_CLIENT_ID"),
    clientSecret: need("ZOHO_CLIENT_SECRET"),
    refreshToken: need("ZOHO_REFRESH_TOKEN"),
    ownerId: need("ZOHO_OWNER_ID"),
    appLinkName: need("ZOHO_APP_LINK_NAME"),
    accountsDomain: process.env.ZOHO_ACCOUNTS_DOMAIN ?? "accounts.zoho.com",
    apiDomain: process.env.ZOHO_API_DOMAIN ?? "creator.zoho.com",
    callbackFunction: process.env.ZOHO_CALLBACK_FUNCTION ?? "Plataforma_Upload_Callback",
  },
};
