import { zohoClient } from "../zoho-client.js";
import { OWNER, APP } from "../config.js";

/**
 * Lists all forms in the Zoho Creator application.
 */
export async function listForms(): Promise<unknown> {
  const res = await zohoClient.get(`/meta/${OWNER()}/${APP()}/forms`);
  return res.data;
}

/**
 * Lists all reports in the Zoho Creator application.
 */
export async function listReports(): Promise<unknown> {
  const res = await zohoClient.get(`/meta/${OWNER()}/${APP()}/reports`);
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
