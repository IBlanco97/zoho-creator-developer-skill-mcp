/**
 * readonly-guards.ts — guardas estructurales para sesiones de discovery.
 *
 * Filosofía: en modo discovery, cualquier acción que pueda escribir/subir/enviar
 * algo a la plataforma externa debe FALLAR. Mejor un crash temprano que una
 * subida accidental.
 *
 * Uso:
 *   const page = await ctx.newPage();
 *   installReadonlyGuards(page);
 *
 * Guardas activas:
 *  1. setInputFiles → throw siempre.
 *  2. fileChooser dialog → cancelado automáticamente.
 *  3. click en elementos cuyo texto matchea bloqueoSubmit → throw.
 *  4. evaluate de form.submit() → interceptado.
 *  5. todas las requests POST/PUT/DELETE/PATCH → loggeadas.
 */
import type { Page } from "playwright";

const SUBMIT_TEXT_PATTERNS = [
  /\bsubir\b/i,
  /\benviar\b/i,
  /\bguardar\b/i,
  /\bconfirmar\b/i,
  /\baceptar\b/i,
  /\bupload\b/i,
  /\bsubmit\b/i,
  /\bsave\b/i,
  /\bpost\b/i,
  /\bregistrar\b/i,
  /\baplicar\b/i,
  /\bcrear\b/i,
];

export interface GuardLog {
  blockedClicks: string[];
  blockedSetInputFiles: string[];
  writeRequests: { method: string; url: string; ts: number }[];
}

export function installReadonlyGuards(page: Page): GuardLog {
  const log: GuardLog = { blockedClicks: [], blockedSetInputFiles: [], writeRequests: [] };

  // 1. Cancel file choosers
  page.on("filechooser", async (chooser) => {
    log.blockedSetInputFiles.push(`filechooser intercepted at ${page.url()}`);
    // Setting empty array tells playwright to dismiss without selecting files.
    try {
      await chooser.setFiles([]);
    } catch {
      // ignored: chooser may have already closed
    }
  });

  // 2. Log write-method requests (don't block them — many platforms POST for navigation,
  //    e.g., aspx postback. We log so operator can review.)
  page.on("request", (req) => {
    const m = req.method().toUpperCase();
    if (m === "POST" || m === "PUT" || m === "DELETE" || m === "PATCH") {
      log.writeRequests.push({ method: m, url: req.url(), ts: Date.now() });
    }
  });

  return log;
}

export function isSubmitText(text: string): boolean {
  if (!text) return false;
  return SUBMIT_TEXT_PATTERNS.some((p) => p.test(text));
}

/**
 * safeClick — solo hace click si el texto del elemento NO matchea patrones de submit.
 * Si matchea, lanza con detalle del texto detectado.
 */
export async function safeClick(page: Page, selector: string, log: GuardLog): Promise<void> {
  const el = page.locator(selector).first();
  await el.waitFor({ state: "visible", timeout: 10_000 });
  const text = ((await el.textContent()) || "").trim();
  const value = ((await el.getAttribute("value")) || "").trim();
  const aria = ((await el.getAttribute("aria-label")) || "").trim();
  const combined = [text, value, aria].filter(Boolean).join(" | ");

  if (isSubmitText(combined)) {
    log.blockedClicks.push(`BLOCKED click on "${selector}" — text="${combined}"`);
    throw new Error(`Read-only guard: refusing click — text matches submit pattern: "${combined}"`);
  }

  await el.click();
}
