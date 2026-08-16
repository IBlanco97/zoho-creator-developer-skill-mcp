/**
 * discover-ctaima.mts — sesión de exploración read-only en CTAIMA.
 *
 * Objetivo:
 *   1. Login con credenciales reales (de Zoho Forma de Envío).
 *   2. Navegar a la zona "Mis documentos" / área de subida.
 *   3. Capturar selectores estables de cada elemento de interés.
 *   4. Guardar evidencia: screenshot + HTML + write-requests por paso.
 *   5. Logout.
 *
 * Estricto: NO hace setInputFiles, NO clickea botones submit/subir/enviar.
 *
 * Uso:
 *   npx tsx worker/scripts/discover-ctaima.mts [accountIndex]
 *   accountIndex defaults to 0 (cae@sicma21.com).
 *
 * Output: worker/discovery/ctaima/<timestamp>/
 *   - 01-login.png, 01-login.html, 01-login.network.json
 *   - 02-dashboard.png, ...
 *   - report.md (resumen humano-legible)
 */
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { installReadonlyGuards, type GuardLog } from "./readonly-guards.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const WORKER_ROOT = path.resolve(here, "..");
const DISCOVERY_ROOT = path.join(WORKER_ROOT, "discovery", "ctaima");

interface CtaimaCred {
  formaEnvioId: string;
  nombre: string;
  url: string;
  usuario: string;
  password: string;
}

