/**
 * GenerarPDFPlanificador — Zoho Creator Node.js Custom Function
 *
 * Lee datos del planificador (filas ya filtradas por técnico/cliente/semana,
 * empaquetadas como CSV) desde Plantilla_PDF.Temp_Params (formato PLANIF|||)
 * y genera un PDF A4 apaisado, paginado automáticamente (bloques de filas
 * y de columnas de semana), replicando los colores del calendario en pantalla.
 * Sube el resultado al campo Archivo_Planificador_Temp del mismo registro bridge.
 *
 * Requiere:
 *   - pdf-lib bundleado en el Cloud Editor: ./null/pdf-lib-bundle
 *   - Campo Archivo_Planificador_Temp (File) en el formulario Plantilla_PDF
 *   - Registro bridge en Plantilla_PDF con Temp_Params = "PLANIF|||{bridgeId}|||{jsonData}"
 *
 * Compatible con Node.js v8.14.0 (runtime Zoho Creator).
 * Sin optional chaining, sin nullish coalescing, sin fetch.
 */

module.exports = async function(context, basicIO) {
  var https       = require('https');
  var querystring = require('querystring');

  // Configurar en Zoho Creator: Function > Settings > Environment Variables
  var REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
  var CLIENT_ID     = process.env.ZOHO_CLIENT_ID;
  var CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
  var OWNER         = process.env.ZOHO_OWNER || 'formacion11';
  var APP           = process.env.ZOHO_APP_LINK_NAME || 'human-resource-management';

  var ROWS_PER_PAGE  = 28;
  var WEEKS_PER_PAGE = 26;

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

  async function uploadFileToField(token, reportName, recordId, fieldName, fileBuffer, filename) {
    var boundary = '----PlanifBoundary' + Date.now().toString(36);
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

  // ── CSV parsing (respeta campos entre comillas) ────────────────────────────
  // Nota: el lado Deluge reemplaza comillas dobles por apóstrofes y saltos de
  // línea por el marcador '‡NL‡' antes de enviar el payload (evita problemas
  // de escaping de backslash/quote en Deluge al construir el body del PATCH).
  function parseCsvLine(line) {
    var result = [];
    var cur = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (c === "'") { inQuotes = !inQuotes; continue; }
      if (c === ',' && !inQuotes) { result.push(cur); cur = ''; continue; }
      cur += c;
    }
    result.push(cur);
    return result;
  }

  function parseCsv(csvText) {
    var lines = csvText.split('‡NL‡').filter(function(l) { return l.length > 0; });
    lines.shift(); // descarta cabecera
    return lines.map(parseCsvLine).filter(function(r) { return r.length >= 3; });
  }

  // ── Clasificación de fila → color/nombre de leyenda ────────────────────────
  function classifyRow(tipo, label) {
    if (tipo === 'Permiso') {
      var l = (label || '').toLowerCase();
      if (l.indexOf('vacaciones') !== -1) return { key: 'vac', name: 'Vacaciones' };
      if (l.indexOf('baja') !== -1) return { key: 'baja', name: 'Baja médica' };
      if (l.indexOf('nacimiento') !== -1 || l.indexOf('matern') !== -1 || l.indexOf('patern') !== -1) return { key: 'mat', name: 'Maternidad/Paternidad' };
      return { key: 'perm', name: 'Otros permisos' };
    }
    return { key: 'on', name: 'Cliente' };
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  try {
    var token = await getAccessToken();
    context.log.INFO('Token OK');

    var base = '/creator/v2.1/data/' + OWNER + '/' + APP + '/report/Plantilla_PDF_Report';

    var listResp = await creatorGet(base, token);
    if (!listResp.data || !listResp.data.length) {
      return basicIO.write({ success: false, error: 'no_plantilla_records' });
    }

    var bridgeRec = null;
    for (var i = 0; i < listResp.data.length; i++) {
      var tp = listResp.data[i].Temp_Params || '';
      if (tp.indexOf('PLANIF|||') === 0) { bridgeRec = listResp.data[i]; break; }
    }
    if (!bridgeRec) {
      return basicIO.write({ success: false, error: 'no_pending_planif_job' });
    }

    // Formato plano (sin JSON, evita problemas de escaping en Deluge):
    // "PLANIF|||{bridgeId}|||{anio}|||{semDesde}|||{semHasta}|||{filtroTecnico}|||{filtroCliente}|||{weekLabels joined by ';;'}|||{csv crudo}"
    // El csv (último campo) se reconstruye con todo lo posterior al 8º delimitador
    // por si theoréticamente contuviera '|||'.
    var rawParts = bridgeRec.Temp_Params.split('|||');
    var bridgeId = rawParts[1];
    var data = {
      anio: parseInt(rawParts[2], 10),
      semDesde: parseInt(rawParts[3], 10) || 1,
      semHasta: parseInt(rawParts[4], 10) || 52,
      filtroTecnico: rawParts[5] || '',
      filtroCliente: rawParts[6] || '',
      weekLabels: (rawParts[7] || '').split(';;'),
      csv: rawParts.slice(8).join('|||')
    };

    context.log.INFO('Procesando planificador anio=' + data.anio);

    // Limpiar el bridge ANTES de generar (evita reprocess en retry)
    await creatorPatch(base + '/' + bridgeId, { data: { Temp_Params: '' } }, token);

    var rows = parseCsv(data.csv || '');
    if (!rows.length) {
      return basicIO.write({ success: false, error: 'no_rows_matched_filters' });
    }

    var weekLabels = data.weekLabels || [];
    var semDesde   = data.semDesde || 1;
    var semHasta   = data.semHasta || 52;

    // ── Generación del PDF ──────────────────────────────────────────────────
    var pdfLib = require('./null/pdf-lib-bundle');

    var A4_W = 841.89, A4_H = 595.28;
    var MARGIN = 30;
    var COL_TEC = 110, COL_CLI = 110;

    var DARK_BLUE  = pdfLib.rgb(0.11, 0.22, 0.37);
    var LABEL_CLR  = pdfLib.rgb(0.44, 0.52, 0.60);
    var VALUE_CLR  = pdfLib.rgb(0.16, 0.18, 0.22);
    var WHITE_CLR  = pdfLib.rgb(1, 1, 1);
    var LINE_CLR   = pdfLib.rgb(0.88, 0.90, 0.92);
    var ROW_ALT    = pdfLib.rgb(0.96, 0.97, 0.99);

    var COLORS = {
      on:   pdfLib.rgb(0.231, 0.510, 0.965),
      vac:  pdfLib.rgb(0.984, 0.749, 0.141),
      baja: pdfLib.rgb(0.937, 0.267, 0.267),
      mat:  pdfLib.rgb(0.957, 0.447, 0.714),
      perm: pdfLib.rgb(0.063, 0.725, 0.506),
      off:  pdfLib.rgb(0.886, 0.910, 0.941)
    };

    var pdfDoc   = await pdfLib.PDFDocument.create();
    var fontBold = await pdfDoc.embedFont(pdfLib.StandardFonts.HelveticaBold);
    var fontReg  = await pdfDoc.embedFont(pdfLib.StandardFonts.Helvetica);

    // Bloques de semanas (1-indexado, dentro del rango semDesde..semHasta)
    var weekBlocks = [];
    var wStart = semDesde;
    while (wStart <= semHasta) {
      var wEnd = Math.min(wStart + WEEKS_PER_PAGE - 1, semHasta);
      weekBlocks.push({ from: wStart, to: wEnd });
      wStart = wEnd + 1;
    }

    // Bloques de filas
    var rowBlocks = [];
    for (var r0 = 0; r0 < rows.length; r0 += ROWS_PER_PAGE) {
      rowBlocks.push(rows.slice(r0, r0 + ROWS_PER_PAGE));
    }

    var totalPages = weekBlocks.length * rowBlocks.length;
    var pageNum = 0;

    var filtrosTxt = [];
    if (data.filtroTecnico) filtrosTxt.push('Técnico: ' + data.filtroTecnico);
    if (data.filtroCliente) filtrosTxt.push('Cliente: ' + data.filtroCliente);
    if (semDesde !== 1 || semHasta !== 52) filtrosTxt.push('Semanas: ' + semDesde + '-' + semHasta);
    var filtrosLine = filtrosTxt.length ? filtrosTxt.join('   ·   ') : 'Sin filtros';

    for (var wb = 0; wb < weekBlocks.length; wb++) {
      var block = weekBlocks[wb];
      var nCols = block.to - block.from + 1;
      var colW = (A4_W - MARGIN * 2 - COL_TEC - COL_CLI) / nCols;

      for (var rb = 0; rb < rowBlocks.length; rb++) {
        pageNum++;
        var pageRows = rowBlocks[rb];
        var page = pdfDoc.addPage([A4_W, A4_H]);

        // Header
        var HDR_H = 46;
        var HDR_Y = A4_H - HDR_H;
        page.drawRectangle({ x: 0, y: HDR_Y, width: A4_W, height: HDR_H, color: DARK_BLUE });
        page.drawText('Planificador ' + data.anio, { x: MARGIN, y: HDR_Y + 26, size: 14, font: fontBold, color: WHITE_CLR });
        page.drawText(filtrosLine, { x: MARGIN, y: HDR_Y + 10, size: 8, font: fontReg, color: pdfLib.rgb(0.65, 0.78, 0.90) });

        var wLabelFrom = weekLabels[block.from - 1] || ('S' + block.from);
        var wLabelTo   = weekLabels[block.to - 1] || ('S' + block.to);
        var rangeTxt = 'Semanas ' + block.from + '-' + block.to + '  (' + wLabelFrom + ' a ' + wLabelTo + ')';
        var rangeW = fontBold.widthOfTextAtSize(rangeTxt, 9);
        page.drawText(rangeTxt, { x: A4_W - MARGIN - rangeW, y: HDR_Y + 26, size: 9, font: fontBold, color: WHITE_CLR });
        var pageTxt = 'Página ' + pageNum + ' de ' + totalPages;
        var pageW = fontReg.widthOfTextAtSize(pageTxt, 8);
        page.drawText(pageTxt, { x: A4_W - MARGIN - pageW, y: HDR_Y + 10, size: 8, font: fontReg, color: pdfLib.rgb(0.65, 0.78, 0.90) });

        // Tabla: cabecera de columnas
        var tableTop = HDR_Y - 10;
        var headerH = 16;
        page.drawRectangle({ x: MARGIN, y: tableTop - headerH, width: A4_W - MARGIN * 2, height: headerH, color: DARK_BLUE });
        page.drawText('Técnico', { x: MARGIN + 4, y: tableTop - headerH + 5, size: 7.5, font: fontBold, color: WHITE_CLR });
        page.drawText('Cliente', { x: MARGIN + COL_TEC + 4, y: tableTop - headerH + 5, size: 7.5, font: fontBold, color: WHITE_CLR });
        for (var wn = block.from; wn <= block.to; wn++) {
          var cx = MARGIN + COL_TEC + COL_CLI + (wn - block.from) * colW;
          var wTxt = String(wn);
          var wTxtW = fontReg.widthOfTextAtSize(wTxt, 6.5);
          page.drawText(wTxt, { x: cx + (colW - wTxtW) / 2, y: tableTop - headerH + 5, size: 6.5, font: fontReg, color: WHITE_CLR });
        }

        // Filas
        var rowY = tableTop - headerH;
        var rowH = Math.min(16, (rowY - 60) / Math.max(pageRows.length, 1));
        rowH = Math.max(rowH, 10);

        for (var ri = 0; ri < pageRows.length; ri++) {
          var row = pageRows[ri];
          var tec = row[0] || '';
          var cli = row[1] || '';
          var tipo = row[2] || '';
          var cellsAll = row.slice(3); // hasta 52 valores

          var yTop = rowY - ri * rowH;
          var yText = yTop - rowH + (rowH - 6.5) / 2 + 1;

          if (ri % 2 === 1) {
            page.drawRectangle({ x: MARGIN, y: yTop - rowH, width: A4_W - MARGIN * 2, height: rowH, color: ROW_ALT });
          }

          var tecTxt = tec.length > 20 ? tec.substring(0, 19) + '…' : tec;
          var cliTxt = cli.length > 20 ? cli.substring(0, 19) + '…' : cli;
          page.drawText(tecTxt, { x: MARGIN + 4, y: yText, size: 6.8, font: fontBold, color: VALUE_CLR });
          page.drawText(cliTxt, { x: MARGIN + COL_TEC + 4, y: yText, size: 6.8, font: fontReg, color: VALUE_CLR });

          var cls = classifyRow(tipo, cli);
          for (var wn2 = block.from; wn2 <= block.to; wn2++) {
            var val = cellsAll[wn2 - 1];
            var hasData = val !== undefined && val !== null && String(val).trim() !== '';
            var cx2 = MARGIN + COL_TEC + COL_CLI + (wn2 - block.from) * colW;
            var color = hasData ? COLORS[cls.key] : null;
            if (color) {
              page.drawRectangle({ x: cx2 + 1.5, y: yTop - rowH + 2, width: colW - 3, height: rowH - 4, color: color });
            }
          }
          page.drawLine({ start: { x: MARGIN, y: yTop - rowH }, end: { x: A4_W - MARGIN, y: yTop - rowH }, thickness: 0.3, color: LINE_CLR });
        }

        // Leyenda + pie
        var legendY = 26;
        var legendItems = [
          { key: 'on', name: 'Cliente' },
          { key: 'vac', name: 'Vacaciones' },
          { key: 'baja', name: 'Baja médica' },
          { key: 'mat', name: 'Maternidad/Paternidad' },
          { key: 'perm', name: 'Otros permisos' }
        ];
        var lx = MARGIN;
        for (var li = 0; li < legendItems.length; li++) {
          var it = legendItems[li];
          page.drawRectangle({ x: lx, y: legendY, width: 8, height: 8, color: COLORS[it.key] });
          page.drawText(it.name, { x: lx + 11, y: legendY + 1, size: 6.5, font: fontReg, color: LABEL_CLR });
          lx += 11 + fontReg.widthOfTextAtSize(it.name, 6.5) + 14;
        }
        page.drawText('Generado automáticamente · Planificador de asignaciones', {
          x: MARGIN, y: 12, size: 6, font: fontReg, color: LABEL_CLR
        });
      }
    }

    var pdfBytes = await pdfDoc.save();
    var pdfBuffer = Buffer.from(pdfBytes);
    context.log.INFO('PDF generado: ' + pdfBuffer.length + ' bytes, ' + totalPages + ' paginas');

    var filename = 'planificador-' + data.anio + '.pdf';
    var uploadResp = await uploadFileToField(token, 'Plantilla_PDF_Report', bridgeId, 'Archivo_Planificador_Temp', pdfBuffer, filename);
    var uploadBody = uploadResp.body.toString('utf8');
    context.log.INFO('Upload status=' + uploadResp.status + ' body=' + uploadBody.substring(0, 150));

    basicIO.write({
      success: true,
      rows: rows.length,
      pages: totalPages,
      filename: filename,
      pdfSizeBytes: pdfBuffer.length,
      uploadStatus: uploadResp.status
    });

  } catch (err) {
    context.log.ERROR('GenerarPDFPlanificador: ' + (err.message || String(err)));
    basicIO.write({ success: false, error: err.message || String(err) });
  }
};
