import axios from "axios";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { cfg } from "./config.js";

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }
  const r = await axios.post(`https://${cfg.zoho.accountsDomain}/oauth/v2/token`, null, {
    params: {
      refresh_token: cfg.zoho.refreshToken,
      client_id: cfg.zoho.clientId,
      client_secret: cfg.zoho.clientSecret,
      grant_type: "refresh_token",
    },
  });
  cachedToken = {
    value: r.data.access_token,
    expiresAt: Date.now() + (r.data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

function apiBase(): string {
  return `https://${cfg.zoho.apiDomain}/creator/v2.1/data/${cfg.zoho.ownerId}/${cfg.zoho.appLinkName}`;
}

export async function downloadFileField(
  reportName: string,
  recordId: string,
  fieldName: string,
): Promise<{ path: string; mime: string }> {
  const token = await getAccessToken();
  const url = `${apiBase()}/report/${reportName}/${recordId}/${fieldName}/download`;
  const res = await axios.get(url, {
    responseType: "stream",
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  const dir = join(tmpdir(), "zoho-worker", randomUUID());
  await mkdir(dir, { recursive: true });
  const disp = res.headers["content-disposition"];
  const filename = parseFilename(typeof disp === "string" ? disp : undefined) ?? `${recordId}.bin`;
  const path = join(dir, filename);
  const ws = createWriteStream(path);
  await new Promise<void>((resolve, reject) => {
    res.data.pipe(ws);
    res.data.on("error", reject);
    ws.on("finish", () => resolve());
    ws.on("error", reject);
  });
  const mime = res.headers["content-type"];
  return { path, mime: typeof mime === "string" ? mime : "application/octet-stream" };
}

function parseFilename(disp: string | undefined): string | null {
  if (!disp) return null;
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)/i.exec(disp);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function listRecords(
  reportName: string,
  criteria?: string,
): Promise<Record<string, unknown>[]> {
  const token = await getAccessToken();
  const base = `${apiBase()}/report/${reportName}`;
  const all: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  do {
    const params: Record<string, string> = { limit: "200" };
    if (criteria) params.criteria = criteria;
    if (cursor) params.record_cursor = cursor;
    const r = await axios.get<{ code: number; data?: unknown[]; record_cursor?: string }>(
      base,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` }, params },
    );
    if (r.data.code !== 3000) throw new Error(`Zoho ${reportName} code=${r.data.code}: ${JSON.stringify(r.data).slice(0, 200)}`);
    const batch = (r.data.data ?? []) as Record<string, unknown>[];
    all.push(...batch);
    cursor = r.data.record_cursor;
  } while (cursor);
  return all;
}

export async function getRecord(
  reportName: string,
  recordId: string,
): Promise<Record<string, unknown>> {
  const token = await getAccessToken();
  const r = await axios.get<{ code: number; data: Record<string, unknown> }>(
    `${apiBase()}/report/${reportName}/${recordId}`,
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } },
  );
  if (r.data.code !== 3000) throw new Error(`Zoho getRecord ${reportName}/${recordId} code=${r.data.code}`);
  return r.data.data;
}

export async function postCallback(payload: unknown): Promise<void> {
  const token = await getAccessToken();
  const url = `${apiBase()}/custom/${cfg.zoho.callbackFunction}`;
  await axios.post(url, payload, {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
  });
}
