/**
 * discover-platform.mts — sesión de exploración read-only generalizada.
 *
 * Versión generalizada de discover-ctaima.mts. Acepta el nombre de la plataforma
 * como parámetro y guarda los outputs en worker/discovery/<platform>/<timestamp>/.
 *
 * Estricto: NO setInputFiles, NO clicks en submit/Aceptar/Subir/Enviar.
 *
 * Uso:
 *   npx tsx worker/scripts/discover-platform.mts dokify [accountIndex]
 *   npx tsx worker/scripts/discover-platform.mts ucae [accountIndex]
 *
 * Output: worker/discovery/<platform>/<timestamp>/
 *   - 01-landing.{png,html,network.json}
 *   - 02-post-login.{png,html,network.json}
 *   - 03-upload-screen.{png,html,network.json}
 *   - 04-form-structure.json
 *   - 05-post-logout.{png,html,network.json}
 *   - report.md
 */
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { installReadonlyGuards, type GuardLog } from "./readonly-guards.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const WORKER_ROOT = path.resolve(here, "..");

interface PlatformCred {
  formaEnvioId: string;
  nombre: string;
  url: string;
  usuario: string;
  password: string;
  mailEnvio: string;
}

function fetchCreds(platform: string): PlatformCred[] {
  const json = execSync(
    `npx tsx ${path.join(here, "fetch-platform-creds.mts")} ${platform}`,
    { cwd: WORKER_ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
  );
  const start = json.indexOf("[");
  if (start < 0) throw new Error(`No JSON output from fetch-platform-creds.mts ${platform}`);
  return JSON.parse(json.slice(start));
}

async function snapshot(
  page: import("playwright").Page,
  dir: string,
  label: string,
  log: GuardLog
): Promise<void> {
  const stem = path.join(dir, label);
  await page.screenshot({ path: `${stem}.png`, fullPage: true });
  const html = await page.content();
  await writeFile(`${stem}.html`, html, "utf-8");
  await writeFile(
    `${stem}.network.json`,
    JSON.stringify(
      { url: page.url(), title: await page.title(), writeRequests: log.writeRequests.slice() },
      null,
      2
    ),
    "utf-8"
  );
  console.log(`  📸 ${label}.{png,html,network.json}`);
}

async function waitForOperator(prompt: string): Promise<void> {
  console.log(`\n👤 OPERATOR: ${prompt}`);
  console.log("   Pulsa ENTER cuando hayas completado el paso.");
  process.stdin.resume();
  await new Promise<void>((resolve) => {
    const handler = () => {
      process.stdin.removeListener("data", handler);
      process.stdin.pause();
      resolve();
    };
    process.stdin.on("data", handler);
  });
}

async function main() {
  const platform = process.argv[2];
  const accountIndex = Number(process.argv[3] || "0");
  if (!platform) {
    console.error("Usage: npx tsx discover-platform.mts <platform> [accountIndex]");
    console.error("Example: npx tsx discover-platform.mts dokify 0");
    process.exit(1);
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(WORKER_ROOT, "discovery", platform.toLowerCase(), ts);
  await mkdir(outDir, { recursive: true });

  console.log(`Discovery [${platform}] output → ${outDir}`);
  console.log("Fetching credentials from Zoho…");
  const creds = fetchCreds(platform);
  if (creds.length === 0) throw new Error(`No ${platform} credentials available in Zoho`);
  if (accountIndex >= creds.length)
    throw new Error(`accountIndex ${accountIndex} out of range (only ${creds.length} accounts)`);
  const cred = creds[accountIndex];
  console.log(`Using account: ${cred.usuario} (formaEnvioId=${cred.formaEnvioId})`);
  console.log(`Landing URL: ${cred.url}`);

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const log = installReadonlyGuards(page);

  const steps: { label: string; url: string; notes?: string }[] = [];

  try {
    console.log("STEP 1: GET landing page");
    await page.goto(cred.url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await snapshot(page, outDir, "01-landing", log);
    steps.push({ label: "01-landing", url: page.url() });

    console.log(`\n   Usuario:    ${cred.usuario}`);
    console.log(`   Contraseña: ${cred.password}`);
    console.log(`   (creds copiables; pegar en el navegador. NO subir ningún documento.)`);
    await waitForOperator("Logueate manualmente. Cuando estés en el dashboard, pulsa ENTER.");
    await snapshot(page, outDir, "02-post-login", log);
    steps.push({ label: "02-post-login", url: page.url(), notes: "post-login URL" });

    await waitForOperator(
      "Navega manualmente a la sección donde se SUBEN documentos (NO subas nada — solo abre el formulario)."
    );
    await snapshot(page, outDir, "03-upload-screen", log);
    steps.push({
      label: "03-upload-screen",
      url: page.url(),
      notes: "URL del formulario de subida",
    });

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
            let p = "";
            let node: Element | null = el;
            while (node && node.nodeType === 1) {
              const idx =
                Array.from(node.parentNode?.children || [])
                  .filter((c) => c.tagName === node!.tagName)
                  .indexOf(node) + 1;
              p = `/${node.tagName.toLowerCase()}[${idx}]${p}`;
              node = node.parentElement;
            }
            return p;
          })(),
          cssClass: (el.className || "").toString().slice(0, 100),
        };
      }
      const inputs = [
        ...document.querySelectorAll(
          "input, select, textarea, button[type='submit'], a.btn, button"
        ),
      ];
      return inputs.map(describe);
    });
    await writeFile(
      path.join(outDir, "04-form-structure.json"),
      JSON.stringify(formStructure, null, 2),
      "utf-8"
    );
    console.log(`  📋 04-form-structure.json (${formStructure.length} elementos)`);
    steps.push({
      label: "04-form-structure",
      url: page.url(),
      notes: `${formStructure.length} elementos identificados`,
    });

    await waitForOperator("Cierra sesión manualmente. Cuando vuelvas a la pantalla de login, pulsa ENTER.");
    await snapshot(page, outDir, "05-post-logout", log);
    steps.push({ label: "05-post-logout", url: page.url() });

    const report = `# ${platform} Discovery — ${ts}

Account: \`${cred.usuario}\`
Forma de Envío ID: \`${cred.formaEnvioId}\`
Landing URL: ${cred.url}

## Steps captured
${steps
  .map((s) => `- **${s.label}** — \`${s.url}\`${s.notes ? `\n  - ${s.notes}` : ""}`)
  .join("\n")}

## Read-only guard log
- Blocked clicks: ${log.blockedClicks.length}
- Blocked file inputs: ${log.blockedSetInputFiles.length}
- Write-method requests observed: ${log.writeRequests.length}

### Write requests (POST/PUT/DELETE/PATCH)
\`\`\`
${log.writeRequests.map((r) => `${r.method} ${r.url}`).join("\n")}
\`\`\`

## Next steps
1. Open \`04-form-structure.json\` y localiza el file input — el adapter deberá hacer setInputFiles ahí.
2. Mapea las URL transitions en \`steps\` para construir el grafo de navegación.
3. Revisa write-requests — son las llamadas reales del backend; el adapter debe reproducirlas via UI.
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
