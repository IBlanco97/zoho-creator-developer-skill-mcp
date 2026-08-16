import { chromium, type Browser } from "playwright";
import type { PlatformAdapter, UploadResultItem } from "../types.js";
import { cfg } from "../config.js";

export const ctaimaAdapter: PlatformAdapter = {
  name: "ctaima",
  match: (creds) => /ctaima|ctaimacae/i.test(creds.url),

  async upload({ creds, documentos }) {
    const results: UploadResultItem[] = [];
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: cfg.headless });
      const ctx = await browser.newContext();
      const page = await ctx.newPage();

      await page.goto(creds.url, { waitUntil: "domcontentloaded" });

      // TODO: real selectors — these are placeholders captured from a manual login walkthrough
      await page.fill('input[name="username"]', creds.usuario);
      await page.fill('input[name="password"]', creds.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState("networkidle");

      for (const d of documentos) {
        try {
          // TODO: navigate to "Subir documento" flow per CTAIMA UI; this is a stub
          await page.goto(new URL("/documentos/subir", creds.url).toString());
          await page.setInputFiles('input[type="file"]', d.localPath);
          await page.fill('input[name="codigo_modelo"]', d.ref.plantillaNombre);
          await page.click('button:has-text("Subir")');
          await page.waitForSelector('text=Subido correctamente', { timeout: 30_000 });

          results.push({
            formaEnvioId: creds.formaEnvioId,
            plantillaId: d.ref.plantillaId,
            subirDocumentoId: d.ref.subirDocumentoId,
            status: "ok",
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
    } finally {
      if (browser) await browser.close();
    }
    return results;
  },
};
