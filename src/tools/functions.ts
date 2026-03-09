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
 * Invokes a Deluge function that has been exposed as a REST endpoint in Zoho Creator.
 *
 * Note: the function must be marked as a REST endpoint in the Zoho Creator IDE.
 * Source code of Deluge scripts is NOT accessible via REST API.
 *
 * @param functionLinkName - The link name of the Deluge function
 * @param params - Input parameters to pass to the function
 */
export async function invokeFunction(
  functionLinkName: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const res = await zohoClient.post(
    `/data/${OWNER()}/${APP()}/action/${functionLinkName}`,
    { params }
  );
  return res.data;
}
