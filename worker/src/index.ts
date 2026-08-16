import express, { type Request, type Response, type NextFunction } from "express";
import { cfg } from "./config.js";
import { logger } from "./logger.js";
import { enqueue, getJob } from "./queue.js";
import type { UploadJobInput } from "./types.js";
import { uiRouter } from "./ui.js";

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use("/ui", uiRouter);

function auth(req: Request, res: Response, next: NextFunction): void {
  const provided = req.header("x-worker-secret") ?? "";
  if (provided !== cfg.sharedSecret) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.post("/jobs", auth, (req, res) => {
  const input = req.body as Partial<UploadJobInput>;
  if (!input?.clienteId || !Array.isArray(input.formasEnvio) || !Array.isArray(input.documentos)) {
    res.status(400).json({ error: "missing clienteId / formasEnvio[] / documentos[]" });
    return;
  }
  if (input.formasEnvio.length === 0) {
    res.status(400).json({ error: "formasEnvio is empty" });
    return;
  }
  if (input.documentos.length === 0) {
    res.status(400).json({ error: "documentos is empty" });
    return;
  }
  const job = enqueue(input as UploadJobInput);
  res.status(202).json({ job_id: job.id, status: job.status });
});

app.get("/jobs/:id", auth, (req, res) => {
  const id = req.params.id;
  const job = getJob(typeof id === "string" ? id : "");
  if (!job) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({
    job_id: job.id,
    status: job.status,
    error: job.error ?? null,
    results: job.results,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
  });
});

app.listen(cfg.port, () => {
  logger.info({ port: cfg.port }, "worker listening");
});
