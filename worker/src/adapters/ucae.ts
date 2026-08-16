import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { logger } from "../logger.js";
import type { DocumentRef, PlatformAdapter, PlatformCredentials, UploadResultItem } from "../types.js";

const log = logger.child({ adapter: "ucae" });

interface PendingDoc {
  clave: string;       // "idsolicitud--tipodoc" — required for upload POST
  codigo: string;      // UCAE doc code (e.g. "AG TRIBUT", "ITA")
  nombre: string;      // human-readable name
  ambito: string;      // "Empresa" | "Trabajador"
  tipo: string;        // "Laboral" | "PRL" | "Otros"
  trabajadorDni?: string;
}

class UcaeSession {
  private cookies = new Map<string, string>();
  constructor(private base: string) {}

  cookieHeader(): string {
    return Array.from(this.cookies.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
  }

  ingestSetCookie(headers: Headers): void {
    const setCookie = headers.getSetCookie?.() ?? [];
    for (const sc of setCookie) {
      const first = sc.split(";", 1)[0]!;
      const eq = first.indexOf("=");
      if (eq <= 0) continue;
      this.cookies.set(first.slice(0, eq).trim(), first.slice(eq + 1).trim());
    }
  }

  async request(path: string, init: RequestInit & { allowRedirect?: boolean } = {}): Promise<Response> {
    const url = new URL(path, this.base).toString();
    const headers = new Headers(init.headers);
    if (this.cookies.size > 0) headers.set("cookie", this.cookieHeader());
    const res = await fetch(url, {
      ...init,
      headers,
      redirect: init.allowRedirect === false ? "manual" : "follow",
    });
    this.ingestSetCookie(res.headers);
    return res;
  }

  async login(usuario: string, password: string): Promise<void> {
    // GET /login to prime SESSION cookie + extract _csrf token from form.
    const loginPage = await this.request("/login", { method: "GET" });
    const html = await loginPage.text();
    const csrfMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/i.exec(html);
    if (!csrfMatch) {
      throw new Error("UCAE login form: _csrf token not found (markup may have changed)");
    }
    const params: Record<string, string> = { _csrf: csrfMatch[1]!, username: usuario, password };
    const body = new URLSearchParams(params);
    const res = await this.request("/dologin", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      allowRedirect: false,
    });
    // UCAE redirects to /empresa/gestion on success, back to /login on failure.
    const location = res.headers.get("location") ?? "";
    if (res.status >= 400 || /\/login(\?|$)/.test(location)) {
      throw new Error(`UCAE login failed (status ${res.status}, location=${location || "none"})`);
    }
  }

  async listPending(idprincipal: string): Promise<PendingDoc[]> {
    const res = await this.request(`/empresa/contrata/documentacion/pendiente?q=${encodeURIComponent(idprincipal)}`);
    if (!res.ok) throw new Error(`UCAE pending list failed (HTTP ${res.status})`);
    return parsePendingTable(await res.text());
  }

  /**
   * GET a form page and extract its current `_csrf` token. Spring Security rotates
   * the token per session, so each POST must use the latest one.
   */
  private async fetchCsrf(formPath: string): Promise<string> {
    const res = await this.request(formPath);
    if (!res.ok) throw new Error(`failed to prime form ${formPath} (HTTP ${res.status})`);
    const html = await res.text();
    const m = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/i.exec(html);
    if (!m) throw new Error(`no _csrf token in form ${formPath}`);
    return m[1]!;
  }

  async uploadPerDoc(clave: string, fdocDdMmYyyy: string, file: { buf: Buffer; name: string; mime: string }): Promise<void> {
    const formPath = `/empresa/documentacion/docpendiente/carga?clave=${encodeURIComponent(clave)}`;
    const csrf = await this.fetchCsrf(formPath);
    const fd = new FormData();
    fd.append("_csrf", csrf);
    fd.append("clave", clave);
    fd.append("fdoc", fdocDdMmYyyy);
    fd.append("fichero", new Blob([new Uint8Array(file.buf)], { type: file.mime }), file.name);
    const res = await this.request(formPath, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`UCAE upload failed (HTTP ${res.status})`);
    const html = await res.text();
    if (/error|fall[oó]|denegad/i.test(html) && !/correctamente|guardado|subido/i.test(html)) {
      throw new Error("UCAE upload returned a likely error page");
    }
  }

