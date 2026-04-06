/**
 * Builds a single PDF from the complete manual (INDEX + A + B + C + D).
 * Usage: node build-full-pdf.mjs
 * Requires: Google Chrome installed at the default Windows path.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const modules = [
  { file: 'INDEX.md',            title: 'Índice General' },
  { file: 'A-portal-empleado.md', title: 'Módulo A — Portal del Empleado' },
  { file: 'B-panel-rrhh.md',     title: 'Módulo B — Panel RRHH' },
  { file: 'C-prl-cae.md',        title: 'Módulo C — Sección PRL / CAE' },
  { file: 'D-administracion.md',  title: 'Módulo D — Administración' },
];

const htmlPath = resolve(__dirname, 'manual-completo.html');
const pdfPath  = resolve(__dirname, 'manual-completo.pdf');

// ── Markdown → HTML (simple, no-deps) ──────────────────────────────
function mdToHtml(md) {
  let html = md;

  // Protect code blocks
  const codeBlocks = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const i = codeBlocks.length;
    codeBlocks.push(`<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`);
    return `%%CODEBLOCK_${i}%%`;
  });

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Bold & italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Images — embed as base64 so Chrome headless can render them
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const imgPath = resolve(__dirname, src);
    if (existsSync(imgPath)) {
      const data = readFileSync(imgPath).toString('base64');
      const ext = src.split('.').pop().toLowerCase();
      const mime = ext === 'jpg' ? 'jpeg' : ext;
      return `<img src="data:image/${mime};base64,${data}" alt="${alt}" class="screenshot">`;
    }
    return `<p><em>[Imagen no encontrada: ${alt}]</em></p>`;
  });

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/gm, (_, header, sep, body) => {
    const thCells = header.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
    const rows = body.trim().split('\n').map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('\n');
    return `<table><thead><tr>${thCells}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<oli>$1</oli>');
  html = html.replace(/((?:<oli>.*<\/oli>\n?)+)/g, (match) => {
    return '<ol>' + match.replace(/<\/?oli>/g, t => t.replace('oli', 'li')) + '</ol>';
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Paragraphs — wrap orphan text lines
  html = html.replace(/^(?!<[a-z/]|%%CODEBLOCK)(.+)$/gm, '<p>$1</p>');

  // Restore code blocks
  codeBlocks.forEach((block, i) => {
    html = html.replace(`%%CODEBLOCK_${i}%%`, block);
  });

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

// ── Build combined HTML ────────────────────────────────────────────
let bodyParts = [];

for (const mod of modules) {
  const mdPath = resolve(__dirname, mod.file);
  if (!existsSync(mdPath)) {
    console.warn(`WARN: ${mod.file} not found, skipping`);
    continue;
  }
  const md = readFileSync(mdPath, 'utf-8');
  const html = mdToHtml(md);
  // Each module starts on a new page (except first)
  if (bodyParts.length > 0) {
    bodyParts.push('<div class="module-break"></div>');
  }
  bodyParts.push(`<section class="module">\n${html}\n</section>`);
  console.log(`  + ${mod.file} (${md.length} chars)`);
}

const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Manual Completo — Gestión de Recursos Humanos</title>
<style>
  @page {
    size: A4;
    margin: 20mm 18mm 25mm 18mm;
  }
  body {
    font-family: 'Segoe UI', Calibri, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #1a1a1a;
    max-width: 100%;
  }

  /* Cover page */
  .cover {
    text-align: center;
    padding-top: 100px;
    page-break-after: always;
  }
  .cover h1 {
    font-size: 30pt;
    color: #1C3A5E;
    border: none;
    margin-bottom: 16px;
    line-height: 1.2;
  }
  .cover .subtitle {
    font-size: 15pt;
    color: #555;
    margin: 8px 0;
  }
  .cover .org {
    font-size: 13pt;
    color: #777;
    margin-top: 30px;
  }
  .cover .url {
    font-size: 13pt;
    color: #1C3A5E;
    margin-top: 24px;
    font-weight: 600;
  }
  .cover .version {
    font-size: 11pt;
    color: #999;
    margin-top: 50px;
  }
  .cover .logo-bar {
    margin-top: 60px;
    border-top: 4px solid #1C3A5E;
    padding-top: 16px;
    font-size: 10pt;
    color: #888;
  }

  /* Module breaks */
  .module-break {
    page-break-before: always;
  }

  /* Headings */
  h1 {
    font-size: 22pt;
    color: #1C3A5E;
    border-bottom: 3px solid #1C3A5E;
    padding-bottom: 6px;
    margin-top: 0;
    page-break-after: avoid;
  }
  h2 {
    font-size: 16pt;
    color: #1C3A5E;
    border-bottom: 1px solid #ccc;
    padding-bottom: 4px;
    margin-top: 28px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 13pt;
    color: #2d5a8e;
    margin-top: 18px;
    page-break-after: avoid;
  }
  h4 {
    font-size: 11.5pt;
    color: #2d5a8e;
    margin-top: 14px;
    page-break-after: avoid;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 16px 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  th {
    background: #1C3A5E;
    color: white;
    text-align: left;
    padding: 6px 10px;
    font-weight: 600;
  }
  td {
    border: 1px solid #ddd;
    padding: 5px 10px;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background: #f8f9fa;
  }

  /* Blockquotes */
  blockquote {
    background: #f0f7ff;
    border-left: 4px solid #2d5a8e;
    padding: 10px 14px;
    margin: 12px 0;
    font-size: 10pt;
    color: #333;
    page-break-inside: avoid;
  }

  /* Images */
  img.screenshot {
    max-width: 100%;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin: 10px 0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  }

  /* Code */
  code {
    background: #f0f0f0;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 9pt;
    font-family: Consolas, 'Courier New', monospace;
  }
  pre {
    background: #f5f5f5;
    border: 1px solid #ddd;
    padding: 10px;
    border-radius: 4px;
    font-size: 8.5pt;
    overflow-x: auto;
    page-break-inside: avoid;
  }
  pre code {
    background: none;
    padding: 0;
  }

  /* Other */
  hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin: 3px 0; }
  a { color: #2d5a8e; text-decoration: none; }
  p { margin: 6px 0; }

  .footer-note {
    text-align: center;
    color: #888;
    font-size: 9pt;
    margin-top: 40px;
    border-top: 1px solid #ddd;
    padding-top: 10px;
  }
</style>
</head>
<body>

<div class="cover">
  <h1>Manual de Usuario</h1>
  <div class="subtitle">Gestión de Recursos Humanos</div>
  <div class="subtitle">Plataforma Zoho Creator</div>
  <div class="org">DOMO21 / Sicma21</div>
  <div class="url">https://domo21.zohocreatorportal.com</div>
  <div class="version">Versión 1.0 — Marzo 2026</div>
  <div class="logo-bar">
    Módulo A: Portal del Empleado &nbsp;|&nbsp;
    Módulo B: Panel RRHH &nbsp;|&nbsp;
    Módulo C: PRL / CAE &nbsp;|&nbsp;
    Módulo D: Administración
  </div>
</div>

${bodyParts.join('\n\n')}

<div class="footer-note">
  Manual generado el ${today} — Gestión de Recursos Humanos v2026<br>
  DOMO21 / Sicma21
</div>

</body>
</html>`;

writeFileSync(htmlPath, fullHtml, 'utf-8');
console.log(`\nHTML written to: ${htmlPath}`);

// ── Generate PDF via Chrome headless ───────────────────────────────
const chrome = '"C:/Program Files/Google/Chrome/Application/chrome.exe"';
const cmd = `${chrome} --headless --disable-gpu --no-sandbox --print-to-pdf="${pdfPath}" --print-to-pdf-no-header "${htmlPath}"`;

try {
  execSync(cmd, { timeout: 60000, stdio: 'pipe' });
} catch (e) {
  // Chrome headless sometimes exits with code 1 but still produces the PDF
}

if (existsSync(pdfPath)) {
  const size = (statSync(pdfPath).size / 1024 / 1024).toFixed(1);
  console.log(`PDF written to: ${pdfPath} (${size} MB)`);
} else {
  console.error('ERROR: Failed to generate PDF');
  process.exit(1);
}
