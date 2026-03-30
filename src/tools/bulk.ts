import fs from "node:fs/promises";
import path from "node:path";
import { zohoClient } from "../zoho-client.js";
import { listForms } from "./metadata.js";

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

const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_ATTEMPTS = 100; // ~5 minutes max

interface BulkReadJobDetails {
  id: string;
  status: string;
  result?: {
    count: number;
    download_url: string;
    more_records: boolean;
  };
}

interface BulkReadResult {
  jobId: string;
  status: string;
  recordCount: number;
  csvContent: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a bulk read job, polls until completion, and downloads the CSV result.
 * Returns all records from the report as CSV text.
 */
export async function bulkRead(
  reportLinkName: string,
  criteria?: string
): Promise<BulkReadResult> {
  // 1. Create the bulk read job
  const body: Record<string, unknown> = {};
  if (criteria) {
    body.query = { criteria };
  }

  const createRes = await zohoClient.post(
    `/bulk/${OWNER()}/${APP()}/report/${reportLinkName}/read`,
    body
  );
  const createData = createRes.data as { code: number; details: BulkReadJobDetails };
  const jobId = createData.details.id;

  // 2. Poll until the job completes
  let details: BulkReadJobDetails = createData.details;
  let attempts = 0;

  while (details.status === "In-progress" && attempts < MAX_POLL_ATTEMPTS) {
    await sleep(POLL_INTERVAL_MS);
    const statusRes = await zohoClient.get(
      `/bulk/${OWNER()}/${APP()}/report/${reportLinkName}/read/${jobId}`
    );
    const statusData = statusRes.data as { code: number; details: BulkReadJobDetails };
    details = statusData.details;
    attempts++;
  }

  if (details.status === "In-progress") {
    throw new Error(
      `Bulk read job ${jobId} timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`
    );
  }

  if (details.status !== "Completed") {
    throw new Error(`Bulk read job ${jobId} failed with status: ${details.status}`);
  }

  // 3. Download the result (ZIP containing CSV)
  const downloadRes = await zohoClient.get(
    `/bulk/${OWNER()}/${APP()}/report/${reportLinkName}/read/${jobId}/result`,
    { responseType: "arraybuffer" }
  );

  // The response is a ZIP file — extract the CSV inside
  const csvContent = await extractCsvFromZip(Buffer.from(downloadRes.data as ArrayBuffer));

  return {
    jobId,
    status: details.status,
    recordCount: details.result?.count ?? 0,
    csvContent,
  };
}

/**
 * Extracts the first CSV file from a ZIP buffer.
 * Uses a minimal ZIP parser to avoid extra dependencies.
 */
async function extractCsvFromZip(zipBuffer: Buffer): Promise<string> {
  // Try to use Node.js built-in zlib for deflate, and parse ZIP manually
  const { inflateRawSync } = await import("node:zlib");

  let offset = 0;
  const view = new DataView(zipBuffer.buffer, zipBuffer.byteOffset, zipBuffer.byteLength);

  while (offset < zipBuffer.length - 4) {
    const signature = view.getUint32(offset, true);
    if (signature !== 0x04034b50) break; // Not a local file header

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraFieldLength = view.getUint16(offset + 28, true);
    const fileName = zipBuffer.subarray(offset + 30, offset + 30 + fileNameLength).toString("utf-8");
    const dataStart = offset + 30 + fileNameLength + extraFieldLength;

    if (fileName.endsWith(".csv")) {
      const rawData = zipBuffer.subarray(dataStart, dataStart + compressedSize);
      if (compressionMethod === 0) {
        // Stored (no compression)
        return rawData.toString("utf-8");
      } else if (compressionMethod === 8) {
        // Deflated
        const inflated = inflateRawSync(rawData);
        return inflated.toString("utf-8");
      } else {
        throw new Error(`Unsupported compression method: ${compressionMethod}`);
      }
    }

    // Move to next file entry
    offset = dataStart + compressedSize;
  }

  // If no CSV found, return the raw content as-is (might be plain text)
  return zipBuffer.toString("utf-8");
}

/**
 * Backs up all forms in the application by reading all records from each
 * form's default report and saving them as JSON files in the specified directory.
 */
export async function backupApp(
  outputDir: string
): Promise<{ form: string; recordCount: number; file: string }[]> {
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Get all forms
  const formsData = (await listForms()) as { forms?: { link_name: string; display_name: string }[] };
  const forms = formsData.forms ?? [];

  if (forms.length === 0) {
    throw new Error("No forms found in the application");
  }

  const results: { form: string; recordCount: number; file: string }[] = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  for (const form of forms) {
    const reportLinkName = `${form.link_name}_Report`;

    try {
      // Try bulk read first
      const bulkResult = await bulkRead(reportLinkName);
      const fileName = `${form.link_name}_${timestamp}.csv`;
      const filePath = path.join(outputDir, fileName);
      await fs.writeFile(filePath, bulkResult.csvContent, "utf-8");

      results.push({
        form: form.display_name || form.link_name,
        recordCount: bulkResult.recordCount,
        file: filePath,
      });
    } catch (error) {
      // If bulk read fails (e.g., no records), try paginated read as fallback
      try {
        const allRecords = await readAllRecordsPaginated(reportLinkName);
        const fileName = `${form.link_name}_${timestamp}.json`;
        const filePath = path.join(outputDir, fileName);
        await fs.writeFile(filePath, JSON.stringify(allRecords, null, 2), "utf-8");

        results.push({
          form: form.display_name || form.link_name,
          recordCount: allRecords.length,
          file: filePath,
        });
      } catch (fallbackError) {
        // Record the failure but continue with other forms
        results.push({
          form: form.display_name || form.link_name,
          recordCount: -1,
          file: `ERROR: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
        });
      }
    }
  }

  return results;
}

/**
 * Fallback: reads all records from a report using paginated GET requests.
 */
async function readAllRecordsPaginated(reportLinkName: string): Promise<unknown[]> {
  const allRecords: unknown[] = [];
  let page = 1;
  const pageSize = 200;

  while (true) {
    const res = await zohoClient.get(
      `/data/${OWNER()}/${APP()}/report/${reportLinkName}`,
      { params: { from: (page - 1) * pageSize + 1, limit: pageSize } }
    );
    const data = res.data as { data?: unknown[] };
    const records = data.data ?? [];

    if (records.length === 0) break;

    allRecords.push(...records);

    if (records.length < pageSize) break;
    page++;
  }

  return allRecords;
}
