# Handoff: Default.RenombrarDocumento (Node.js en Zoho Creator)

**Sesión:** `09653d25-a42a-4293-8d49-454a014d8b8c`  
**Fecha:** 2026-06-12  
**Estado:** Código listo, pendiente crear función en IDE y testear end-to-end

---

## RESUMEN RÁPIDO (leer primero)

- Código completo en: `deluge-drafts/RenombrarDocumento.js`
- Usa `context.getConnection('ZohoCreator')` — **sin credenciales en código**
- Conexión `ZohoCreator`: Sistema, **Conectado** (Microservicios → Conexiones)
- `conn.makeRequest()` devuelve `ClientRequest` — ver patrón `connReq` abajo
- Campo `Documento` = string URL relativa `/api/v2/.../download?filepath=...`
- Pendiente: crear función en IDE → testear → crear workflow trigger

---

## Prompt de continuación para nueva sesión

```
Continúa la implementación de Default.RenombrarDocumento en Zoho Creator.
Lee D:\Sicma21\2026\zoho-mcp\HANDOFF_nodejs_rename.md — tiene todo el contexto.

Resumen estado:
- Código Node.js completo en deluge-drafts/RenombrarDocumento.js
- Usa context.getConnection('ZohoCreator') sin credenciales hardcodeadas
- Conexión ZohoCreator: sistema, Conectado en Microservicios > Conexiones
- connReq helper: conn.makeRequest devuelve ClientRequest, escuchar 'response' + req.end()
- Campo Documento = string URL relativa para descargar el archivo

Pendiente:
1. Crear función Default.RenombrarDocumento en Creator IDE (NodeJs, collection, param: recordId Long)
2. Inyectar el código de deluge-drafts/RenombrarDocumento.js via Monaco
3. Testear: primero GET record, luego flujo completo con record que tenga Nombre_Documento no vacío
4. Crear workflow Deluge en Subir_Documento: result = Default.RenombrarDocumento(input.ID.toLong())

Usa skill zoho-nodejs-dev para el flujo de creación de función Node.js en el IDE.
```

---

---

## Objetivo

Crear una función Node.js en Zoho Creator que renombre el PDF adjunto del formulario `Subir_Documento`, usando el valor del campo `Nombre_Documento` como nuevo nombre de fichero.

---

## Formulario objetivo

- **Form:** `Subir_Documento`
- **Report:** `Otros_Documentos`
- **Campo archivo:** `Documento` (tipo 19, file upload) — devuelve URL relativa string
- **Campo nombre:** `Nombre_Documento` (tipo 1, texto libre)
- **Función:** `Default.RenombrarDocumento` (namespace forzado a Default por Node.js)

---

## Plan de implementación

### Función a crear

- **Nombre:** `RenombrarDocumento`
- **Namespace:** `SubirDocumento`
- **Lenguaje:** NodeJs
- **Tipo retorno:** collection

### Lógica

```
1. Recibir argumento: recordId (string/int)
2. Llamar REST API Creator GET /report/Otros_Documentos/records/{recordId}
   → leer Nombre_Documento y la URL del campo Documento
3. Descargar el PDF usando https.request + token OAuth
4. Guardar en filesystem temporal (context.getWritableDirectory())
5. Re-subir vía REST API multipart PATCH con filename = Nombre_Documento + ".pdf"
6. basicIO.write({ status: 'ok', newName: ... })
```

### Autenticación OAuth — PENDIENTE DE RESOLVER

**Problema no resuelto:** No se encontró dónde configurar Connections en el IDE.
- Settings → connections → 404
- admindashboard → connections → 404
- La app usa `backup_sftp` (SFTP connection) pero no se vio sección de OAuth connections

**Estrategias a probar (en orden):**

1. **Buscar en Creator IDE:** `Configuración → Connexiones` (panel lateral del workflow builder)
2. **Usar `context.getPersistenceOperations().getConnection()`** — tiene método `getConnection`, puede ser alternativa a `context.getConnection()`
3. **Llamada directa a `/oauth/v2/token`** con credenciales desde env vars o app variables:
   - Zoho Creator tiene "App Variables" configurables
   - Si hay variables `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN` → hacer POST directo a `https://accounts.zoho.com/oauth/v2/token`
4. **Desde Deluge:** el workflow Deluge que llame a esta función puede obtener el token y pasarlo como argumento

### Cómo acceder a argumentos — PENDIENTE DE VERIFICAR

No se llegó a ejecutar `DiagnosticArgs`. Estrategias a explorar:
- `basicIO.getInput()` o `basicIO.read()` — no verificado
- Los argumentos pueden llegar como primer parámetro adicional: `module.exports = async function(context, basicIO, args)`
- O via `context` de alguna forma

**Diagnóstico rápido a hacer:**
```js
module.exports = async function(context, basicIO) {
    basicIO.write({
        args_keys: Object.keys(arguments),
        arg0_type: typeof arguments[0],
        arg1_type: typeof arguments[1],
        arg2_type: typeof arguments[2],
        basicIO_keys: Object.getOwnPropertyNames(basicIO),
        basicIO_proto: Object.getOwnPropertyNames(Object.getPrototypeOf(basicIO))
    });
}
```

---

## Conocimiento del runtime (ya verificado)

Ver skill: `zoho-nodejs-dev` (`~/.claude/commands/zoho-nodejs-dev.md`)

Resumen clave:
- Node.js **v8.14.0** — sin fetch, sin optional chaining `?.`
- `const https = require('https')` para HTTP
- `context.getStratusOperations()` → upload/download/del en Zoho Files
- `context.getWritableDirectory()` → filesystem efímero
- **Popup bloqueante:** siempre hacer `document.querySelector('.zc-mig-validate-btn-link-skip')?.click()` antes de editar Monaco

---

## Flujo Playwright para crear/editar la función

```
1. Navegar a: https://creator.zoho.com/appbuilder/formacion11/human-resource-management/workflow/edit
2. Pestaña "Funciones" → botón "Nueva Función" (#create-custom-function)
3. Nombre: RenombrarDocumento, idioma: NodeJs, namespace: SubirDocumento
4. Tras crear, navegar a /customFunction/RenombrarDocumento/edit
5. Esperar 3s → click '.zc-mig-validate-btn-link-skip' → esperar 3s más
6. Inyectar código: window.monaco.editor.getModels()[0].setValue(code)
7. Click "Guardar" → click "Ejecutar"
8. Leer resultado: JSON.parse(document.querySelector('.zc-cfb-console-output-result')?.textContent)
```

---

## Workflow Deluge de disparo (después de la función)

Crear workflow en `Subir_Documento`, trigger "on add or edit", script:
```deluge
// Llamar la función Node.js de renombrado
result = SubirDocumento.RenombrarDocumento(input.ID.toLong());
```

---

## Prompt para nueva sesión

```
Continúa la implementación de la función Node.js `SubirDocumento.RenombrarDocumento` 
en Zoho Creator. Lee el documento D:\Sicma21\2026\zoho-mcp\HANDOFF_nodejs_rename.md 
para el contexto completo.

Resumen: hay que crear una función Node.js que descargue el PDF del campo `Documento` 
del formulario `Subir_Documento` y lo re-suba con el nombre del campo `Nombre_Documento`.

Primeros pasos:
1. Crear función DiagnosticArgs para entender cómo llegan los argumentos a funciones Node.js
2. Buscar en el IDE dónde configurar OAuth Connections (Creator IDE → Settings o panel lateral)
3. Con eso resuelto, implementar la función completa de renombrado

Usa la skill `zoho-nodejs-dev` como referencia del runtime.
```
