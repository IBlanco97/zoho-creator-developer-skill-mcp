/**
 * Zoho Creator Node.js Function: InspeccionarCamposPDF
 *
 * Descarga un PDF desde un campo File de Zoho Creator y devuelve
 * todos los campos AcroForm con su nombre, tipo y valor actual.
 *
 * Prerequisito: subir pdf-lib UMD bundle como "pdf-lib.min.js"
 * en Node Modules del IDE (obtener de: https://unpkg.com/pdf-lib/dist/pdf-lib.min.js)
 *
 * Params de entrada (basicIO.getParameter):
 *   recId    : string  — ID del registro (obligatorio)
 *   report   : string  — link name del report (default: 'Otros_Documentos')
 *   field    : string  — link name del campo file (default: 'Documento')
 *   filename : string  — nombre exacto del archivo (obligatorio para campos multi-archivo)
 *
 * Retorna:
 *   { pdfSize, count, summary, fieldNames, fields: [{name, type, value, options?}] }
 *
 * Hallazgos clave (2026-06-17):
 *   - Report name correcto para Subir_Documento: 'Otros_Documentos'
 *   - URL base: www.zohoapis.com/creator/v2.1/data/...
 *   - Para campos multi-archivo: añadir ?filepath=/{filename}
 *   - UPLOAD_RULE_NOT_CONFIGURED = report name incorrecto (no "no configurado")
 *   - DFS/Stratus NO sirven para archivos de campos file de Creator
 */

module.exports = async function(context, basicIO) {
  var https = require('https');
  var querystring = require('querystring');
  var fs = require('fs');

  // Required params
  var recId    = basicIO.getParameter('recId');
  var report   = basicIO.getParameter('report')   || 'Otros_Documentos';
  var field    = basicIO.getParameter('field')    || 'Documento';
  var filename = basicIO.getParameter('filename');  // required for multi-file fields

  if (!recId) { basicIO.write({ error: 'recId param required' }); return; }

  // --- OAuth refresh ---
  var tokenResult = await new Promise(function(resolve, reject) {
    // NOTE: Zoho Creator Node.js sandbox has no user process.env.
    // Credentials must come from Zoho Creator Connections or be injected
    // via basicIO.getParameter(). Do NOT commit real credentials here.
    // Obtain values from .env / Zoho API Console and pass as params,
    // or configure a Zoho OAuth Connection and use context.getConnection().
    var postData = querystring.stringify({
      refresh_token: basicIO.getParameter('refreshToken') || process.env.ZOHO_REFRESH_TOKEN || 'REPLACE_WITH_REFRESH_TOKEN',
      client_id:     basicIO.getParameter('clientId')    || process.env.ZOHO_CLIENT_ID     || 'REPLACE_WITH_CLIENT_ID',
      client_secret: basicIO.getParameter('clientSecret')|| process.env.ZOHO_CLIENT_SECRET || 'REPLACE_WITH_CLIENT_SECRET',
      grant_type: 'refresh_token'
    });
    var opts = { hostname: 'accounts.zoho.com', path: '/oauth/v2/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
    };
    var chunks = [];
    var req = https.request(opts, function(res) {
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() { resolve(JSON.parse(Buffer.concat(chunks).toString())); });
    });
    req.on('error', reject); req.write(postData); req.end();
  });

  var accessToken = tokenResult.access_token;
  if (!accessToken) { basicIO.write({ error: 'OAuth failed', detail: JSON.stringify(tokenResult) }); return; }

  // --- Download PDF from Zoho Creator ---
  var path = '/creator/v2.1/data/formacion11/human-resource-management/report/' + report + '/' + recId + '/' + field + '/download';
  if (filename) path += '?filepath=/' + filename;

  var pdfBytes = await new Promise(function(resolve, reject) {
    var chunks = [];
    var req = https.request({ hostname: 'www.zohoapis.com', path: path, method: 'GET',
      headers: { 'Authorization': 'Zoho-oauthtoken ' + accessToken }
    }, function(res) {
      if (res.statusCode !== 200) {
        var e = []; res.on('data', function(c) { e.push(c); });
        res.on('end', function() { reject(new Error('HTTP ' + res.statusCode + ': ' + Buffer.concat(e).toString('utf8', 0, 200))); });
        return;
      }
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() { resolve(Buffer.concat(chunks)); });
    });
    req.on('error', reject); req.end();
  });

  // --- Parse AcroForm fields with pdf-lib ---
  var PDFLibModule = require('pdf-lib.min.js');
  var PDFDocument = PDFLibModule.PDFDocument;

  var pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  var form = pdfDoc.getForm();
  var rawFields = form.getFields();

  var fields = rawFields.map(function(f) {
    var name = f.getName();
    var type = f.constructor.name.replace('PDF', '');
    var val = null;
    var opts = null;
    try {
      if (type === 'CheckBox') val = f.isChecked();
      else if (type === 'TextField') val = f.getText() || '';
      else if (type === 'Dropdown' || type === 'OptionList' || type === 'RadioGroup') {
        val = f.getSelected(); opts = f.getOptions();
      }
    } catch(e) {}
    var result = { name: name, type: type, value: val };
    if (opts) result.options = opts;
    return result;
  });

  var summary = {};
  fields.forEach(function(f) { summary[f.type] = (summary[f.type] || 0) + 1; });

  basicIO.write({
    pdfSize: pdfBytes.length,
    count: fields.length,
    summary: summary,
    fieldNames: fields.map(function(f) { return f.name; }),
    fields: fields
  });
};
