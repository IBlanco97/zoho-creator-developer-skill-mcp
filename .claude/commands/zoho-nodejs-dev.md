---
name: zoho-nodejs-dev
description: >
  Zoho Creator — Funciones Node.js. Módulo complementario de zoho-creator-dev.
  Usar cuando el usuario pida crear o editar funciones Node.js (o Java) en Zoho
  Creator, especialmente para tareas que Deluge no puede hacer: manejo de binarios,
  lógica compleja, acceso a Zoho Files.
metadata:
  author: sicma21
  version: "1.0"
---

# Zoho Creator — Funciones Node.js

Módulo complementario de `zoho-creator-dev`. Usar cuando el usuario pida crear o
editar **funciones Node.js** (o Java) en Zoho Creator, especialmente para tareas
que Deluge no puede hacer: manejo de binarios, lógica compleja, acceso a Zoho Files.

---

## Runtime Node.js de Zoho Creator — Datos reales (verificados 2026-06-10)

### Versión y entorno
- **Node.js v8.14.0** — antiguo. Sin `fetch`, sin `Buffer.alloc` completo, sin ES2019+.
- Usa `const https = require('https')` o `const http = require('http')` para HTTP.
- Las peticiones HTTP **salen por proxy** (env vars: `PROXY_URL`, `PROXY_HOST`, `PROXY_PORT`, `PROXY_USER`, `PROXY_PASSWORD`, `HTTP_PROXY`, `HTTPS_PROXY`).
- Filesystem efímero en `/home/zcfunction/{hash}/` (via `context.getWritableDirectory()`).

### Estructura de una función

```js
module.exports = async function(context, basicIO) {
    // código aquí
    basicIO.write({ resultado: 'valor' }); // retorno al caller (tipo collection)
}
```

- **Siempre `async`** — permite `await` en todos los métodos de `context`.
- **`basicIO.write(valor)`** — devuelve el resultado. Solo un `write` efectivo por ejecución.
- **`context.log.INFO(msg)`** / **`context.log.ERROR(msg)`** — logs visibles en consola del IDE.
- El tipo de retorno es siempre `collection` (no configurable para Node.js/Java).

---

## API del objeto `context` (verificada)

### Métodos propios (en prototype)

| Método | Descripción | Notas |
|--------|-------------|-------|
| `context.log.INFO(msg)` | Log informativo | Visible en consola IDE |
| `context.log.ERROR(msg)` | Log de error | |
| `await context.getWritableDirectory()` | Ruta filesystem efímero | `string` tipo `/home/zcfunction/{hash}/` |
| `await context.getFunctionHome()` | Ruta raíz de la función | Donde están los archivos subidos |
| `await context.getConnection(name)` | Token OAuth de una conexión configurada | `name` = nombre de la conexión en la app. Lanza error si no existe o si no se pasa nombre |
| `await context.getDFSOperations()` | Operaciones DFS (sistema de archivos Creator) | Solo tiene `getDFSFileDetails` |
| `await context.getStratusOperations()` | Operaciones Zoho Files (Stratus) | `upload`, `download`, `del` |
| `await context.getCache()` | Cache compartida | `get`, `set`, `del` |
| `await context.getPersistenceOperations()` | Persistencia | `uploadData`, `getConnection` |
| `await context.getQueue()` | Cola de mensajes | `consume`, `produce` |
| `await context.getIntegrationTask()` | Tareas de integración | |
| `await context.getConnectorOperations()` | Operaciones de connectors | |
| `await context.getDocket()` | Docket (datos estructurados Zoho) | |
| `context.close()` | Cierra recursos | Llamar al final si abres conexiones |

### API de Stratus (Zoho Files) — la más útil

```js
const stratus = await context.getStratusOperations();
// stratus.upload(...)   — subir un archivo
// stratus.download(...) — descargar un archivo
// stratus.del(...)      — eliminar un archivo
```

