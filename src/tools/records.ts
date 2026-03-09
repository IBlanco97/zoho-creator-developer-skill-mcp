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

export interface GetRecordsParams {
  reportLinkName: string;
  criteria?: string;   // Zoho criteria expression, e.g. "Status == \"Active\""
  page?: number;       // 1-based
  pageSize?: number;   // max 200
}

/**
 * Reads records from a report, with optional criteria filtering and pagination.
 */
export async function getRecords(params: GetRecordsParams): Promise<unknown> {
  const { reportLinkName, criteria, page = 1, pageSize = 50 } = params;

  const query: Record<string, string | number> = {
    from: (page - 1) * pageSize + 1,
    limit: pageSize,
  };
  if (criteria) query["criteria"] = criteria;

  const res = await zohoClient.get(
    `/data/${OWNER()}/${APP()}/report/${reportLinkName}`,
    { params: query }
  );
  return res.data;
}

/**
 * Reads a single record by ID from a report.
 */
export async function getRecord(
  reportLinkName: string,
  recordId: string
): Promise<unknown> {
  const res = await zohoClient.get(
    `/data/${OWNER()}/${APP()}/report/${reportLinkName}/${recordId}`
  );
  return res.data;
}

/**
 * Creates a new record in the specified form.
 * `fields` is a key-value map of field link names to values.
 */
export async function createRecord(
  formLinkName: string,
  fields: Record<string, unknown>
): Promise<unknown> {
  const res = await zohoClient.post(
    `/data/${OWNER()}/${APP()}/form/${formLinkName}`,
    { data: fields }
  );
  return res.data;
}

/**
 * Updates fields on a single record identified by ID within a report.
 */
export async function updateRecord(
  reportLinkName: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<unknown> {
  const res = await zohoClient.patch(
    `/data/${OWNER()}/${APP()}/report/${reportLinkName}/${recordId}`,
    { data: fields }
  );
  return res.data;
}

/**
 * Deletes a single record by ID from a report.
 */
export async function deleteRecord(
  reportLinkName: string,
  recordId: string
): Promise<unknown> {
  const res = await zohoClient.delete(
    `/data/${OWNER()}/${APP()}/report/${reportLinkName}/${recordId}`
  );
  return res.data;
}
