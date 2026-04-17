/**
 * Genera 2 funciones Deluge a partir de los 4 md del manual:
 *   - DevolverHTMLManualIndex(string q)
 *   - DevolverHTMLManualModulo(string mod, string q)
 *
 * Estas funciones devuelven HTML para embeber en HTML Snippets dentro de
 * las páginas `Manual_de_Usuario` y `Manual_de_Usuario_Modulo`.
 *
 * Uso: node build-deluge-wiki.mjs
 *      Salida: deluge-drafts/DevolverHTMLManualIndex.deluge
 *              deluge-drafts/DevolverHTMLManualModulo.deluge
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const outDir = resolve(repoRoot, 'deluge-drafts');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const modules = [
  { id: 'A', file: 'A-portal-empleado.md', title: 'Portal del Empleado',   icon: '👷', desc: 'Permisos, EPIs, mensajes, formaciones y datos personales — para trabajadores.' },
  { id: 'B', file: 'B-panel-rrhh.md',     title: 'Panel RRHH',             icon: '🏢', desc: 'Gestión de empleados, asignaciones, permisos, EPIs, mensajes y dashboards.' },
  { id: 'C', file: 'C-prl-cae.md',        title: 'Sección PRL / CAE',      icon: '🛡️', desc: 'Documentación de prevención, clientes, subidas y envíos.' },
  { id: 'D', file: 'D-administracion.md', title: 'Administración',          icon: '⚙️', desc: 'Usuarios, bajas, activos, WhatsApp, mapa y encuestas.' },
];

const quickTags = [
  'permisos', 'vacaciones', 'EPI', 'herramientas', 'ropa', 'activos',
  'documentos', 'clientes', 'caducidad', 'mensajes', 'chat',
  'asignaciones', 'técnico', 'empleado', 'formaciones',
  'WhatsApp', 'encuestas', 'configuración', 'notificaciones',
];

// ── utilidades ────────────────────────────────────────────────────
function slugify(s) {
  return s.toString()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Markdown → HTML (adaptado de build-full-pdf.mjs) ─────────────
// Devuelve HTML + lista de secciones {level, title, id} para el TOC
function mdToHtml(md, modId) {
  const sections = [];
  let html = md;

  // Proteger code blocks
  const codeBlocks = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const i = codeBlocks.length;
    codeBlocks.push(`<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`);
    return `%%CODEBLOCK_${i}%%`;
  });

  // Ignorar imágenes (sin imágenes en v1)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');

  // Headings con id para anclaje + captura TOC
  html = html.replace(/^#### (.+)$/gm, (_, t) => {
    const id = `${modId}-${slugify(t)}`;
    sections.push({ level: 4, title: t, id });
    return `<h4 id="${id}">${t}</h4>`;
  });
  html = html.replace(/^### (.+)$/gm, (_, t) => {
    const id = `${modId}-${slugify(t)}`;
    sections.push({ level: 3, title: t, id });
    return `<h3 id="${id}">${t}</h3>`;
  });
  html = html.replace(/^## (.+)$/gm, (_, t) => {
    const id = `${modId}-${slugify(t)}`;
    sections.push({ level: 2, title: t, id });
    return `<h2 id="${id}">${t}</h2>`;
  });
  html = html.replace(/^# (.+)$/gm, (_, t) => {
    const id = `${modId}-${slugify(t)}`;
    sections.push({ level: 1, title: t, id });
    return `<h1 id="${id}">${t}</h1>`;
  });

  // Reglas horizontales
  html = html.replace(/^---$/gm, '<hr>');

  // Negrita y cursiva
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Enlaces (externos; los internos # ya usan los ids generados)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const safeUrl = url.replace(/"/g, '&quot;');
    if (/^https?:/.test(url)) return `<a href="${safeUrl}" target="_blank" rel="noopener">${text}</a>`;
    // enlace interno ancla md → convertir a ancla nuestro id
    if (url.startsWith('#')) return `<a href="#${modId}-${slugify(url.slice(1))}">${text}</a>`;
    return `<a href="${safeUrl}">${text}</a>`;
  });

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

  // Listas desordenadas
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Listas ordenadas
  html = html.replace(/^\d+\. (.+)$/gm, '<oli>$1</oli>');
  html = html.replace(/((?:<oli>.*<\/oli>\n?)+)/g, (match) => {
    return '<ol>' + match.replace(/<\/?oli>/g, t => t.replace('oli', 'li')) + '</ol>';
  });

  // Código inline
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Párrafos — envolver líneas huérfanas
  html = html.replace(/^(?!<[a-z/]|%%CODEBLOCK)(.+)$/gm, '<p>$1</p>');

  // Restaurar code blocks
  codeBlocks.forEach((block, i) => { html = html.replace(`%%CODEBLOCK_${i}%%`, block); });

  // Limpiar párrafos vacíos
  html = html.replace(/<p>\s*<\/p>/g, '');

  return { html, sections };
}

// ── Parse módulos ────────────────────────────────────────────────
const parsed = modules.map(m => {
  const md = readFileSync(resolve(__dirname, m.file), 'utf-8');
  const { html, sections } = mdToHtml(md, m.id);
  return { ...m, html, sections, raw: md };
});

// ── Deluge helpers ────────────────────────────────────────────────
// Deluge strings must fit in una sola línea — collapse whitespace y escape.
function delugeStringChunks(s, chunkSize = 900) {
  const collapsed = s
    .replace(/\r?\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/  +/g, ' ');
  const escaped = collapsed
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
  const parts = [];
  for (let i = 0; i < escaped.length; i += chunkSize) {
    parts.push(escaped.slice(i, i + chunkSize));
  }
  return parts;
}

// Emite líneas Deluge: var = ""; var = var + "chunk1"; var = var + "chunk2"; ...
// `indent` es la indentación a aplicar a cada línea (sin duplicación).
function emitDelugeVar(varName, html, indent = '  ') {
  const chunks = delugeStringChunks(html);
  const lines = [`${indent}${varName} = "";`];
  for (const c of chunks) {
    lines.push(`${indent}${varName} = ${varName} + "${c}";`);
  }
  return lines.join('\n');
}

// ── CSS compartido ───────────────────────────────────────────────
// Mínimo, responsive, con estilos para mark/highlight y layouts.
const SHARED_CSS = `
<style>
.wk-root{font-family:'Segoe UI',Calibri,Arial,sans-serif;color:#1a1a1a;max-width:1200px;margin:0 auto;padding:16px;}
.wk-root h1{font-size:26px;color:#1C3A5E;border-bottom:3px solid #1C3A5E;padding-bottom:8px;margin:0 0 16px;}
.wk-root h2{font-size:20px;color:#1C3A5E;border-bottom:1px solid #ccc;padding-bottom:6px;margin:28px 0 12px;scroll-margin-top:16px;}
.wk-root h3{font-size:16px;color:#2d5a8e;margin:20px 0 10px;scroll-margin-top:16px;}
.wk-root h4{font-size:14px;color:#2d5a8e;margin:14px 0 8px;}
.wk-root p{line-height:1.6;margin:8px 0;}
.wk-root table{width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:13px;}
.wk-root th{background:#1C3A5E;color:#fff;text-align:left;padding:7px 10px;font-weight:600;}
.wk-root td{border:1px solid #ddd;padding:6px 10px;vertical-align:top;}
.wk-root tr:nth-child(even) td{background:#f8f9fa;}
.wk-root blockquote{background:#f0f7ff;border-left:4px solid #2d5a8e;padding:10px 14px;margin:12px 0;color:#333;}
.wk-root code{background:#f0f0f0;padding:1px 5px;border-radius:3px;font-size:12px;font-family:Consolas,'Courier New',monospace;}
.wk-root pre{background:#f5f5f5;border:1px solid #ddd;padding:10px;border-radius:4px;font-size:12px;overflow-x:auto;}
.wk-root a{color:#1C3A5E;}
.wk-root hr{border:0;border-top:1px solid #e0e0e0;margin:18px 0;}
.wk-root ul,.wk-root ol{line-height:1.6;}
.wk-root mark{background:#ffeb3b;padding:0 2px;border-radius:2px;}

/* header */
.wk-header{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.wk-title{font-size:26px;font-weight:700;color:#1C3A5E;margin:0;}
.wk-breadcrumb{font-size:13px;color:#666;}
.wk-breadcrumb a{color:#1C3A5E;text-decoration:none;}
.wk-breadcrumb a:hover{text-decoration:underline;}

/* search box */
.wk-search{background:#f5f7fb;border:1px solid #d9e0ec;border-radius:8px;padding:14px 16px;margin:16px 0;}
.wk-search-title{font-size:13px;color:#1C3A5E;font-weight:600;margin-bottom:8px;}
.wk-tags{display:flex;flex-wrap:wrap;gap:6px;}
.wk-tag{display:inline-block;padding:4px 10px;background:#fff;border:1px solid #c4cfe0;border-radius:14px;font-size:12px;color:#1C3A5E;text-decoration:none;}
.wk-tag:hover{background:#e7eef9;border-color:#1C3A5E;}
.wk-tag.active{background:#1C3A5E;color:#fff;border-color:#1C3A5E;}
.wk-search-hint{font-size:11px;color:#666;margin-top:8px;font-style:italic;}
.wk-search-clear{font-size:12px;color:#b33;text-decoration:none;margin-left:6px;}
.wk-search-clear:hover{text-decoration:underline;}

/* index cards */
.wk-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:20px;}
.wk-card{display:block;background:#fff;border:1px solid #d9e0ec;border-radius:8px;padding:18px;text-decoration:none;color:inherit;transition:all .15s;}
.wk-card:hover{border-color:#1C3A5E;box-shadow:0 2px 8px rgba(28,58,94,0.12);transform:translateY(-1px);}
.wk-card-icon{font-size:32px;margin-bottom:8px;}
.wk-card-title{font-size:16px;font-weight:700;color:#1C3A5E;margin:4px 0;}
.wk-card-desc{font-size:13px;color:#555;line-height:1.5;}
.wk-card-mod{font-size:11px;color:#999;font-weight:600;letter-spacing:.5px;}

/* search results */
.wk-results{margin-top:18px;}
.wk-result{background:#fff;border:1px solid #e0e6ef;border-radius:6px;padding:12px 14px;margin-bottom:8px;}
.wk-result-mod{display:inline-block;background:#e7eef9;color:#1C3A5E;font-size:11px;font-weight:600;padding:2px 7px;border-radius:3px;margin-right:8px;}
.wk-result-title{font-size:14px;color:#1C3A5E;text-decoration:none;font-weight:600;}
.wk-result-title:hover{text-decoration:underline;}
.wk-result-snippet{font-size:12px;color:#555;margin-top:4px;line-height:1.5;}
.wk-no-results{padding:24px;text-align:center;color:#888;font-style:italic;background:#fafbfd;border-radius:6px;}

/* module layout */
.wk-layout{display:grid;grid-template-columns:260px 1fr;gap:24px;margin-top:18px;}
@media (max-width: 900px){.wk-layout{grid-template-columns:1fr;}}
.wk-toc{background:#f5f7fb;border:1px solid #d9e0ec;border-radius:8px;padding:14px;position:sticky;top:12px;max-height:calc(100vh - 40px);overflow-y:auto;font-size:13px;}
.wk-toc-title{font-size:12px;font-weight:700;color:#1C3A5E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;}
.wk-toc ol{list-style:none;padding:0;margin:0;}
.wk-toc li{margin:3px 0;}
.wk-toc a{color:#333;text-decoration:none;display:block;padding:3px 6px;border-radius:3px;line-height:1.35;}
.wk-toc a:hover{background:#e7eef9;color:#1C3A5E;}
.wk-toc .lvl-3{padding-left:14px;font-size:12px;color:#666;}
.wk-toc .lvl-4{padding-left:26px;font-size:11px;color:#888;}
.wk-content{min-width:0;}
</style>
`.trim();

// ── INDEX ──────────────────────────────────────────────────────────
function buildIndexHtml() {
  // cards
  const cardsHtml = modules.map(m => `
    <a class="wk-card" href="#Page:Manual_de_Usuario_Modulo?Mod=${m.id}">
      <div class="wk-card-mod">MÓDULO ${m.id}</div>
      <div class="wk-card-icon">${m.icon}</div>
      <div class="wk-card-title">${escHtml(m.title)}</div>
      <div class="wk-card-desc">${escHtml(m.desc)}</div>
    </a>`).join('');

  const tagsHtml = quickTags.map(t =>
    `<a class="wk-tag" href="#Page:Manual_de_Usuario?Q=${encodeURIComponent(t)}">${escHtml(t)}</a>`
  ).join('');

  return `${SHARED_CSS}
<div class="wk-root">
  <div class="wk-header">
    <h1 class="wk-title">📚 Manual de Usuario</h1>
    <div class="wk-breadcrumb">Gestión de Recursos Humanos · v2026</div>
  </div>
  <p style="color:#555;margin-top:4px;">Guía completa de la aplicación organizada por perfiles de usuario. Selecciona un módulo para consultarlo, o usa los filtros rápidos para buscar un tema.</p>
  <div class="wk-search">
    <div class="wk-search-title">🔍 Búsqueda rápida</div>
    <div class="wk-tags">%%TAGS%%</div>
    <div class="wk-search-hint">💡 También puedes usar <b>Ctrl+F</b> dentro de cada módulo para buscar texto.</div>
  </div>
  <div class="wk-cards">%%CARDS%%</div>
  %%RESULTS_PLACEHOLDER%%
</div>`
    .replace('%%TAGS%%', tagsHtml)
    .replace('%%CARDS%%', cardsHtml);
}

// Agrupa secciones de todos los módulos para búsqueda global.
// Cada "ítem" es una sección de nivel 2 con su texto plano.
function buildSearchItems() {
  const items = [];
  for (const m of parsed) {
    // Parseamos el md para extraer bloques por ##
    const lines = m.raw.split('\n');
    let currentTitle = null, currentId = null, buffer = [];
    const flush = () => {
      if (currentTitle && buffer.length) {
        const text = buffer.join(' ').replace(/[#*`>|\-]+/g, ' ').replace(/\s+/g, ' ').trim();
        items.push({ modId: m.id, modTitle: m.title, title: currentTitle, id: currentId, text });
      }
    };
    for (const line of lines) {
      const h2 = line.match(/^## (.+)$/);
      if (h2) {
        flush();
        currentTitle = h2[1];
        currentId = `${m.id}-${slugify(currentTitle)}`;
        buffer = [];
      } else if (currentTitle && !line.startsWith('#')) {
        buffer.push(line);
      }
    }
    flush();
  }
  return items;
}

const searchItems = buildSearchItems();

// ── MODULE ────────────────────────────────────────────────────────
function buildModuleHtml(mod) {
  // TOC
  const tocHtml = mod.sections
    .filter(s => s.level === 2 || s.level === 3 || s.level === 4)
    .map(s => `<li class="lvl-${s.level}"><a href="#${s.id}">${escHtml(s.title)}</a></li>`).join('');

  const tagsHtml = quickTags.map(t =>
    `<a class="wk-tag" href="#Page:Manual_de_Usuario_Modulo?Mod=${mod.id}&Q=${encodeURIComponent(t)}">${escHtml(t)}</a>`
  ).join('');

  return `${SHARED_CSS}
<div class="wk-root">
  <div class="wk-breadcrumb">
    <a href="#Page:Manual_de_Usuario">📚 Manual de Usuario</a> › Módulo ${mod.id}
  </div>
  <div class="wk-header" style="margin-top:6px;">
    <h1 class="wk-title">${mod.icon} ${escHtml(mod.title)}</h1>
    <div class="wk-breadcrumb">
      %%PREV_NEXT%%
    </div>
  </div>
  <div class="wk-search">
    <div class="wk-search-title">🔍 Búsqueda rápida</div>
    <div class="wk-tags">%%TAGS%%</div>
    <div class="wk-search-hint">%%SEARCH_HINT%%</div>
  </div>
  <div class="wk-layout">
    <nav class="wk-toc">
      <div class="wk-toc-title">En esta página</div>
      <ol>%%TOC%%</ol>
    </nav>
    <div class="wk-content">
      %%CONTENT%%
    </div>
  </div>
</div>`
    .replace('%%TAGS%%', tagsHtml)
    .replace('%%TOC%%', tocHtml);
}

// ── highlight helper (runtime en Deluge) ──────────────────────────
// Esta lógica es demasiado compleja para Deluge: mejor la emitimos
// como reemplazo case-insensitive directo sobre el HTML completo,
// respetando HTML tags con un split simple.
// Dado que Deluge no soporta regex complejo, emitimos una lógica
// iterativa que split/rejoin en el término (case-insensitive).
// Ver plantillas en cada .deluge.

// ── Emitir DevolverHTMLManualIndex.deluge ─────────────────────────
function emitIndex() {
  const indexHtmlNoQ = buildIndexHtml().replace('%%RESULTS_PLACEHOLDER%%', '');

  // plantilla de resultado (por ítem)
  const resultsTopHtml = `${SHARED_CSS}
<div class="wk-root">
  <div class="wk-header">
    <h1 class="wk-title">📚 Manual de Usuario</h1>
    <div class="wk-breadcrumb"><a href="#Page:Manual_de_Usuario">← Volver al índice</a></div>
  </div>
  <div class="wk-search">
    <div class="wk-search-title">🔍 Resultados para "%%Q%%" <a class="wk-search-clear" href="#Page:Manual_de_Usuario">✕ limpiar</a></div>
    <div class="wk-tags">%%TAGS%%</div>
  </div>
  <div class="wk-results">`;
  const resultsBottomHtml = `</div></div>`;

  // Emitimos como Deluge
  const lines = [];
  lines.push(`/**
 * DevolverHTMLManualIndex(string q)
 * Devuelve el HTML del índice global del Manual de Usuario.
 * - Si q está vacío: muestra cards de los 4 módulos + tags clicables.
 * - Si q no está vacío: muestra lista de secciones coincidentes.
 * GENERADO AUTOMÁTICAMENTE por docs/manual/build-deluge-wiki.mjs
 */
string Calendario52HTML.DevolverHTMLManualIndex(string q)
{`);

  lines.push(`  qNorm = q.toLowerCase().trim();`);
  lines.push(`  if(qNorm == "" || qNorm == null)`);
  lines.push(`  {`);
  lines.push(emitDelugeVar('out', indexHtmlNoQ, '    '));
  lines.push(`    return out;`);
  lines.push(`  }`);

  // Rama con q: construir header
  lines.push(`  // con término de búsqueda`);
  lines.push(emitDelugeVar('out', resultsTopHtml, '  '));
  lines.push(`  out = out.replaceAll("%%Q%%", q);`);
  // tags inline (sin active dinámico)
  const tagsInline = quickTags.map(t =>
    `<a class="wk-tag" href="#Page:Manual_de_Usuario?Q=${encodeURIComponent(t)}">${escHtml(t)}</a>`
  ).join('');
  lines.push(emitDelugeVar('tagsHtml', tagsInline, '  '));
  lines.push(`  out = out.replaceAll("%%TAGS%%", tagsHtml);`);

  // Buscar en items
  lines.push(`  hits = 0;`);
  lines.push(`  results = "";`);
  for (const it of searchItems) {
    const textLower = it.text.toLowerCase();
    // Emitimos el item como string, la búsqueda se hace en Deluge comparando contra q
    const snippet = it.text.slice(0, 240);
    const titleEsc = escHtml(it.title);
    const modEsc = escHtml(it.modTitle);
    const resultHtml =
      `<div class="wk-result">` +
        `<span class="wk-result-mod">${it.modId} · ${modEsc}</span>` +
        `<a class="wk-result-title" href="#Page:Manual_de_Usuario_Modulo?Mod=${it.modId}&Q=%%Q_ENC%%#${it.id}">${titleEsc}</a>` +
        `<div class="wk-result-snippet">${escHtml(snippet)}${it.text.length > 240 ? '…' : ''}</div>` +
      `</div>`;
    // Escape para Deluge
    const esc = resultHtml.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const textEsc = textLower.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const titleLowerEsc = it.title.toLowerCase().replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    lines.push(`  if("${textEsc}".contains(qNorm) || "${titleLowerEsc}".contains(qNorm)) { results = results + "${esc}"; hits = hits + 1; }`);
  }

  // Sustituir espacios por + en el fragment param (URL fragments no necesitan encoding complejo)
  lines.push(`  qEnc = q.replaceAll(" ", "+");`);
  lines.push(`  results = results.replaceAll("%%Q_ENC%%", qEnc);`);
  lines.push(`  if(hits == 0) { results = "<div class='wk-no-results'>Sin resultados para \\"" + q + "\\". Prueba otro término o revisa los tags sugeridos.</div>"; }`);
  lines.push(`  out = out + results;`);
  lines.push(`  out = out + "${resultsBottomHtml.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}";`);
  lines.push(`  return out;`);
  lines.push(`}`);

  return lines.join('\n');
}

// ── Emitir DevolverHTMLManualModulo.deluge ────────────────────────
function emitModulo() {
  const lines = [];
  lines.push(`/**
 * DevolverHTMLManualModulo(string mod, string q)
 * Devuelve el HTML de un módulo del Manual (A/B/C/D).
 * - mod: "A", "B", "C" o "D"
 * - q: término opcional para resaltar con <mark> y filtrar toc
 * GENERADO AUTOMÁTICAMENTE por docs/manual/build-deluge-wiki.mjs
 */
string Calendario52HTML.DevolverHTMLManualModulo(string mod, string q)
{`);

  lines.push(`  m = mod.toUpperCase().trim();`);
  lines.push(`  qNorm = q.toLowerCase().trim();`);

  // Prev/Next calculado por módulo
  const modOrder = ['A', 'B', 'C', 'D'];
  for (let i = 0; i < parsed.length; i++) {
    const mod = parsed[i];
    const prev = i > 0 ? modOrder[i - 1] : null;
    const next = i < modOrder.length - 1 ? modOrder[i + 1] : null;
    const prevNextHtml =
      (prev ? `<a href="#Page:Manual_de_Usuario_Modulo?Mod=${prev}">← Módulo ${prev}</a> · ` : '') +
      `<a href="#Page:Manual_de_Usuario">Índice</a>` +
      (next ? ` · <a href="#Page:Manual_de_Usuario_Modulo?Mod=${next}">Módulo ${next} →</a>` : '');

    // content HTML para este módulo
    let contentHtml = mod.html;
    // Insertar search hint (se reemplaza en runtime si q está)
    const moduloShellBase = buildModuleHtml(mod)
      .replace('%%CONTENT%%', contentHtml)
      .replace('%%PREV_NEXT%%', prevNextHtml);

    // Dos versiones: sin q (shell sin mark) y con q (reemplazo de mark en runtime)
    lines.push(`  if(m == "${mod.id}")`);
    lines.push(`  {`);
    lines.push(`    if(qNorm == "" || qNorm == null)`);
    lines.push(`    {`);
    const shellNoQ = moduloShellBase.replace('%%SEARCH_HINT%%', '💡 Usa <b>Ctrl+F</b> para buscar texto dentro de esta página, o filtra por tema con los tags.');
    lines.push(emitDelugeVar('out', shellNoQ, '      '));
    lines.push(`      return out;`);
    lines.push(`    }`);
    // Con q: highlight del término (intenta mayúscula, minúscula y tal como lo tecleó)
    const shellWithQ = moduloShellBase.replace('%%SEARCH_HINT%%',
      'Mostrando coincidencias para "%%Q_DISP%%". <a class="wk-search-clear" href="#Page:Manual_de_Usuario_Modulo?Mod=' + mod.id + '">✕ limpiar</a>');
    lines.push(emitDelugeVar('out', shellWithQ, '    '));
    lines.push(`    out = out.replaceAll("%%Q_DISP%%", q);`);
    lines.push(`    qUp = q.toUpperCase();`);
    lines.push(`    qLo = q.toLowerCase();`);
    lines.push(`    out = out.replaceAll(q, "<mark>" + q + "</mark>");`);
    lines.push(`    if(qUp != q) { out = out.replaceAll(qUp, "<mark>" + qUp + "</mark>"); }`);
    lines.push(`    if(qLo != q && qLo != qUp) { out = out.replaceAll(qLo, "<mark>" + qLo + "</mark>"); }`);
    lines.push(`    return out;`);
    lines.push(`  }`);
  }

  // Fallback
  lines.push(`  return "<div style='padding:30px;color:#888;font-family:sans-serif;'>Módulo no válido. <a href='#Page:Manual_de_Usuario'>Volver al índice</a>.</div>";`);
  lines.push(`}`);

  return lines.join('\n');
}

// ── write ─────────────────────────────────────────────────────────
const idxOut = emitIndex();
const modOut = emitModulo();

writeFileSync(resolve(outDir, 'DevolverHTMLManualIndex.deluge'), idxOut, 'utf-8');
writeFileSync(resolve(outDir, 'DevolverHTMLManualModulo.deluge'), modOut, 'utf-8');

console.log('✓ Escrito: deluge-drafts/DevolverHTMLManualIndex.deluge');
console.log(`  tamaño: ${(idxOut.length / 1024).toFixed(1)} KB`);
console.log('✓ Escrito: deluge-drafts/DevolverHTMLManualModulo.deluge');
console.log(`  tamaño: ${(modOut.length / 1024).toFixed(1)} KB`);
console.log(`  secciones totales indexadas: ${searchItems.length}`);
