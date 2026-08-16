/**
 * test-acta-asignacion-local.js
 * Prueba LOCAL del generador de Acta de Asignación de Vehículo.
 * Usa pdf-lib desde node_modules (igual que la versión Zoho pero con require distinto).
 *
 * Run: node deluge-drafts/test-acta-asignacion-local.js
 * Output: test-acta-asignacion.pdf (en raíz del proyecto)
 */

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// ── Datos mock (en Zoho vendrán del API) ──────────────────────────────────
const mockData = {
  assignId: 4790826000001234567,
  generadoEn: '25/06/2026 14:32',
  vehiculo: {
    nombre: 'Ford Transit 2022',
    matricula: '1234-ABC',
    marcaModelo: 'Ford / Transit',
    combustible: 'Diésel',
    anio: '2022',
    estado: 'Activo'
  },
  chofer: {
    nombre: 'Juan García López',
    dni: '12345678A',
    puesto: 'Técnico PRL',
    email: 'jgarcia@empresa.com'
  },
  asignacion: {
    fechaInicio: '25/06/2026',
    odometroInicial: '45.320',
    estado: 'Activa'
  }
};

// ── Constantes de diseño ──────────────────────────────────────────────────
const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 45;
const COL_LABEL = MARGIN;
const COL_VALUE = MARGIN + 180;

const DARK_BLUE = rgb(0.11, 0.22, 0.37);    // #1C3A5E
const MID_BLUE  = rgb(0.19, 0.50, 0.81);    // #3182ce
const LIGHT_BG  = rgb(0.96, 0.97, 0.99);    // sección bg
const SECTION_ACCENT = DARK_BLUE;
const TEXT_LABEL = rgb(0.44, 0.52, 0.60);
const TEXT_VALUE = rgb(0.16, 0.18, 0.22);
const TEXT_WHITE = rgb(1, 1, 1);
const LINE_COLOR = rgb(0.88, 0.90, 0.92);
const GREEN = rgb(0.22, 0.63, 0.41);

// ── Helpers ───────────────────────────────────────────────────────────────
function drawHRule(page, y, color) {
  color = color || LINE_COLOR;
  page.drawLine({
    start: { x: MARGIN, y: y },
    end: { x: A4_W - MARGIN, y: y },
    thickness: 0.5,
    color: color
  });
}

function drawSectionHeader(page, title, y, fontBold) {
  // Fondo sección
  page.drawRectangle({
    x: MARGIN, y: y - 5,
    width: A4_W - MARGIN * 2, height: 20,
    color: LIGHT_BG
  });
  // Barra de acento izquierda
  page.drawRectangle({
    x: MARGIN, y: y - 5,
    width: 3, height: 20,
    color: SECTION_ACCENT
  });
  page.drawText(title, {
    x: MARGIN + 9, y: y + 2,
    size: 9.5, font: fontBold, color: DARK_BLUE
  });
  return y - 28; // devuelve Y para primera fila
}

function drawFieldRow(page, label, value, y, fontReg, fontBold) {
  page.drawText(label, {
    x: COL_LABEL, y: y,
    size: 8.5, font: fontReg, color: TEXT_LABEL
  });
  page.drawText(value || '—', {
    x: COL_VALUE, y: y,
    size: 8.5, font: fontBold, color: TEXT_VALUE
  });
  drawHRule(page, y - 5);
  return y - 18;
}