⚠️ Las firmas exactas de parámetros de Stratus no están documentadas oficialmente —
explorar con try/catch y context.log.INFO para inspeccionar errores.

### API de DFS (sistema de archivos de Creator)

```js
const dfs = await context.getDFSOperations();
// dfs.getDFSFileDetails(...) — solo método disponible
```

Útil para obtener metadata de archivos adjuntos en formularios de Creator.

### getConnection — acceso OAuth sin gestión manual

```js
const conn = await context.getConnection("nombre_conexion");
// conn expone métodos para obtener el token OAuth
// Configurar la conexión en: Configuración → Connections de la app
```

---

## Gestión de dependencias npm

### No hay `npm install` automático

Zoho no ejecuta `npm install`. Hay dos formas de usar librerías:

**Opción A — Upload manual** (recomendada para librerías pequeñas):
1. En el editor de la función, clic derecho sobre `node_modules/`
2. Seleccionar **"Upload Files"** (límite: **10 MB total**)
3. Subir el paquete pre-compilado (carpeta bundleada o `.zip`)

**Opción B — `config.json` dependencies** (para paquetes soportados por Zoho):
- El `config.json` tiene campos `dependencies: []` y `versioned_dependencies: {}`
- Zoho puede resolver paquetes de un repositorio interno (no documentado)

### Paquetes útiles que caben en 10 MB (bundleados)
| Paquete | Tamaño bundle | Uso |
|---------|--------------|-----|
| `axios` | ~50 KB | HTTP requests |
| `pdf-lib` | ~2.5 MB | Manipulación PDF |
| `archiver` | ~200 KB | Comprimir ZIP |
| `csv-parser` | ~30 KB | Parsear CSV |

---

## Crear una función Node.js — Flujo IDE

### 1. Navegar a la lista de funciones
```
https://creator.zoho.com/appbuilder/{owner}/{app}/workflow/edit
→ Pestaña "Funciones"
→ Botón "Nueva Función"
```

### 2. Crear via diálogo
- Nombre, idioma = **NodeJs**, namespace, tipo retorno = `collection`
- La URL del editor: `/customFunction/{nombre}/edit`

### 3. Editar código via Monaco (Playwright)
```js
// Después de navegar al editor y esperar ~10s + descartar popup Creator 5:
// 1. Descartar popup bloqueante (aparece siempre):
document.querySelector('.zc-mig-validate-btn-link-skip')?.click();
// 2. Esperar Monaco:
await browser_wait_for({ time: 3 });
// 3. Inyectar código:
window.monaco.editor.getModels()[0].setValue(nuevoCodigoJS);
```

⚠️ **El popup "Actualizar a Creator 5"** puede aparecer o no según el estado de la sesión del browser (no aparece en sesiones warm/recientes). Patrón correcto:
1. Navegar a la URL del editor
2. Esperar 4s
3. `document.querySelector('.zc-mig-validate-btn-link-skip')?.click()` (safe si no existe)
4. Esperar 3s más
5. Verificar `typeof window.monaco !== 'undefined'` antes de inyectar

### 4. Guardar y ejecutar

⚠️ **Los botones Guardar/Ejecutar NO se encuentran via `querySelectorAll('button')` desde JS** — devuelve 0 resultados (están en contexto DOM separado). Usar siempre snapshot ref:
```
browser_snapshot → localizar button "Guardar" [ref=eXXX] → browser_click target=eXXX
browser_snapshot → localizar button "Ejecutar" [ref=eYYY] → browser_click target=eYYY
```
- El botón dice "Guardando" mientras procesa.
- Diálogo "Ejecutar": parámetros en `input[name="args-{paramName}"]`. El botón "Enviar" también requiere snapshot ref.
- Si aparece diálogo "cambios no guardados" → click "Acepto, Continuar" ejecuta versión ANTIGUA → SIEMPRE guardar antes de ejecutar.

