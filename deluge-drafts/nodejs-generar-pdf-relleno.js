module.exports = async function(context, basicIO) {
  var https = require('https');
  var querystring = require('querystring');

  // Configurar en Zoho Creator: Function > Settings > Environment Variables
  var REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
  var CLIENT_ID     = process.env.ZOHO_CLIENT_ID;
  var CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
  var OWNER         = process.env.ZOHO_OWNER || 'formacion11';
  var APP           = process.env.ZOHO_APP_LINK_NAME || 'human-resource-management';

  function httpRequest(opts, body) {
    return new Promise(function(resolve, reject) {
      var req = https.request(opts, function(res) {
        var data = [];
        res.on('data', function(c) { data.push(c); });
        res.on('end', function() { resolve({ status: res.statusCode, body: Buffer.concat(data) }); });
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
      headers:  { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': postData.length }
    }, postData);
    if (!resp.access_token) throw new Error('token_failed: ' + JSON.stringify(resp));
    return resp.access_token;
  }

  function authHeader(token) {
    return { 'Authorization': 'Zoho-oauthtoken ' + token, 'Content-Type': 'application/json' };
  }

  async function creatorGet(path, token) {
    return apiJson({ hostname: 'www.zohoapis.com', path: path, method: 'GET', headers: authHeader(token) });
  }

  async function creatorPatch(path, body, token) {
    var s = JSON.stringify(body);
    var hdrs = Object.assign({}, authHeader(token), { 'Content-Length': Buffer.byteLength(s) });
    return apiJson({ hostname: 'www.zohoapis.com', path: path, method: 'PATCH', headers: hdrs }, s);
  }

  async function downloadBinary(path, token) {
    return httpRequest({
      hostname: 'www.zohoapis.com', path: path, method: 'GET',
      headers: { 'Authorization': 'Zoho-oauthtoken ' + token }
    });
  }

  try {
    var token = await getAccessToken();
    var base = '/creator/v2.1/data/' + OWNER + '/' + APP + '/report/Plantilla_PDF_Report';

    // Get all Plantilla_PDF records, find one with Temp_Params set
    var listResp = await creatorGet(base, token);
    if (!listResp.data || !listResp.data.length) {
      return basicIO.write({ success: false, error: 'no_plantilla_records' });
    }
    var record = null;
    for (var i = 0; i < listResp.data.length; i++) {
      // Skip acta records managed by GenerarActaFlota
      if (listResp.data[i].Temp_Params && listResp.data[i].Temp_Params.indexOf('ACTA|||') !== 0) { record = listResp.data[i]; break; }
    }
    if (!record) {
      return basicIO.write({ success: false, error: 'no_pending_job' });
    }

    // Parse "plantillaId|||empleadoId|||<resolved_json>"
    var parts = record.Temp_Params.split('|||');
    if (parts.length < 3) {
      return basicIO.write({ success: false, error: 'bad_temp_params', raw: record.Temp_Params });
    }
    var plantillaId = parts[0];
    var mapping = JSON.parse(parts[2]);

    // PDF template file info from same record
    var recId    = record.RecId_PDF;
    var filename = record.Nombre_Archivo;

    // Download PDF template from Otros_Documentos report
    var dlPath = '/creator/v2.1/data/' + OWNER + '/' + APP + '/report/Otros_Documentos/' + recId + '/Documento/download';
    var dlResp = await downloadBinary(dlPath, token);
    if (dlResp.status !== 200) {
      return basicIO.write({ success: false, error: 'pdf_download_failed', status: dlResp.status, body: dlResp.body.toString('utf8').substring(0, 200) });
    }

    // Fill AcroForm fields with pdf-lib
    var pdfLib = require('./null/pdf-lib-bundle');
    var pdfDoc = await pdfLib.PDFDocument.load(dlResp.body);
    var form = pdfDoc.getForm();
    var fillErrors = [];
    Object.keys(mapping).forEach(function(fieldName) {
      try {
        form.getField(fieldName).setText(String(mapping[fieldName] || ''));
      } catch (e) {
        fillErrors.push(fieldName);
      }
    });
    form.flatten();
    var pdfBase64 = Buffer.from(await pdfDoc.save()).toString('base64');

    // Cleanup: clear Temp_Params so next call starts fresh
    await creatorPatch(base + '/' + plantillaId, { data: { Temp_Params: '' } }, token);

    basicIO.write({ success: true, pdfBase64: pdfBase64, filename: filename, fillErrors: fillErrors });
  } catch (err) {
    basicIO.write({ success: false, error: err.message || String(err) });
  }
};
