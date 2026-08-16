/**
 * GenerarActaFlota — Zoho Creator Node.js Custom Function
 *
 * Lee datos de asignación desde Plantilla_PDF.Temp_Params (formato ACTA|||)
 * y genera un PDF "Acta de Asignación de Vehículo" desde cero con pdf-lib.
 * Sube el PDF al campo Acta_PDF del registro Assign_Driver correspondiente.
 *
 * Requiere:
 *   - pdf-lib bundleado en el Cloud Editor: ./null/pdf-lib-bundle
 *   - Campo Acta_PDF (File) en el formulario Assign_Driver
 *   - Registro en Plantilla_PDF con Temp_Params = "ACTA|||{assignId}|||{jsonData}"
 *
 * Compatible con Node.js v8.14.0 (runtime Zoho Creator).
 * Sin optional chaining, sin nullish coalescing, sin fetch.
 */

module.exports = async function(context, basicIO) {
  var https      = require('https');
  var querystring = require('querystring');

  // Configurar en Zoho Creator: Function > Settings > Environment Variables
  var REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
  var CLIENT_ID     = process.env.ZOHO_CLIENT_ID;
  var CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
  var OWNER         = process.env.ZOHO_OWNER || 'formacion11';
  var APP           = process.env.ZOHO_APP_LINK_NAME || 'human-resource-management';

  // ── HTTP utils ────────────────────────────────────────────────────────────
  function httpRequest(opts, body) {
    return new Promise(function(resolve, reject) {
      var req = https.request(opts, function(res) {
        var chunks = [];
        res.on('data', function(c) { chunks.push(c); });
        res.on('end', function() { resolve({ status: res.statusCode, body: Buffer.concat(chunks) }); });
      });
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }

  function apiJson(opts, body) {
    return httpRequest(opts, body).then(function(r) {
      return JSON.parse(r.body.toString('utf8'));
    });
  }

  async function getAccessToken() {
    var postData = querystring.stringify({
      refresh_token: REFRESH_TOKEN,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type:    'refresh_token'
    });
    var resp = await apiJson({
      hostname: 'accounts.zoho.com',
      path:     '/oauth/v2/token',
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    }, postData);
    if (!resp.access_token) throw new Error('token_failed: ' + JSON.stringify(resp));
    return resp.access_token;
  }

  function authHdr(token) {
    return { 'Authorization': 'Zoho-oauthtoken ' + token, 'Content-Type': 'application/json' };
  }

  async function creatorGet(path, token) {
    return apiJson({ hostname: 'www.zohoapis.com', path: path, method: 'GET', headers: authHdr(token) });
  }

  async function creatorPatch(path, body, token) {
    var s = JSON.stringify(body);
    var hdrs = Object.assign({}, authHdr(token), { 'Content-Length': Buffer.byteLength(s) });
    return apiJson({ hostname: 'www.zohoapis.com', path: path, method: 'PATCH', headers: hdrs }, s);
  }

  // Sube un Buffer binario como archivo al campo de un registro Zoho Creator
  async function uploadFileToField(token, reportName, recordId, fieldName, fileBuffer, filename) {
    var boundary = '----ActaBoundary' + Date.now().toString(36);
    var CRLF     = '\r\n';

    var partHead = Buffer.from(
      '--' + boundary + CRLF +
      'Content-Disposition: form-data; name="file"; filename="' + filename + '"' + CRLF +
      'Content-Type: application/pdf' + CRLF + CRLF
    );
    var partTail = Buffer.from(CRLF + '--' + boundary + '--' + CRLF);
    var bodyBuf  = Buffer.concat([partHead, fileBuffer, partTail]);

    var path = '/creator/v2.1/data/' + OWNER + '/' + APP +
               '/report/' + reportName + '/' + recordId + '/' + fieldName + '/upload';

    return httpRequest({
      hostname: 'www.zohoapis.com',
      path:     path,
      method:   'POST',
      headers: {
        'Authorization': 'Zoho-oauthtoken ' + token,
        'Content-Type':  'multipart/form-data; boundary=' + boundary,
        'Content-Length': bodyBuf.length
      }
    }, bodyBuf);
  }

  // ── Generador de PDF ──────────────────────────────────────────────────────
  async function buildPDF(d) {
    var pdfLib = require('./null/pdf-lib-bundle');

    var A4_W = 595.28;
    var A4_H = 841.89;
    var MARGIN   = 45;
    var COL_VAL  = MARGIN + 180;

    var DARK_BLUE = pdfLib.rgb(0.11, 0.22, 0.37);
    var LIGHT_BG  = pdfLib.rgb(0.96, 0.97, 0.99);
    var LABEL_CLR = pdfLib.rgb(0.44, 0.52, 0.60);
    var VALUE_CLR = pdfLib.rgb(0.16, 0.18, 0.22);
    var WHITE_CLR = pdfLib.rgb(1, 1, 1);
    var LINE_CLR  = pdfLib.rgb(0.88, 0.90, 0.92);
    var GREEN_CLR = pdfLib.rgb(0.22, 0.63, 0.41);
    var BLUE_FADE = pdfLib.rgb(0.65, 0.78, 0.90);

    var pdfDoc   = await pdfLib.PDFDocument.create();
    var page     = pdfDoc.addPage([A4_W, A4_H]);
    var fontBold = await pdfDoc.embedFont(pdfLib.StandardFonts.HelveticaBold);
    var fontReg  = await pdfDoc.embedFont(pdfLib.StandardFonts.Helvetica);

    function hRule(y) {
      page.drawLine({ start: { x: MARGIN, y: y }, end: { x: A4_W - MARGIN, y: y }, thickness: 0.4, color: LINE_CLR });
    }

    function sectionHdr(title, y) {
      page.drawRectangle({ x: MARGIN, y: y - 5, width: A4_W - MARGIN * 2, height: 20, color: LIGHT_BG });
      page.drawRectangle({ x: MARGIN, y: y - 5, width: 3, height: 20, color: DARK_BLUE });
      page.drawText(title, { x: MARGIN + 9, y: y + 2, size: 9.5, font: fontBold, color: DARK_BLUE });
      return y - 28;
    }

    function fieldRow(label, value, y) {
      page.drawText(label, { x: MARGIN, y: y, size: 8.5, font: fontReg, color: LABEL_CLR });
      page.drawText(value || '—', { x: COL_VAL, y: y, size: 8.5, font: fontBold, color: VALUE_CLR });
      hRule(y - 5);
      return y - 18;
    }

    // HEADER
    var HDR_H = 70;
    var HDR_Y = A4_H - HDR_H;
    page.drawRectangle({ x: 0, y: HDR_Y, width: A4_W, height: HDR_H, color: DARK_BLUE });
    page.drawText('ACTA DE ASIGNACIÓN DE VEHÍCULO', {
      x: MARGIN, y: HDR_Y + 38, size: 15, font: fontBold, color: WHITE_CLR
    });
    page.drawText('Gestión de Flota  ·  Documento oficial de registro', {
      x: MARGIN, y: HDR_Y + 20, size: 8.5, font: fontReg, color: BLUE_FADE
    });

    var RX = A4_W - 170;
    page.drawText('Generado:', { x: RX, y: HDR_Y + 50, size: 7.5, font: fontReg, color: BLUE_FADE });
    page.drawText(d.generadoEn, { x: RX, y: HDR_Y + 38, size: 8.5, font: fontBold, color: WHITE_CLR });
    page.drawText('ID Asignación: #' + d.assignId, { x: RX, y: HDR_Y + 24, size: 7.5, font: fontReg, color: BLUE_FADE });

    var EST = d.asignacion.estado;
    var badgeClr = (EST === 'Activa') ? GREEN_CLR : LABEL_CLR;
    page.drawRectangle({ x: RX, y: HDR_Y + 7, width: 65, height: 14, color: badgeClr });
    page.drawText(EST, { x: RX + 6, y: HDR_Y + 12, size: 8, font: fontBold, color: WHITE_CLR });

    // BODY
    var y = HDR_Y - 25;

    // Vehículo
    y = sectionHdr('DATOS DEL VEHÍCULO', y);
    y = fieldRow('Nombre del vehículo', d.vehiculo.nombre, y);
    y = fieldRow('Matrícula', d.vehiculo.matricula, y);
    y = fieldRow('Marca / Modelo', d.vehiculo.marcaModelo, y);
    y = fieldRow('Tipo de combustible', d.vehiculo.combustible, y);
    y = fieldRow('Año de fabricación', d.vehiculo.anio, y);
    y -= 14;

    // Conductor
    y = sectionHdr('DATOS DEL CONDUCTOR', y);
    y = fieldRow('Nombre completo', d.chofer.nombre, y);
    y = fieldRow('DNI / NIE', d.chofer.dni, y);
    y = fieldRow('Puesto', d.chofer.puesto, y);
    y = fieldRow('Email', d.chofer.email, y);
    y -= 14;

    // Asignación
    y = sectionHdr('DATOS DE LA ASIGNACIÓN', y);
    y = fieldRow('Fecha de inicio', d.asignacion.fechaInicio, y);
    y = fieldRow('Odómetro inicial', d.asignacion.odometroInicial + ' km', y);
    y = fieldRow('Estado', d.asignacion.estado, y);
    y -= 20;

    // Firmas
    var BOX_W = (A4_W - MARGIN * 2 - 24) / 2;
    var BOX_H = 80;
    var BOX_Y = y - BOX_H;

    page.drawRectangle({ x: MARGIN, y: BOX_Y, width: BOX_W, height: BOX_H, borderColor: LINE_CLR, borderWidth: 1, color: LIGHT_BG });
    page.drawText('Firma del Conductor', { x: MARGIN + 8, y: BOX_Y + BOX_H - 14, size: 7.5, font: fontBold, color: DARK_BLUE });
    page.drawText('Nombre: ' + d.chofer.nombre, { x: MARGIN + 8, y: BOX_Y + 8, size: 7, font: fontReg, color: LABEL_CLR });

    var B2X = MARGIN + BOX_W + 24;
    page.drawRectangle({ x: B2X, y: BOX_Y, width: BOX_W, height: BOX_H, borderColor: LINE_CLR, borderWidth: 1, color: LIGHT_BG });
    page.drawText('Firma del Responsable / Supervisor', { x: B2X + 8, y: BOX_Y + BOX_H - 14, size: 7.5, font: fontBold, color: DARK_BLUE });
    page.drawText('Nombre: ___________________________', { x: B2X + 8, y: BOX_Y + 8, size: 7, font: fontReg, color: LABEL_CLR });

    // Footer
    page.drawLine({ start: { x: MARGIN, y: 58 }, end: { x: A4_W - MARGIN, y: 58 }, thickness: 0.5, color: pdfLib.rgb(0.7, 0.75, 0.8) });
    page.drawText('Documento generado automáticamente · Sistema de Gestión de Flota', {
      x: MARGIN, y: 44, size: 7, font: fontReg, color: LABEL_CLR
    });
    page.drawText('Este documento acredita la asignación del vehículo al conductor indicado. Conservar copia firmada.', {
      x: MARGIN, y: 32, size: 7, font: fontReg, color: LABEL_CLR
    });

    var pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  try {
    var token = await getAccessToken();
    context.log.INFO('Token OK');

    var base = '/creator/v2.1/data/' + OWNER + '/' + APP + '/report/Plantilla_PDF_Report';

    // Buscar registro con Temp_Params empezando por "ACTA|||"
    var listResp = await creatorGet(base, token);
    if (!listResp.data || !listResp.data.length) {
      return basicIO.write({ success: false, error: 'no_plantilla_records' });
    }

    var bridgeRec = null;
    for (var i = 0; i < listResp.data.length; i++) {
      var tp = listResp.data[i].Temp_Params || '';
      if (tp.indexOf('ACTA|||') === 0) {
        bridgeRec = listResp.data[i];
        break;
      }
    }
    if (!bridgeRec) {
      return basicIO.write({ success: false, error: 'no_pending_acta_job' });
    }

    // Parse "ACTA|||{plantillaRecId}|||{assignId}|||{jsonData}"
    var parts    = bridgeRec.Temp_Params.split('|||');
    var bridgeId = bridgeRec.ID;
    var assignId = parts[2];
    var dataJson = JSON.parse(parts[3]);

    context.log.INFO('Procesando asignacion #' + assignId);

    // Limpiar el bridge ANTES de generar (evita reprocess en retry)
    await creatorPatch(base + '/' + bridgeId, { data: { Temp_Params: '' } }, token);

    // Generar PDF
    var pdfBuffer = await buildPDF(dataJson);
    context.log.INFO('PDF generado: ' + pdfBuffer.length + ' bytes');

    // Subir al campo Acta_PDF del registro Assign_Driver
    var filename   = 'acta-asignacion-' + assignId + '.pdf';
    var uploadResp = await uploadFileToField(token, 'Historial_de_Asignaciones', assignId, 'Acta_PDF', pdfBuffer, filename);
    var uploadBody = uploadResp.body.toString('utf8');
    context.log.INFO('Upload status=' + uploadResp.status + ' body=' + uploadBody.substring(0, 120));

    basicIO.write({
      success:      true,
      assignId:     assignId,
      filename:     filename,
      pdfSizeBytes: pdfBuffer.length,
      uploadStatus: uploadResp.status,
      uploadBody:   uploadBody.substring(0, 200)
    });

  } catch (err) {
    context.log.ERROR('GenerarActaFlota: ' + (err.message || String(err)));
    basicIO.write({ success: false, error: err.message || String(err) });
  }
};