### 5. Leer resultado de la consola
```js
// El resultado está en:
const raw = document.querySelector('.zc-cfb-console-output-result')?.textContent;
const result = JSON.parse(raw); // { output: {...}, log: [...] }
// result.output = lo que pasaste a basicIO.write()
// result.log = array con todos los context.log.INFO() + "Execution Start." + "Execution completed."
```

---

## Casos de uso: Node.js vs Deluge

| Tarea | Deluge | Node.js |
|-------|--------|---------|
| Leer/crear/editar registros | ✅ Nativo (`zoho.creator.*`) | ⚠️ Requiere REST API via https |
| Llamadas HTTP simples | ✅ `invokeurl` | ✅ `require('https')` |
| Manipulación de binarios (PDF, ZIP, imágenes) | ❌ Imposible | ✅ Posible con librerías |
| Lógica compleja (recursión, closures, arrays) | ⚠️ Limitado | ✅ JS completo |
| Acceso a Zoho Files (Stratus) | ❌ | ✅ `context.getStratusOperations()` |
| Acceso a filesystem temporal | ❌ | ✅ `context.getWritableDirectory()` |
| Cache entre ejecuciones | ❌ | ✅ `context.getCache()` |
| Velocidad de desarrollo | ✅ Más rápido | ⚠️ Más verboso |
| Statement limits | ⚠️ 50.000 stmt/ejecución | ✅ Sin límite de statements |

---

## Patrón: renombrar/re-subir archivos de formulario

Para el caso de uso "renombrar el PDF adjunto de un registro al valor del campo Nombre":

```js
module.exports = async function(context, basicIO) {
    const https = require('https');
    const fs = require('fs');
    
    // 1. Obtener conexión OAuth configurada en la app
    const conn = await context.getConnection("zoho_creator_conn");
    // conn tiene método para obtener el token — explorar con inspect(conn)
    
    // 2. Descargar el archivo adjunto via REST API
    // GET https://creator.zoho.com/api/v2/{owner}/{app}/report/{reportLinkName}/records/{id}/attachment/{fieldLinkName}
    
    // 3. Guardar en filesystem temporal
    const dir = await context.getWritableDirectory();
    const filePath = dir + 'archivo.pdf';
    
    // 4. Re-subir con nuevo nombre via REST API multipart/form-data
    // POST con filename = campo Nombre del registro
    
    // 5. Actualizar el campo del registro con el nuevo fileId
    
    basicIO.write({ status: 'ok' });
}
```

⚠️ La firma exacta de `conn.getOauthToken()` o equivalente no está verificada —
hacer un diagnóstico con `context.getConnection("nombre")` pasando un nombre válido.

---

## Limitaciones conocidas

- **Node.js v8.14.0** — sin `fetch`, sin `Promise.allSettled`, sin optional chaining (`?.`) — usar `&&` en vez de `?.`
- **HTTP via proxy** — `HTTP_PROXY` y `HTTPS_PROXY` configurados; `https.request` respeta env vars de proxy automáticamente en Node v8
- **10 MB límite** para node_modules total
- **Sin `npm install`** — todo manual
- **Timeout de ejecución** — no documentado, pero como Lambda: estimado 30-60s
- **getConnection sin argumento** lanza `"Input must be a string.(Recieved type undefined)"` → siempre pasar nombre
- **El popup "Actualizar a Creator 5"** bloquea Monaco si no se descarta primero

---

## Variables de entorno disponibles en el runtime

```
NODE_OPTIONS, GOPATH, GOMAXPROCS, HOME, NODE_TLS_REJECT_UNAUTHORIZED,
PATH, ATZ, resourceBuildVersion,
PROXY_URL, PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASSWORD,
HTTP_PROXY, HTTPS_PROXY
```

`process.env.HOME` = directorio home del sandbox
`process.env.PROXY_URL` = URL del proxy de salida de Zoho
