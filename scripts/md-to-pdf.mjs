import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(text) {
  // links ![alt](src) and [text](href) first
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, src) => `<img alt="${escapeHtml(alt)}" src="${src}">`);
  text = text.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (m, label, href) => `<a href="${href}">${label}</a>`);
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  return text;
}

function mdToHtml(md, baseDir) {
  const lines = md.split(/\r?\n/);
  let html = '';
  let inTable = false;
  let tableHeader = null;
  let inList = null; // 'ul' | 'ol'
  let inBlockquote = false;

  function closeList() {
    if (inList) { html += `</${inList}>\n`; inList = null; }
  }
  function closeTable() {
    if (inTable) { html += '</tbody></table>\n'; inTable = false; tableHeader = null; }
  }
  function closeBlockquote() {
    if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (/^\s*$/.test(line)) {
      closeList();
      closeTable();
      closeBlockquote();
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      closeList(); closeTable(); closeBlockquote();
      html += '<hr>\n';
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeList(); closeTable(); closeBlockquote();
      const level = h[1].length;
      html += `<h${level}>${inline(h[2])}</h${level}>\n`;
      continue;
    }

    if (/^\s*>/.test(line)) {
      if (!inBlockquote) { html += '<blockquote>\n'; inBlockquote = true; }
      html += `<p>${inline(line.replace(/^\s*>\s?/, ''))}</p>\n`;
      continue;
    } else if (inBlockquote) {
      closeBlockquote();
    }

    // tables
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const next = lines[i + 1] || '';
      if (!inTable && /^\s*\|?[\s:|-]+\|?\s*$/.test(next) && /-/.test(next)) {
        closeList();
        const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        html += '<table><thead><tr>' + cells.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>\n';
        inTable = true;
        i++; // skip separator row
        continue;
      } else if (inTable) {
        const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        html += '<tr>' + cells.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>\n';
        continue;
      }
    } else if (inTable) {
      closeTable();
    }

    // lists
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ol) {
      if (inList && inList !== 'ol') closeList();
      if (!inList) { html += '<ol>\n'; inList = 'ol'; }
      html += `<li>${inline(ol[1])}</li>\n`;
      continue;
    } else if (ul) {
      if (inList && inList !== 'ul') closeList();
      if (!inList) { html += '<ul>\n'; inList = 'ul'; }
      html += `<li>${inline(ul[1])}</li>\n`;
      continue;
    } else if (inList) {
      closeList();
    }

    // italic full-line (e.g. footer)
    if (/^\*[^*].*[^*]\*$/.test(line.trim())) {
      html += `<p><em>${inline(line.trim().slice(1, -1))}</em></p>\n`;
      continue;
    }

    html += `<p>${inline(line)}</p>\n`;
  }
  closeList(); closeTable(); closeBlockquote();

  // resolve relative image paths to absolute file:// URLs
  html = html.replace(/src="([^"]+)"/g, (m, src) => {
    if (/^https?:\/\//.test(src) || src.startsWith('file://')) return m;
    const abs = resolve(baseDir, src);
    return `src="${pathToFileURL(abs).href}"`;
  });

  return html;
}

const CSS = `
@page { size: A4; margin: 20mm 18mm; }
body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; }
h1 { font-size: 20pt; border-bottom: 3px solid #2b6cb0; padding-bottom: 6px; margin-top: 0; }
h2 { font-size: 15pt; color: #2b6cb0; border-bottom: 1px solid #cbd5e0; padding-bottom: 3px; margin-top: 28px; page-break-after: avoid; }
h3 { font-size: 12.5pt; color: #234; margin-top: 18px; page-break-after: avoid; }
p { margin: 6px 0; }
a { color: #2b6cb0; text-decoration: none; }
code { background: #f0f2f5; padding: 1px 5px; border-radius: 3px; font-family: Consolas, monospace; font-size: 0.92em; }
table { border-collapse: collapse; width: 100%; margin: 10px 0 16px; font-size: 9.8pt; }
th, td { border: 1px solid #cbd5e0; padding: 5px 8px; text-align: left; vertical-align: top; }
th { background: #edf2f7; }
blockquote { border-left: 4px solid #ecc94b; background: #fffbea; margin: 10px 0; padding: 8px 14px; }
ul, ol { margin: 6px 0; padding-left: 24px; }
li { margin: 3px 0; }
hr { border: none; border-top: 1px solid #cbd5e0; margin: 20px 0; }
img { max-width: 100%; border: 1px solid #d0d7de; border-radius: 4px; margin: 8px 0 14px; display: block; }
strong { color: #1a202c; }
`;

async function convert(mdPath, pdfPath) {
  const baseDir = dirname(mdPath);
  const md = readFileSync(mdPath, 'utf-8');
  const body = mdToHtml(md, baseDir);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '18mm', left: '18mm', right: '18mm' },
  });
  await browser.close();
  console.log('OK ->', pdfPath);
}

const [, , mdPath, pdfPath] = process.argv;
if (!mdPath || !pdfPath) {
  console.error('Uso: node md-to-pdf.mjs <input.md> <output.pdf>');
  process.exit(1);
}
if (!existsSync(mdPath)) {
  console.error('No existe:', mdPath);
  process.exit(1);
}
convert(resolve(mdPath), resolve(pdfPath));