function fetchCreds(): CtaimaCred[] {
  // Re-use fetch-ctaima-creds.mts to avoid duplicating Zoho auth logic.
  const json = execSync(`npx tsx ${path.join(here, "fetch-ctaima-creds.mts")}`, {
    cwd: WORKER_ROOT,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  // The script prints stderr lines first then JSON on stdout.
  const start = json.indexOf("[");
  if (start < 0) throw new Error("No JSON output from fetch-ctaima-creds.mts");
  return JSON.parse(json.slice(start));
}

async function snapshot(page: import("playwright").Page, dir: string, label: string, log: GuardLog): Promise<void> {
  const stem = path.join(dir, label);
  await page.screenshot({ path: `${stem}.png`, fullPage: true });
  const html = await page.content();
  await writeFile(`${stem}.html`, html, "utf-8");
  // Snapshot the write-requests captured up to now and reset the array
  await writeFile(
    `${stem}.network.json`,
    JSON.stringify({ url: page.url(), title: await page.title(), writeRequests: log.writeRequests.slice() }, null, 2),
    "utf-8"
  );
  console.log(`  📸 ${label}.{png,html,network.json}`);
}

async function main() {
  const accountIndex = Number(process.argv[2] || "0");
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(DISCOVERY_ROOT, ts);
  await mkdir(outDir, { recursive: true });

  console.log(`Discovery output → ${outDir}`);
  console.log("Fetching credentials from Zoho…");
  const creds = fetchCreds();
  if (creds.length === 0) throw new Error("No CTAIMA credentials available in Zoho");
  if (accountIndex >= creds.length) throw new Error(`accountIndex ${accountIndex} out of range (only ${creds.length} accounts)`);
  const cred = creds[accountIndex];
  console.log(`Using account: ${cred.usuario} (formaEnvioId=${cred.formaEnvioId})`);

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const log = installReadonlyGuards(page);

  const steps: { label: string; url: string; notes?: string }[] = [];

  try {
    // STEP 1 — landing
    console.log("STEP 1: GET landing page");
    await page.goto(cred.url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await snapshot(page, outDir, "01-landing", log);
    steps.push({ label: "01-landing", url: page.url() });

    // STEP 2 — wait for human-driven login
    //
    // Rationale: CTAIMA's login often involves a second factor or a captcha that
    // automation can't reliably handle. Instead of risking lockout, we let the
    // operator complete the login interactively while we observe the resulting URL.
    console.log("\n👤 OPERATOR: Por favor logueate manualmente con:");
    console.log(`   Usuario:    ${cred.usuario}`);
    console.log(`   Contraseña: ${cred.password}`);
    console.log(`   (creds copiables; pegar en el navegador. NO subir ningún documento.)`);
    console.log("\n   Cuando estés en el dashboard / pantalla post-login, pulsa ENTER aquí.");
    process.stdin.resume();
    await new Promise<void>((resolve) => {
      const handler = () => {
        process.stdin.removeListener("data", handler);
        process.stdin.pause();
        resolve();
      };
      process.stdin.on("data", handler);
    });

    await snapshot(page, outDir, "02-post-login", log);
    steps.push({ label: "02-post-login", url: page.url(), notes: "post-login URL — usar como check de sesión iniciada" });

    // STEP 3 — let operator navigate to "Mis documentos" / "Documentación" area
    console.log("\n👤 OPERATOR: Navega manualmente a la sección donde se SUBEN documentos");
    console.log("   (NO subas nada — solo ve hasta el formulario de subida).");
    console.log("   Pulsa ENTER cuando estés en la pantalla del formulario de subida.");
    process.stdin.resume();
    await new Promise<void>((resolve) => {
      const handler = () => {
        process.stdin.removeListener("data", handler);
        process.stdin.pause();
        resolve();
      };
      process.stdin.on("data", handler);
    });

    await snapshot(page, outDir, "03-upload-screen", log);
    steps.push({ label: "03-upload-screen", url: page.url(), notes: "URL del formulario de subida — es el endpoint que el adapter debe alcanzar tras login" });

    // STEP 4 — capture form structure
    console.log("\nSTEP 4: Capturando estructura del formulario de subida…");
    const formStructure = await page.evaluate(() => {
      function describe(el: Element): Record<string, string> {
        return {
          tag: el.tagName,
          id: el.id,
          name: (el as HTMLInputElement).name || "",
          type: (el as HTMLInputElement).type || "",
          placeholder: (el as HTMLInputElement).placeholder || "",
          ariaLabel: el.getAttribute("aria-label") || "",
          label: (el.closest("label")?.textContent || "").trim().slice(0, 80),
          xpath: ((): string => {
            // Build a simple xpath
            let path = "";
            let node: Element | null = el;
            while (node && node.nodeType === 1) {
              const idx = Array.from(node.parentNode?.children || []).filter((c) => c.tagName === node!.tagName).indexOf(node) + 1;
              path = `/${node.tagName.toLowerCase()}[${idx}]${path}`;
              node = node.parentElement;
            }
            return path;
          })(),
          cssClass: (el.className || "").toString().slice(0, 100),
        };
      }
      const inputs = [...document.querySelectorAll("input, select, textarea, button[type='submit'], a.btn, button")];
      return inputs.map(describe);
    });
    await writeFile(path.join(outDir, "04-form-structure.json"), JSON.stringify(formStructure, null, 2), "utf-8");
    console.log(`  📋 04-form-structure.json (${formStructure.length} elementos)`);
    steps.push({ label: "04-form-structure", url: page.url(), notes: `${formStructure.length} elementos identificados — ver JSON para selectores propuestos` });

    // STEP 5 — logout (manual to avoid wrong-button click)
    console.log("\n👤 OPERATOR: Por favor cierra sesión manualmente (logout). Pulsa ENTER cuando hayas vuelto a la pantalla de login.");
    process.stdin.resume();
    await new Promise<void>((resolve) => {
      const handler = () => {
        process.stdin.removeListener("data", handler);
        process.stdin.pause();
        resolve();
      };
      process.stdin.on("data", handler);
    });

    await snapshot(page, outDir, "05-post-logout", log);
    steps.push({ label: "05-post-logout", url: page.url() });

    // FINAL — write summary report
    const report = `# CTAIMA Discovery — ${ts}

Account: \`${cred.usuario}\`
Forma de Envío ID: \`${cred.formaEnvioId}\`
Landing URL: ${cred.url}

## Steps captured
${steps.map((s) => `- **${s.label}** — \`${s.url}\`${s.notes ? `\n  - ${s.notes}` : ""}`).join("\n")}

## Read-only guard log
- Blocked clicks: ${log.blockedClicks.length}
- Blocked file inputs: ${log.blockedSetInputFiles.length}
- Write-method requests observed: ${log.writeRequests.length}

### Write requests (POST/PUT/DELETE/PATCH)
\`\`\`
${log.writeRequests.map((r) => `${r.method} ${r.url}`).join("\n")}
\`\`\`

## Next steps
1. Open \`04-form-structure.json\` and identify the file input (likely \`input[type="file"]\`) — the **link_name** of the document is typically encoded as a select or hidden input.
2. Map the URL transitions in \`steps\` to a navigation graph: \`landing → login submit → dashboard → upload form\`.
3. Review write-requests above — these are the actual API calls the platform makes when forms post. The adapter should reproduce them via \`page.click()\` rather than constructing them manually (the platform validates anti-CSRF tokens etc).
`;
    await writeFile(path.join(outDir, "report.md"), report, "utf-8");
    console.log(`\n✅ Discovery complete → ${outDir}`);
    console.log(`Report: ${path.join(outDir, "report.md")}`);
  } finally {
    await browser.close();
  }
}

main().catch((e: unknown) => {
  console.error("FATAL:", (e as Error).message);
  process.exit(1);
});
