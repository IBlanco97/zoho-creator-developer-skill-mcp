import { randomUUID } from "node:crypto";
import { pickAdapter } from "./adapters/index.js";
import { downloadFileField, postCallback } from "./zoho.js";
import { logger } from "./logger.js";
import type { Job, UploadJobInput, UploadResultItem } from "./types.js";

const jobs = new Map<string, Job>();
const queue: string[] = [];
let running = false;

export function enqueue(input: UploadJobInput): Job {
  const job: Job = {
    id: randomUUID(),
    input,
    status: "queued",
    createdAt: Date.now(),
    results: [],
  };
  jobs.set(job.id, job);
  queue.push(job.id);
  void pump();
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function listJobs(): Job[] {
  return Array.from(jobs.values());
}

async function pump(): Promise<void> {
  if (running) return;
  running = true;
  try {
    while (queue.length > 0) {
      const id = queue.shift()!;
      const job = jobs.get(id);
      if (!job) continue;
      await runJob(job);
    }
  } finally {
    running = false;
  }
}

async function runJob(job: Job): Promise<void> {
  job.status = "running";
  job.startedAt = Date.now();
  const log = logger.child({ jobId: job.id, cliente: job.input.clienteNombre });
  log.info({ docs: job.input.documentos.length, formas: job.input.formasEnvio.length }, "job start");

  const allResults: UploadResultItem[] = [];
  try {
    const settled = await Promise.allSettled(
      job.input.documentos.map(async (ref) => {
        const f = await downloadFileField(ref.fileReportName, ref.subirDocumentoId, ref.fileFieldName);
        return { ref, localPath: f.path, mime: f.mime };
      }),
    );
    const downloads: { ref: typeof job.input.documentos[number]; localPath: string; mime: string }[] = [];
    settled.forEach((s, idx) => {
      const ref = job.input.documentos[idx]!;
      if (s.status === "fulfilled") {
        downloads.push(s.value);
      } else {
        const msg = compactErr(s.reason);
        log.warn({ ref: ref.subirDocumentoId, err: msg }, "download failed");
        for (const creds of job.input.formasEnvio) {
          allResults.push({
            formaEnvioId: creds.formaEnvioId,
            plantillaId: ref.plantillaId,
            subirDocumentoId: ref.subirDocumentoId,
            status: "fail",
            message: `download failed: ${msg}`,
          });
        }
      }
    });

    if (downloads.length > 0) {
      for (const creds of job.input.formasEnvio) {
        const adapter = pickAdapter(creds);
        log.info({ adapter: adapter.name, host: safeHost(creds.url) }, "running adapter");
        try {
          const r = await adapter.upload({ creds, documentos: downloads });
          allResults.push(...r);
        } catch (e) {
          const msg = compactErr(e);
          log.error({ adapter: adapter.name, err: msg }, "adapter crashed");
          for (const d of downloads) {
            allResults.push({
              formaEnvioId: creds.formaEnvioId,
              plantillaId: d.ref.plantillaId,
              subirDocumentoId: d.ref.subirDocumentoId,
              status: "fail",
              message: `adapter crashed: ${msg}`,
            });
          }
        }
      }
    }
    job.results = allResults;
    job.status = allResults.every((r) => r.status === "fail") && allResults.length > 0 ? "failed" : "done";
  } catch (e) {
    job.status = "failed";
    job.error = compactErr(e);
    job.results = allResults;
    log.error({ err: job.error }, "job failed");
  } finally {
    job.finishedAt = Date.now();
    try {
      await postCallback({
        job_id: job.id,
        cliente_id: job.input.clienteId,
        status: job.status,
        error: job.error ?? null,
        results: job.results,
      });
    } catch (e) {
      log.error({ err: e }, "callback failed");
    }
  }
}

function safeHost(u: string): string {
  try { return new URL(u).host; } catch { return u; }
}

function compactErr(e: unknown): string {
  const err = e as { response?: { status?: number; data?: unknown }; message?: string };
  if (err?.response) {
    let data: string;
    try {
      data = typeof err.response.data === "string"
        ? err.response.data
        : JSON.stringify(err.response.data ?? {}).slice(0, 200);
    } catch {
      data = "<unserializable>";
    }
    return `HTTP ${err.response.status}: ${data}`;
  }
  return err?.message ?? String(e);
}