// ── Generador principal ───────────────────────────────────────────────────
async function generarActaPDF(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([A4_W, A4_H]);

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ── HEADER ────────────────────────────────────────────────────────────
  const HDR_H = 70;
  const HDR_Y = A4_H - HDR_H;

  page.drawRectangle({
    x: 0, y: HDR_Y,
    width: A4_W, height: HDR_H,
    color: DARK_BLUE
  });

  page.drawText('ACTA DE ASIGNACIÓN DE VEHÍCULO', {
    x: MARGIN, y: HDR_Y + 38,
    size: 15, font: fontBold, color: TEXT_WHITE
  });
  page.drawText('Gestión de Flota  ·  Documento oficial de registro', {
    x: MARGIN, y: HDR_Y + 20,
    size: 8.5, font: fontReg,
    color: rgb(0.65, 0.78, 0.90)
  });

  // Metadata (derecha)
  const RX = A4_W - 170;
  page.drawText('Generado:', { x: RX, y: HDR_Y + 50, size: 7.5, font: fontReg, color: rgb(0.65, 0.78, 0.90) });
  page.drawText(data.generadoEn, { x: RX, y: HDR_Y + 38, size: 8.5, font: fontBold, color: TEXT_WHITE });
  page.drawText('ID Asignación: #' + data.assignId, {
    x: RX, y: HDR_Y + 24,
    size: 7.5, font: fontReg, color: rgb(0.65, 0.78, 0.90)
  });

  // Badge estado
  const EST = data.asignacion.estado;
  const badgeColor = (EST === 'Activa') ? GREEN : TEXT_LABEL;
  page.drawRectangle({ x: RX, y: HDR_Y + 7, width: 65, height: 14, color: badgeColor });
  page.drawText(EST, { x: RX + 6, y: HDR_Y + 12, size: 8, font: fontBold, color: TEXT_WHITE });

  // ── CUERPO ─────────────────────────────────────────────────────────────
  let y = HDR_Y - 25;

  // ── Sección: VEHÍCULO ─────────────────────────────────────────────────
  y = drawSectionHeader(page, 'DATOS DEL VEHÍCULO', y, fontBold);
  y = drawFieldRow(page, 'Nombre del vehículo', data.vehiculo.nombre, y, fontReg, fontBold);
  y = drawFieldRow(page, 'Matrícula', data.vehiculo.matricula, y, fontReg, fontBold);
  y = drawFieldRow(page, 'Marca / Modelo', data.vehiculo.marcaModelo, y, fontReg, fontBold);
  y = drawFieldRow(page, 'Tipo de combustible', data.vehiculo.combustible, y, fontReg, fontBold);
  y = drawFieldRow(page, 'Año de fabricación', data.vehiculo.anio, y, fontReg, fontBold);
  y -= 14;

  // ── Sección: CONDUCTOR ────────────────────────────────────────────────
  y = drawSectionHeader(page, 'DATOS DEL CONDUCTOR', y, fontBold);
  y = drawFieldRow(page, 'Nombre completo', data.chofer.nombre, y, fontReg, fontBold);
  y = drawFieldRow(page, 'DNI / NIE', data.chofer.dni, y, fontReg, fontBold);
  y = drawFieldRow(page, 'Puesto', data.chofer.puesto, y, fontReg, fontBold);
  y = drawFieldRow(page, 'Email', data.chofer.email, y, fontReg, fontBold);
  y -= 14;

  // ── Sección: ASIGNACIÓN ───────────────────────────────────────────────
  y = drawSectionHeader(page, 'DATOS DE LA ASIGNACIÓN', y, fontBold);
  y = drawFieldRow(page, 'Fecha de inicio', data.asignacion.fechaInicio, y, fontReg, fontBold);
  y = drawFieldRow(page, 'Odómetro inicial', data.asignacion.odometroInicial + ' km', y, fontReg, fontBold);
  y = drawFieldRow(page, 'Estado', data.asignacion.estado, y, fontReg, fontBold);
  y -= 20;

  // ── FIRMAS ─────────────────────────────────────────────────────────────
  const BOX_W = (A4_W - MARGIN * 2 - 24) / 2;
  const BOX_H = 80;
  const BOX_Y = y - BOX_H;

  // Caja conductor
  page.drawRectangle({ x: MARGIN, y: BOX_Y, width: BOX_W, height: BOX_H, borderColor: LINE_COLOR, borderWidth: 1, color: LIGHT_BG });
  page.drawText('Firma del Conductor / Responsable del Vehículo', {
    x: MARGIN + 8, y: BOX_Y + BOX_H - 14,
    size: 7.5, font: fontBold, color: DARK_BLUE
  });
  page.drawText('Nombre: ' + data.chofer.nombre, {
    x: MARGIN + 8, y: BOX_Y + 8,
    size: 7, font: fontReg, color: TEXT_LABEL
  });

  // Caja supervisor
  const BOX2_X = MARGIN + BOX_W + 24;
  page.drawRectangle({ x: BOX2_X, y: BOX_Y, width: BOX_W, height: BOX_H, borderColor: LINE_COLOR, borderWidth: 1, color: LIGHT_BG });
  page.drawText('Firma del Responsable / Supervisor', {
    x: BOX2_X + 8, y: BOX_Y + BOX_H - 14,
    size: 7.5, font: fontBold, color: DARK_BLUE
  });
  page.drawText('Nombre: ___________________________', {
    x: BOX2_X + 8, y: BOX_Y + 8,
    size: 7, font: fontReg, color: TEXT_LABEL
  });

  y = BOX_Y - 18;

  // ── FOOTER ─────────────────────────────────────────────────────────────
  drawHRule(page, 60, rgb(0.7, 0.75, 0.8));
  page.drawText('Documento generado automáticamente · Sistema de Gestión de Flota', {
    x: MARGIN, y: 46, size: 7, font: fontReg, color: TEXT_LABEL
  });
  page.drawText('Este documento acredita la asignación del vehículo al conductor indicado. Conservar copia firmada.', {
    x: MARGIN, y: 34, size: 7, font: fontReg, color: TEXT_LABEL
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// ── Ejecutar ──────────────────────────────────────────────────────────────
async function main() {
  console.log('Generando acta PDF de prueba...');
  const pdfBytes = await generarActaPDF(mockData);
  const outPath = path.join(__dirname, '..', 'test-acta-asignacion.pdf');
  fs.writeFileSync(outPath, pdfBytes);
  console.log('PDF guardado:', outPath, '(' + Math.round(pdfBytes.length / 1024) + ' KB)');
}

main().catch(function(err) {
  console.error('ERROR:', err.message || err);
  process.exit(1);
});