  /**
   * Bulk SS upload — UCAE auto-classifies the file as ITA / RNT(TC2) / IDC by content
   * AND distributes it to every empresa vinculada that requires it. One POST replaces
   * many per-doc uploads. We do NOT pass `clave` here; the endpoint is global per-account.
   */
  async uploadBulkSs(file: { buf: Buffer; name: string; mime: string }): Promise<void> {
    const formPath = `/empresa/contrata/documentacion/upload`;
    const csrf = await this.fetchCsrf(formPath);
    const fd = new FormData();
    fd.append("_csrf", csrf);
    fd.append("fichero", new Blob([new Uint8Array(file.buf)], { type: file.mime }), file.name);
    const res = await this.request(formPath, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`UCAE bulk SS upload failed (HTTP ${res.status})`);
    const html = await res.text();
    if (/error|fall[oó]|denegad/i.test(html) && !/correctamente|guardado|subido|clasificad/i.test(html)) {
      throw new Error("UCAE bulk SS upload returned a likely error page");
    }
  }
}

/**
 * Parse UCAE pending-docs HTML table. Each row exposes BARE attributes
 * (rechazado, estado, clave, ambito, tipo) — UCAE uses non-standard attrs
 * directly on <tr>, NOT data-* prefix. Verified via discovery
 * 09-grid-structure.json + dumped pending-{idp}.html showing template row:
 *   <tr rechazado="..." estado="..." clave="..." ambito="..." tipo="...">
 */
