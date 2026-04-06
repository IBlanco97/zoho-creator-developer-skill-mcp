/**
 * Shared runtime configuration getters.
 * Each getter throws immediately with a clear message if the env var is missing,
 * so errors surface at call-time rather than silently producing bad URLs.
 */

export const OWNER = (): string => {
  const v = process.env.ZOHO_OWNER_ID;
  if (!v) throw new Error("ZOHO_OWNER_ID is not set");
  return v;
};

export const APP = (): string => {
  const v = process.env.ZOHO_APP_LINK_NAME;
  if (!v) throw new Error("ZOHO_APP_LINK_NAME is not set");
  return v;
};

/** Zoho API data domain — configurable for EU (zohoapis.eu) / IN (zohoapis.in) regions */
export const API_DOMAIN =
  process.env.ZOHO_API_DOMAIN ?? "www.zohoapis.com";
