// Default.RenombrarDocumento — Node.js v8.14.0 (Zoho Creator)
//
// Descarga el PDF del campo Documento del form Subir_Documento y lo re-sube
// con el nombre definido en el campo Nombre_Documento.
//
// Parámetros (desde Deluge):
//   recordId    : Long   — ID del registro
//   accessToken : String — OAuth token obtenido por Deluge con invokeurl
//
// Retorno: { status, newFilename, downloadedBytes } | { status, error }
//
// Llamada desde Deluge:
//   tokenResp = invokeurl[url:"https://accounts.zoho.com/oauth/v2/token"
//                         type:POST
//                         parameters:{"grant_type":"refresh_token",
//                                     "client_id":zoho.appvariable.ZOHO_CLIENT_ID,
//                                     "client_secret":zoho.appvariable.ZOHO_CLIENT_SECRET,
//                                     "refresh_token":zoho.appvariable.ZOHO_REFRESH_TOKEN}];
//   result = Default.RenombrarDocumento(input.ID.toLong(), tokenResp.get("access_token"));

module.exports = async function(context, basicIO) {
    var https = require('https');

    var OWNER  = 'formacion11';
    var APP    = 'human-resource-management';
    var REPORT = 'Otros_Documentos';

    function httpsReq(opts, bodyBuf) {
        return new Promise(function(resolve, reject) {
            var t = setTimeout(function() { reject(new Error('HTTPS timeout 25s')); }, 25000);
            var r = https.request(opts, function(res) {
                clearTimeout(t);
                var chunks = [];
                res.on('data', function(c) { chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)); });
                res.on('end', function() {
                    var buf = Buffer.concat(chunks);
                    resolve({ status: res.statusCode, headers: res.headers, bodyBuffer: buf, bodyText: buf.toString('utf8') });
                });
                res.on('error', reject);
            });
            r.on('error', function(e) { clearTimeout(t); reject(e); });
            if (bodyBuf) r.write(bodyBuf);
            r.end();
        });
    }

    var result = {};
    try {
        var recordId    = basicIO.getParameter('recordId');
        var accessToken = basicIO.getParameter('accessToken');
        if (!recordId)    throw new Error('Missing param: recordId');
        if (!accessToken) throw new Error('Missing param: accessToken');
        result.recordId = recordId;

        // 1. Leer registro
        var recResp = await httpsReq({
            hostname: 'creator.zoho.com',
            path: '/api/v2/' + OWNER + '/' + APP + '/report/' + REPORT + '/' + recordId,
            method: 'GET',
            headers: { 'Authorization': 'Zoho-oauthtoken ' + accessToken }
        }, null);
        var recData = JSON.parse(recResp.bodyText);
        if (!recData.data) throw new Error('Record not found (HTTP ' + recResp.status + '): ' + recResp.bodyText.substring(0, 100));

        var rec          = recData.data;
        var nombreDoc    = (rec.Nombre_Documento || '').trim();
        var documentoUrl = rec.Documento || '';

        if (!documentoUrl) { result.status = 'skipped:no_documento'; basicIO.write(result); return; }
        if (!nombreDoc)    { result.status = 'skipped:nombre_vacio'; basicIO.write(result); return; }

        // 2. Nombre de fichero sanitizado
        var newFilename = nombreDoc.replace(/\.pdf$/i, '').replace(/[\/\\:*?"<>|]/g, '_') + '.pdf';
        result.newFilename = newFilename;

        // 3. Descargar archivo actual
        var downloadPath = documentoUrl.charAt(0) === '/' ? documentoUrl : '/' + documentoUrl;
        var dlResp = await httpsReq({
            hostname: 'creator.zoho.com',
            path: downloadPath,
            method: 'GET',
            headers: { 'Authorization': 'Zoho-oauthtoken ' + accessToken }
        }, null);
        if (dlResp.status !== 200) throw new Error('Download failed HTTP ' + dlResp.status + ': ' + dlResp.bodyText.substring(0, 100));

        var fileBuffer  = dlResp.bodyBuffer;
        var contentType = dlResp.headers['content-type'] || 'application/pdf';
        result.downloadedBytes = fileBuffer.length;

        // 4. Re-subir con nuevo nombre via multipart PATCH
        var boundary = 'ZohoRename' + String(fileBuffer.length) + 'x' + String(recordId).slice(-6);
        var partHead = Buffer.from(
            '--' + boundary + '\r\n' +
            'Content-Disposition: form-data; name="Documento"; filename="' + newFilename + '"\r\n' +
            'Content-Type: ' + contentType + '\r\n\r\n'
        );
        var partFoot = Buffer.from('\r\n--' + boundary + '--\r\n');
        var body = Buffer.concat([partHead, fileBuffer, partFoot]);

        var uploadResp = await httpsReq({
            hostname: 'creator.zoho.com',
            path: '/api/v2/' + OWNER + '/' + APP + '/report/' + REPORT + '/' + recordId,
            method: 'PATCH',
            headers: {
                'Authorization': 'Zoho-oauthtoken ' + accessToken,
                'Content-Type': 'multipart/form-data; boundary=' + boundary,
                'Content-Length': body.length
            }
        }, body);

        var uploadData = {};
        try { uploadData = JSON.parse(uploadResp.bodyText); } catch(e) {}

        result.uploadStatus = uploadResp.status;
        result.uploadBody   = uploadResp.bodyText.substring(0, 200);
        result.uploadCode   = uploadData.code;
        result.status = (uploadResp.status === 200 && uploadData.code === 3000) ? 'ok' : 'upload_error';

    } catch(e) {
        result.error  = (e.message || String(e)).substring(0, 300);
        result.status = 'exception';
    }

    basicIO.write(result);
};
