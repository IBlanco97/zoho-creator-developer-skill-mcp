import { zohoClient } from "../zoho-client.js";

const OWNER = () => {
  const v = process.env.ZOHO_OWNER_ID;
  if (!v) throw new Error("ZOHO_OWNER_ID is not set");
  return v;
};

const APP = () => {
  const v = process.env.ZOHO_APP_LINK_NAME;
  if (!v) throw new Error("ZOHO_APP_LINK_NAME is not set");
  return v;
};

/**
 * Lists all forms in the Zoho Creator application.
 */
export async function listForms(): Promise<unknown> {
  const res = await zohoClient.get(`/meta/${OWNER()}/${APP()}/forms`);
  return res.data;
}

/**
 * Gets field metadata for a specific form.
 */
export async function getFormFields(formLinkName: string): Promise<unknown> {
  const res = await zohoClient.get(
    `/meta/${OWNER()}/${APP()}/form/${formLinkName}/fields`
  );
  return res.data;
}