function parsePendingTable(html: string): PendingDoc[] {
  const docs: PendingDoc[] = [];
  // Match <tr ...> opening tag with a `clave="X--Y"` attribute (composite key contains --),
  // and capture the row body. The template row uses placeholders like %CLAVE% so we
  // require the value to look like a real composite key (digits--digits).
  const rowRe = /<tr\b([^>]*\bclave="(\d+--\d+)"[^>]*)>([\s\S]*?)<\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(html)) !== null) {
    const attrs = m[1]!;
    const clave = m[2]!;
    const inner = m[3]!;
    const ambito = /\bambito="([^"]*)"/i.exec(attrs)?.[1] ?? "";
    const tipo = /\btipo="([^"]*)"/i.exec(attrs)?.[1] ?? "";
    const cells = Array.from(inner.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)).map((c) => stripHtml(c[1]!));
    // First non-empty cell with non-icon text is the code; second non-empty is the name.
    const meaningful = cells.filter((c) => c && !/^\s*$/.test(c));
    const codigo = meaningful[0] ?? "";
    const nombre = meaningful[1] ?? "";
    const trabajadorDni = ambito === "Trabajador"
      ? meaningful.find((c) => /^\d{7,8}[A-Z]$/.test(c.trim()))
      : undefined;
    docs.push({ clave, codigo, nombre, ambito, tipo, trabajadorDni });
  }
  return docs;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function toDdMmYyyy(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return toDdMmYyyy(undefined);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function pickPending(ref: DocumentRef, pending: PendingDoc[]): PendingDoc | undefined {
  // 1) match by remoteCodigo (canonical — Plantilla.Codigo_UCAE)
  if (ref.remoteCodigo) {
    const byCode = pending.filter((p) => p.codigo.trim().toLowerCase() === ref.remoteCodigo!.trim().toLowerCase());
    if (byCode.length === 1) return byCode[0];
    if (byCode.length > 1 && ref.scope === "trabajador" && ref.trabajadorDni) {
      return byCode.find((p) => p.trabajadorDni === ref.trabajadorDni) ?? byCode[0];
    }
    if (byCode.length > 1) return byCode[0];
  }
  // 2) fallback: best-effort name match (lower-cased substring).
  const needle = ref.plantillaNombre.toLowerCase();
  return pending.find((p) => p.nombre.toLowerCase().includes(needle) || needle.includes(p.nombre.toLowerCase()));
}

export const ucaeAdapter: PlatformAdapter = {
  name: "ucae",
  match: (creds: PlatformCredentials) => /ucae\.es/i.test(creds.url),
  async upload({ creds, documentos }): Promise<UploadResultItem[]> {
    const results: UploadResultItem[] = [];
    if (!creds.remoteClientId) {
      const msg = "missing remoteClientId (UCAE idprincipal) on Forma_de_Envío";
      log.warn({ formaEnvioId: creds.formaEnvioId }, msg);
      for (const d of documentos) {
        results.push({ formaEnvioId: creds.formaEnvioId, plantillaId: d.ref.plantillaId, subirDocumentoId: d.ref.subirDocumentoId, status: "fail", message: msg });
      }
      return results;
    }

    const session = new UcaeSession(new URL(creds.url).origin || "https://u5.ucae.es");
    try {
      await session.login(creds.usuario, creds.password);
    } catch (e) {
      const msg = (e as Error).message;
      for (const d of documentos) {
        results.push({ formaEnvioId: creds.formaEnvioId, plantillaId: d.ref.plantillaId, subirDocumentoId: d.ref.subirDocumentoId, status: "fail", message: msg });
      }
      return results;
    }

    let pending: PendingDoc[] = [];
    try {
      pending = await session.listPending(creds.remoteClientId);
      log.info({ count: pending.length, idprincipal: creds.remoteClientId }, "fetched pending docs");
    } catch (e) {
      const msg = (e as Error).message;
      for (const d of documentos) {
        results.push({ formaEnvioId: creds.formaEnvioId, plantillaId: d.ref.plantillaId, subirDocumentoId: d.ref.subirDocumentoId, status: "fail", message: msg });
      }
      return results;
    }

    for (const d of documentos) {
      // Path A: bulk SS — single POST, no clave needed, UCAE auto-distributes.
      if (d.ref.bulkSsUcae) {
        try {
          const buf = await readFile(d.localPath);
          await session.uploadBulkSs({ buf, name: basename(d.localPath), mime: d.mime });
          results.push({
            formaEnvioId: creds.formaEnvioId,
            plantillaId: d.ref.plantillaId,
            subirDocumentoId: d.ref.subirDocumentoId,
            status: "ok",
            message: "uploaded to UCAE bulk SS (auto-classified ITA/RNT/IDC)",
          });
        } catch (e) {
          results.push({
            formaEnvioId: creds.formaEnvioId,
            plantillaId: d.ref.plantillaId,
            subirDocumentoId: d.ref.subirDocumentoId,
            status: "fail",
            message: (e as Error).message,
          });
        }
        continue;
      }

      // Path B: per-doc — match against pending list, then POST per clave.
      const target = pickPending(d.ref, pending);
      if (!target) {
        results.push({
          formaEnvioId: creds.formaEnvioId,
          plantillaId: d.ref.plantillaId,
          subirDocumentoId: d.ref.subirDocumentoId,
          status: "skipped",
          message: `no pending UCAE doc matches plantilla='${d.ref.plantillaNombre}' codigo='${d.ref.remoteCodigo ?? ""}'`,
        });
        continue;
      }
      try {
        const buf = await readFile(d.localPath);
        const fdoc = toDdMmYyyy(d.ref.fechaCaducidad);
        await session.uploadPerDoc(target.clave, fdoc, { buf, name: basename(d.localPath), mime: d.mime });
        results.push({
          formaEnvioId: creds.formaEnvioId,
          plantillaId: d.ref.plantillaId,
          subirDocumentoId: d.ref.subirDocumentoId,
          status: "ok",
          remoteId: target.clave,
          message: `uploaded to UCAE [${target.codigo}]`,
        });
      } catch (e) {
        results.push({
          formaEnvioId: creds.formaEnvioId,
          plantillaId: d.ref.plantillaId,
          subirDocumentoId: d.ref.subirDocumentoId,
          status: "fail",
          message: (e as Error).message,
        });
      }
    }
    return results;
  },
};
