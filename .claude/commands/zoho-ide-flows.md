---
name: zoho-ide-flows
description: >
  Flujos de trabajo IDE para Zoho Creator: leer/editar Deluge, explorar formularios,
  editar ZML de páginas, HTML Snippets, crear workflows. Módulo complementario de zoho-creator-dev.
metadata:
  author: sicma21
  version: "2.0"
---

# Zoho IDE Flows (Flujos A-I)

Módulo complementario de `zoho-creator-dev`. Contiene los flujos para trabajar con el IDE.

---

## Flujo A: Leer código Deluge de un workflow

```
1. list_forms (MCP)                    → identificar form_link_name si no se conoce
2. browser_navigate → /workflow/edit   → ir a la lista de workflows
3. browser_wait_for (time: 8)
4. browser_snapshot                    → identificar workflow_link_name en la tabla
5. browser_navigate → /workflowbuilder/{workflow_link_name}/edit
6. browser_wait_for (time: 15)
7. browser_evaluate:
   () => {
     const editor = window.require?.('zohoedit/editor')?.getActiveEditor?.()
                 || window._zohoEditor || window.editor;
     if (editor?.getValue) return editor.getValue();
     return [...document.querySelectorAll('.view-line')]
       .map(l => l.textContent).join('\n');
   }
```

## Flujo B: Editar código Deluge de un workflow

⚠️ El editor principal del workflowbuilder usa `zohoedit` — NO accesible via JS.
`window.require('zohoedit/editor')` siempre devuelve `undefined`.

**Excepción**: el panel de script de una acción específica (editor inline "Deluge script")
SÍ expone `document.querySelector('.CodeMirror').CodeMirror` y acepta `setValue()`.

```
1. Flujo A completo (leer código actual)
2. Preparar código nuevo
3. Pedir al usuario que pegue (Ctrl+A + Ctrl+V) o usar CM inline
4. browser_press_key → Control+s → guardar
5. browser_wait_for (time: 3)
6. browser_snapshot → confirmar guardado
```

**Caso especial — trigger "Validaciones al enviar formularios" (on_validate)**:
El editor se abre directamente al hacer click en "+ Agregar nueva acción" (NO aparece menú de tipo).
`document.querySelector('.CodeMirror').CodeMirror` está disponible de inmediato.
Guardar: `input[value="Guardar"]` (primer save) → luego `input[value="Actualizar"]`.
Verificar: POST `saveAction → 200` + `updateAction → 200`.

## Flujo C: Explorar la estructura de un formulario

```
1. list_forms (MCP) → obtener form_link_name
2. get_form_fields (MCP) → campos, tipos, opciones (suficiente sin abrir IDE)
3. [Opcional] browser_navigate → /form/{form_link_name}/edit
4. browser_wait_for (time: 10)
5. browser_take_screenshot → layout visual
```

## Flujo D: Ver workflows de un formulario específico

```
1. browser_navigate → /workflow/edit
2. browser_wait_for (time: 8)
3. browser_snapshot → panel izq. lista formularios, derecho muestra workflows
4. browser_click en el listitem del formulario
5. browser_snapshot → tabla de workflows (nombre, evento, estado, fecha)
```

## Flujo E: Añadir un campo a un formulario

```
1. browser_navigate → /form/{form_link_name}/edit
2. browser_wait_for (time: 10)
3. browser_snapshot → confirmar form builder cargó
4. Abrir builder (si hay overlay):
   browser_evaluate:
   () => {
     const iframes = document.querySelectorAll('iframe');
     for (const f of iframes) {
       try { const link = f.contentDocument?.querySelector('a[isthirdpartyform]');
         if (link) { link.click(); return 'opened'; } } catch(e) {}
     }
     const link = document.querySelector('a[isthirdpartyform]');
     if (link) { link.click(); return 'opened main'; }
     return 'not found';
   }
5. browser_wait_for (time: 8) → esperar canvas
6. Listar tipos de campo disponibles:
   browser_evaluate:
   () => [...document.querySelectorAll('li.ui-draggable.ui-draggable-handle')]
     .map(el => el.textContent.trim()).filter(Boolean)
7. Añadir campo (dblclick):
   browser_evaluate:
   () => {
     const items = document.querySelectorAll('li.ui-draggable.ui-draggable-handle');
     const target = [...items].find(el => el.textContent.trim() === 'NombreTipoCampo');
     target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
   }
8. Configurar propiedades (label, obligatorio, default, opciones...)
   IMPORTANTE: Zoho auto-codifica acentos en link names (é/í → _f). Corregir siempre:
   browser_evaluate:
   () => {
     const inp = document.querySelector('#labelName');
     inp.value = 'Link_Name_Correcto';
     inp.dispatchEvent(new Event('input', { bubbles: true }));
     inp.dispatchEvent(new Event('change', { bubbles: true }));
   }
9. Guardar: click en "Listo" (NO Ctrl+S)
```

## Flujo F: Crear un workflow Field Rule (mostrar/ocultar campos)

```
1. browser_navigate → /workflow/edit
2. browser_wait_for (time: 8)
3. browser_click "Nuevo flujo de trabajo" → seleccionar formulario
4. Configurar: Evento "Creado o editado", Tipo "Reglas de campos"
5. ACCIÓN 1 (ocultar por defecto, sin condición):
   - Select2 (#s2id_showHideField): escribir en input + keyup + click opción
   - NO marcar condición
   - browser_click "Guardar"
6. ACCIÓN 2 (mostrar bajo condición):
   - Seleccionar condición, radio "Bajo la condición":
     () => document.querySelector('label[for="oncriteria"]').click()
   - Seleccionar "Mostrar campos" + mismos campos
   - browser_click "Guardar"
7. browser_click "Listo" → guarda workflow completo

PATRÓN "hide siempre + show bajo condición":
Zoho evalúa en orden. La acción incondicional (hide) actúa como reset.
```

## Flujo G: Crear un registro de prueba y verificarlo

```
1. get_form_fields (MCP) → conocer campos obligatorios
2. create_record (MCP) → crear con campos mínimos
3. get_records (MCP) → verificar que aparece
4. [Si falla] → revisar mensaje (code != 3000)
5. delete_record (MCP) → limpiar registro de prueba
```

## Flujo H: Cierre de sesión — exportar código fuente

**OBLIGATORIO al finalizar sesiones con cambios.**

```
1. browser_evaluate:
   async () => {
     const resp = await fetch('/appbuilder/formacion11/human-resource-management/exportScript',
       { credentials: 'include' });
     const source = await resp.text();
     return source.length + ' chars';
   }
2. Confirmar: "Código fuente actualizado descargado"
```

No necesario si la sesión fue solo de lectura.

## Flujo I: Editar ZML de una página en el App IDE

```
1. browser_navigate → /settings/edit#applicationide
2. browser_wait_for (time: 12)
3. Scroll sidebar y seleccionar página:
   async () => {
     // ⚠️ Solo existen 8 scrollables (índices 0-7). [7] es el árbol de App IDE.
     // Para páginas: scrollTop ~28000; para funciones custom: usar scrollHeight (máximo).
     const sidebar = document.querySelectorAll('.ZCScrollable')[7];
     sidebar.scrollTop = 28000;
     await new Promise(r => setTimeout(r, 900));
     const links = [...document.querySelectorAll('a.zc-dem-box-sizing')];
     const target = links.find(a => a.textContent.trim() === 'NombreDePágina');
     if (!target) return 'not found';
     target.click();
     return 'clicked';
   }
   ⚠️ Usar 'a.zc-dem-box-sizing' — NO 'a.zc-comp-link' (navega fuera al preview)

4. Leer ZML actual:
   () => document.querySelector('.CodeMirror').CodeMirror.getValue()

5. Modificar ZML — OBLIGATORIO forzar dirty state tras setValue():
   () => {
     const cm = document.querySelector('.CodeMirror').CodeMirror;
     const newZml = cm.getValue().replace('...marker...', '...newContent...');
     cm.setValue(newZml);
     // Forzar dirty (obligatorio — sin esto no dispara XHR):
     const ll = cm.lastLine();
     const lc = cm.getLine(ll).length;
     cm.replaceRange(cm.getLine(ll).slice(-1), {line: ll, ch: lc - 1}, {line: ll, ch: lc});
     return `done, isDirty=${!cm.isClean()}`;
   }

6. Guardar: document.querySelector('a.zc-dem-savescript').click()
   Para páginas, POST /validatePageZML valida Y guarda en una llamada.

7. Verificar — navegar a otra página del árbol y volver:
   async () => {
     const pages = [...document.querySelectorAll('a.zc-dem-box-sizing[type="page"]')];
     const other = pages.find(p => p.getAttribute('pagelinkname') !== 'TuPaginaLinkName');
     other?.click();
     await new Promise(r => setTimeout(r, 1500));
     const target = pages.find(p => p.getAttribute('pagelinkname') === 'TuPaginaLinkName');
     target?.click();
     await new Promise(r => setTimeout(r, 1500));
     return document.querySelector('.CodeMirror').CodeMirror.getValue().includes('tuMarcador');
   }
```

**Posiciones de scroll para secciones del árbol IDE:**
| Sección | scrollTop |
|---------|-----------|
| Páginas | ~28000 |
| Funciones personalizadas | ~30500 (scrollHeight total ~33600) |

**Botones del App IDE (NO confundir):**
- `a.zc-dem-savescript` → "Guardar" ← guarda ZML/Deluge ✅
- `INPUT.zc-dem-primarybtn[value="Apply"]` → popup de ícono, NO guarda ZML ❌
- `a.zc-dem-done` → "Listo" ← navega fuera sin guardar ❌

**Preview admin**: `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:{page_link_name}`

---

## Flujo I-bis: Editar código Deluge de una función custom

### Opción A — URL directa (MÁS RÁPIDA, recomendada)

URL: `https://creator.zoho.com/appbuilder/formacion11/{app}/customFunction/Namespace.FunctionName/edit`

- ⚠️ **DOMINIO `creator.zoho.com`, NO `creatorapp.zoho.com`** — en `creatorapp` el editor NO monta (CodeMirror en blanco, `getDependencies → 404`). `creatorapp` es solo el app runner/preview. Ver tabla de errores.
- Carga un editor Deluge de página completa independiente del App IDE
- Botón guardar: `input[type="button"]` con id `saveFuncBtn` — NO `<button>`. `querySelectorAll('button')` devuelve 0.
- El botón SÍ existe: `document.getElementById('saveFuncBtn')` lo encuentra. Pero si `FunctionBuilder.functionPopulateUrl` es `undefined` (fallo de WebSocket/Zia en la carga), el click no dispara ningún POST.
- **Guardar robusto** (usar siempre, ya que el init puede fallar):
  ```javascript
  FunctionBuilder.functionPopulateUrl = appbuilder.component.APP.getAppEditUrl() + '/workflowbuilder/edit';
  FunctionBuilder.saveCustomFunction();
  ```
  Endpoint real: `POST /workflowbuilder/edit/populateCustomFunction` (NO `/customFunction/.../populateCustomFunction` — 404)
- Verificar por `POST /workflowbuilder/edit/populateCustomFunction → 200` en network requests.
- NO usar `a.zc-dem-savescript` aquí — no existe en este editor
- Esperar `time: 5` tras navigate para que el CM cargue (CodeMirror, NO Monaco)

```
1. browser_navigate → /customFunction/Namespace.FunctionName/edit
2. browser_wait_for (time: 5)
3. Verificar: () => document.querySelector('.CodeMirror')?.CodeMirror?.getValue()?.substring(0, 80)
4. Aplicar cambio (ver patrón replace abajo)
5. browser_snapshot → localizar ref de button "Guardar" → browser_click target=ref
6. browser_wait_for (time: 3)
7. Verificar XHR: instalar interceptor ANTES del click y comprobar `window._allRequests` incluye `populateCustomFunction`. Si no aparece, el save NO se disparó — hacer snapshot de nuevo y reintentar el click. El primer click a veces falla silenciosamente.
8. **Verificar persistencia** — navegar a una función DIFERENTE (`browser_navigate → /customFunction/OtraFuncion/edit`), luego volver a la URL original. NO recargar la misma URL — dispara `beforeunload` y bloquea la navegación. NO usar `cm.isClean()` (queda `false` incluso tras save exitoso porque Zoho normaliza server-side).
```

⚠️ **Diálogo `beforeunload`**: Al navegar desde el editor de funciones (incluso tras save exitoso), el browser dispara `beforeunload` porque `isClean()=false`. Si aparece un modal state `beforeunload`, usar `browser_handle_dialog(accept=true)` para continuar. Esto NO indica que el save falló.

⚠️ **Clasificador de permisos de Claude Code puede bloquear el interceptor XHR** usado para capturar `populateCustomFunction` (override de `XMLHttpRequest.prototype.open`/`send` dentro de `browser_evaluate`) — denegado con "Blocked by classifier" aunque el mismo código sin el interceptor (solo `FunctionBuilder.saveCustomFunction()`) se ejecute sin problema. No reintentar el mismo override; hacer el save "a secas" y verificar persistencia por el método canónico (navegar a otra función y volver, releer `cm.getValue()`) en vez de por la captura de la request.

⚠️ **App IDE `/applicationide/custom_functions/...` endpoint devuelve 400** si se llama via `fetch()` desde el editor directo `/customFunction/...` con el CSRF del cookie. Solo funciona desde el contexto del App IDE. No intentar esta ruta como alternativa.

⚠️ **Diálogo "Ejecutar"**: parámetros de la función son inputs `input[name="args-{paramName}"]`.
El botón "Enviar" tampoco se encuentra via `querySelectorAll('button')` — usar snapshot ref igual que Guardar.

⚠️ **CodeMirror NO autoguarda**. Si el browser/pestaña se cierra antes del click `saveFuncBtn`, todos los cambios `setValue()` se pierden — no hay localStorage ni recovery. Siempre guardar antes de navegar fuera.

### Opción B — App IDE (verificado 2026-06-03)

⚠️ NO usar `/workflowbuilder/{nombre}/edit` — pantalla en blanco para funciones con namespace.
⚠️ `populateCustomFunction` devuelve 400 desde `/settings/edit#applicationide`. Endpoint correcto:
  - Leer: `POST /appbuilder/{owner}/{app}/applicationide/custom_functions/{NS}.{Name}/definition`
  - Body: `custom_functionsLinkName={NS}.{Name}&zccpn={token}`
  - Guardar: `POST /appbuilder/{owner}/{app}/applicationide/custom_functions/{NS}.{Name}/save`
  - Body: `custom_functionsLinkName={NS}.{Name}&definition={url-encoded-code}&zccpn={token}`
  - ⚠️ `ZCSecurity` es `undefined` en App IDE — capturar `zccpn` vía XHR interceptor al hacer click en cualquier función.

⚠️ Las funciones en el árbol tienen prefijo "Deluge": textContent = `Deluge{FunctionName}`. NO buscar por `function_id`.

```
1. Abrir App IDE:
   - Desde la app viva → "Editar esta aplicación" → App Builder
   - En App Builder: document.querySelector('li.zc-dem-settings a').click() → Configuración
   - Click "IDE de la aplicación" → URL queda en /settings/edit#applicationide

2. Scroll hasta Funciones personalizadas (scrollTop ~30500):
   const panel = document.querySelector('.ZCScrollable');
   panel.scrollTop = 30500;

3. Instalar XHR interceptor para capturar zccpn:
   window._xhrCalls = []; const origO = XMLHttpRequest.prototype.open, origS = XMLHttpRequest.prototype.send;
   const meta = new WeakMap();
   XMLHttpRequest.prototype.open = function(m,u){meta.set(this,{m,u:u.toString()});return origO.apply(this,arguments)};
   XMLHttpRequest.prototype.send = function(b){const d=meta.get(this)||{};if(d.u?.includes('definition'))window._xhrCalls.push({u:d.u,body:b?.toString()});return origS.apply(this,arguments)};

4. Click en la función:
   Array.from(document.querySelectorAll('a.zc-dem-appide-comp'))
     .find(el => el.textContent.trim() === 'Deluge{FunctionName}')?.click();

5. Extraer zccpn del body capturado:
   const csrf = window._xhrCalls[0].body.match(/zccpn=[^&]+/)[0];

6. Leer y editar con CodeMirror (ver patrón replace abajo)

7. Guardar: Array.from(document.querySelectorAll('a, button'))
     .find(el => el.offsetWidth > 0 && el.textContent.trim() === 'Guardar').click()
   // equivalente a: document.querySelector('a.zc-dem-savescript').click()

8. Verificar: window._saveResult (instalar listener load en XHR save)
   Éxito: {"status":"success"}
```

### Opción C — Crear una función custom NUEVA sin la UI del árbol (verificado 2026-07-08)

Mismo endpoint que el save (`POST {appEditUrl}/workflowbuilder/edit/populateCustomFunction`), con:
```javascript
const c = Object.assign({}, FunctionBuilder.getUrlParams(), {   // {appid, freeflow, zccpn, zohoruntime}
  scripttype: 'workflowadd',                     // 'workflowmodify' = editar; 'workflowdelete' = borrar
  language: '0',                                  // Deluge
  functionName: 'Namespace.NombreFn',             // o solo 'Nombre' si namespace Default
  script: 'string Namespace.NombreFn()\n{\nreturn "";\n}',  // firma + cuerpo COMPLETOS
  sb_tracking: true, sb_compCategory: 'Function'
});
$.ajax({url: appbuilder.component.APP.getAppEditUrl()+'/workflowbuilder/edit/populateCustomFunction', type:'POST', data:c, success:o=>...});
// Éxito: {status:'success', functionDetails:{functionid,...}}
```
⚠️ **Cuerpo grande falla en create con lint espurio** (ej. líneas correctas marcadas "Improper Statement"): crear primero un **STUB** (`...(){ return ""; }`) con `workflowadd`, luego abrir `/customFunction/NS.Fn/edit` e inyectar el cuerpo real por CodeMirror + guardar (ruta modify Opción A). El editor modify da el `lineNumber` EXACTO del error de lint — usar eso para depurar.

### Ejecutar una función headless (sin diálogo de args) — verificado 2026-07-08

Para one-shots parametrless (backfills, migraciones), evita el diálogo de "Ejecutar":
```javascript
$.ajax({url: appbuilder.component.APP.getAppEditUrl()+'/workflowbuilder/edit/executeScript', type:'POST',
  data:{ sharedBy:FunctionBuilder.component.scopeName, zccpn:FunctionBuilder.component.csrfToken,
         functionid:FunctionBuilder.functionMeta.funcId, appID:FunctionBuilder.functionMeta.appid,
         zohoruntime:new Date().getTime(), isSchedulerScript:false, showresult:true },
  success:r=>{ /* r = HTML; output de `info` dentro de .zc-dem-execute-script-content */ }});
```
Llamar repetido para procesar por lotes (`MAX_BATCH` dentro de la función + loop de `await` en el `browser_evaluate`). Con args el valor va como `argArray` (JSON), NO como clave plana (clave plana → HTTP 400).

⚠️ **Verificado 2026-07-29**: para funciones CON parámetros, `argArray` vía este endpoint headless devuelve una página de error genérica de Zoho ("Algo salió mal") en vez de ejecutar — el endpoint headless solo es fiable para funciones **parameterless**. Si la función tiene argumentos, usar el diálogo "Ejecutar" normal (`executeFuncBtn` → `input[name="args-{paramName}"]` con setter nativo + evento `input` → snapshot para hallar el ref del botón "Enviar" → `browser_click`). Verificar éxito leyendo `.zc-dem-execute-script-result` (texto "Se ejecutó correctamente").

### Extraer código completo del CM a un archivo (para diff o backup)

```javascript
// browser_evaluate con filename → el resultado se guarda como JSON.stringify(valor), NO como texto plano
() => document.querySelector('.CodeMirror').CodeMirror.getValue()
// filename: 'D:\\ruta\\repo\\.playwright-mcp\\salida.txt'
```
⚠️ El archivo resultante tiene el código con `\n`/`\t`/`"` escapados como JSON string (una sola línea). Decodificar antes de diff/usar:
```bash
node -e "const fs=require('fs'); fs.writeFileSync('salida_decoded.txt', JSON.parse(fs.readFileSync('salida.txt','utf8')), 'utf8');"
```
⚠️ **Restricción de directorio**: el parámetro `filename` de `browser_evaluate` solo acepta rutas dentro de `.playwright-mcp/` o la raíz del repo — el directorio scratchpad de la sesión (`AppData\Local\Temp\...`) da `File access denied`. Escribir siempre en `{repo}/.playwright-mcp/`.
⚠️ **Node, no Python**: este entorno Windows normalmente NO tiene `python3` en el PATH (da "no se encontró Python"). Usar `node -e "..."` para cualquier decodificación/transformación rápida de texto.

**Técnica "full setValue" cuando el draft local coincide con el código vivo**: si un `diff` entre el backup local y el código vivo decodificado da 0 diferencias (aparte de BOM/newline final), es más seguro construir la versión nueva completa en local (con Edit normal), y luego hacer un único `cm.setValue(codigoCompletoNuevo)` en vivo en vez de N replaces parciales — evita fallos por normalización de espacios de Zoho en el texto ancla. Si el diff muestra diferencias, usar el patrón replace parcial de abajo con el texto real del CM, no el draft.

### Patrón replace parcial (aplica a ambas opciones)

⚠️ **Zoho normaliza el código al guardar**: `for each f` → `for each  f` (doble espacio), `ifnull(x, "")` → `ifnull(x,"")` (sin espacios tras comas). Los drafts locales NO coinciden exactamente. SIEMPRE verificar el texto real del CM antes de replace:

⚠️ **Dirty trick (forzar dirty)**: Necesario para páginas ZML (Flujo I). Para funciones custom en App IDE (Opción B) NO es necesario — el botón "Guardar" lee el CM directamente sin comprobar `isClean()`.

⚠️ **Verificar indentación real antes de escribir el anchor**: Distintas secciones de una misma función tienen distinto nivel de tabs. Ej: bloque asignaciones (dentro de `for each r` dentro de `for each nameId`) → 4 tabs; bloque permisos (`for each sol`) → 3 tabs. El draft local puede diferir. Diagnóstico rápido: `const idx = code.indexOf('fragmento_unico'); code.substring(idx-10, idx+80)` — inspecciona tabs visualmente antes de construir el anchor.

```javascript
() => {
  const cm = document.querySelector('.CodeMirror').CodeMirror;
  const code = cm.getValue();

  // 1. Verificar patrón exacto
  const OLD = 'fragmento exacto del CM';  // copiar de cm.getValue(), no del draft local
  if (!code.includes(OLD)) return 'PATRON NO ENCONTRADO: ' + JSON.stringify(code.substring(N, N+200));

  // 2. Aplicar
  const nuevo = code.replace(OLD, 'nuevo texto');
  cm.setValue(nuevo);

  // 3. Forzar dirty (obligatorio)
  const ll = cm.lastLine(); const lc = cm.getLine(ll).length;
  cm.replaceRange(' ', {line: ll, ch: lc});
  cm.replaceRange('', {line: ll, ch: lc}, {line: ll, ch: lc + 1});
  return 'ok lines=' + cm.lineCount() + ' dirty=' + !cm.isClean();
}
```

Para reemplazos por número de línea (cuando el texto es muy largo para un string literal):
```javascript
() => {
  const cm = document.querySelector('.CodeMirror').CodeMirror;
  const lines = cm.getValue().split('\n');
  // Mostrar líneas exactas: lines.slice(44, 85).map((l,i) => (i+45)+': '+JSON.stringify(l)).join('\n')
  const before = lines.slice(0, FROM_LINE - 1);  // 0-indexed
  const after = lines.slice(TO_LINE);
  const newLines = ['línea nueva 1', 'línea nueva 2'];
  cm.setValue([...before, ...newLines, ...after].join('\n'));
  // + dirty trick
}
```

---

## Flujo I-ter: Checklist al duplicar una página

Al duplicar una página en Zoho Creator, se copian verbatim:
- ✅ ZML — actualizar si usa IDs hardcodeados
- ✅ Variables de página — eliminar las heredadas no necesarias
- ✅ **Page script** — **SIEMPRE limpiar**. Si la página origen tenía script pesado (loops, queries), ese script corre ANTES del snippet en la nueva página, agotando el límite de statements. Síntoma: "statement execution limit" en línea trivial de la función.

⚠️ **Trigger de diagnóstico**: si ves "statement execution limit" en una función que debería ser simple, verifica el page script ANTES de intentar optimizar la función. Test rápido: reemplaza la función con 2 líneas (`records = Form[ID != 0]; return "count=" + records.size();`) — si sigue fallando con el mismo error, el culpable es el page script, no la función.

```
1. browser_navigate → /pagebuilder/{newPage}/edit
2. browser_wait_for (time: 10)
3. Abrir panel de variables/script:
   () => { document.querySelector('a.zc-formulaIcon').click(); return 'ok'; }
4. browser_wait_for (time: 3)
5. Cambiar al tab "Secuencia de comandos":
   () => {
     const span = [...document.querySelectorAll('*')]
       .find(el => el.children.length === 0 && el.textContent.trim() === 'Secuencia de comandos');
     span.click(); return span.className;
   }
   // La clase es 'zc-pb-minibuild-panel-view-switch'
6. browser_wait_for (time: 3)
7. Leer y limpiar CM:
   () => {
     const cm = document.querySelector('.CodeMirror').CodeMirror;
     const code = cm.getValue();
     cm.setValue('// {NombrePagina}');
     const ll = cm.lastLine(); const lc = cm.getLine(ll).length;
     cm.replaceRange(' ', {line: ll, ch: lc});
     cm.replaceRange('', {line: ll, ch: lc}, {line: ll, ch: lc + 1});
     return 'was: ' + code.substring(0, 80);
   }
8. Guardar (botón "Guardar" del panel — es un <button>, no "Listo"):
   () => { document.querySelector('button[class*="save"], button').click(); }
   // o: [...document.querySelectorAll('button')].find(b => b.textContent.trim()==='Guardar').click()
```

---

## Flujo O: HTML Snippets en Page Builder

⚠️ Page scripts NO pueden llamar custom functions — "Calling a custom function is not supported".
La única forma es desde un HTML Snippet.

**Arquitectura**: Custom function → genera HTML string → HTML Snippet lo renderiza.

**Acceder al editor**: Page Builder → hover snippet → "Configurar" → panel lateral (NO modal).

**Sintaxis del snippet (JSP-like):**
```
<%{
  anio_ = if(input.Anio != 0, input.Anio, zoho.currentdate.getYear());
  html_ = thisapp.Namespace.FunctionName(anio_);
  %>
<%=html_%>
<%}%>
```

**Múltiples CodeMirror — identificar el correcto:**
```javascript
() => {
  const cms = document.querySelectorAll('.CodeMirror');
  return [...cms].map((el, i) => `[${i}] lines=${el.CodeMirror.lineCount()} classes=${el.className}`);
}
```
→ Snippet editor tiene clase `codemirror-div`. Usar: `document.querySelector('.CodeMirror.codemirror-div').CodeMirror`

**Guardar**: CM setValue + dirty trick → click "Guardar" en panel lateral → esperar toast → click "Listo" toolbar.

**Trampa al duplicar páginas**: el código del snippet se copia verbatim. Actualizar manualmente.

---

## Flujo J: Menu Builder — renombrar, mover, reordenar

```
1. browser_navigate → /appbuilder/formacion11/{app}/edit
2. browser_wait_for (time: 8)
3. browser_evaluate: document.querySelector('[title*="Generador de men"]')?.click()
4. browser_wait_for (time: 5)
```

**Extraer estructura completa (nombres + IDs):**
```javascript
() => {
  const spaces = document.querySelectorAll('#menu-builder-artboard [eltype="space"]');
  const result = [];
  spaces.forEach(sp => {
    const spName = sp.querySelector('input.zc-dem-amb-disp-name')?.value;
    const spId = sp.getAttribute('data-id');
    const items = [];
    const workarea = sp.querySelector('[artboard-space-workarea]');
    if (!workarea) return;
    workarea.childNodes.forEach(child => {
      if (child.nodeType !== 1) return;
      const eltype = child.getAttribute('eltype');
      const dataId = child.getAttribute('data-id');
      if (eltype === 'section') {
        const secName = child.querySelector('input.zc-dem-amb-disp-name')?.value
          || child.querySelector('span.zc-dem-drag-elem-txt')?.textContent.trim();
        const comps = [];
        child.querySelectorAll('[eltype="component"]').forEach(c => {
          comps.push({ id: c.getAttribute('data-id'), name: c.getAttribute('data-displayname'),
                       link: c.getAttribute('data-linkname') });
        });
        items.push({ type: 'section', id: dataId, name: secName, comps });
      } else if (eltype === 'component') {
        items.push({ type: 'comp', id: dataId, name: child.getAttribute('data-displayname'),
                     link: child.getAttribute('data-linkname') });
      }
    });
    result.push({ space: spName, id: spId, items });
  });
  return JSON.stringify(result, null, 2);
}
```

⚠️ **TRAMPA**: Los nombres de componentes están en `data-displayname` (atributo HTML del `<li>`), NO en `input.value` (esos son checkboxes con value="on").

**APIs disponibles (POST, todas auto-guardan — no hay botón save):**

| Acción | Endpoint | Params clave |
|--------|----------|-------------|
| Mover componente | `AppNavigatorUrls.getReorderComponentUrl()` | `componentId, componentType(1), targetId, targetType(1=space,2=section), position(1-based)` |
| Crear sección | `AppNavigatorUrls.getAddNewSectionUrl()` | `appDeviceSectionName, appDeviceSpaceId, position` |
| Eliminar sección | `AppNavigatorUrls.getDeleteSectionUrl()` | `appDeviceSectionId` |
| Eliminar space | `AppNavigatorUrls.getDeleteSpaceUrl()` | `appDeviceSpaceId` |
| Renombrar componente | `AppNavigatorUrls.getRenameComponentUrl()` | `componentId, displayName` |

Todas requieren: `deviceType: 1, zccpn: AppNavigator.component.csrfToken`

**Ejemplo — mover componente:**
```javascript
$.ajax({
  url: AppNavigatorUrls.getReorderComponentUrl(),
  type: 'POST', dataType: 'JSON',
  data: { deviceType: 1, componentId: 'ID', componentType: 1,
          targetId: 'SPACE_OR_SECTION_ID', targetType: 1, position: 3,
          zccpn: AppNavigator.component.csrfToken },
  success: r => console.log(r) // {"status":"success"}
});
```

**Patrón "fusionar space en sección":**
1. `addNewAppDeviceSection` en space destino → obtener `sectionId`
2. `reorderComponent` × N para mover cada componente al `sectionId` (targetType:2)
3. `deleteAppDeviceSection` para limpiar secciones type:1 vacías
4. `deleteAppDeviceSpace` para eliminar el space vacío

---

## Flujo K: Form Builder — modificar propiedades de campo

```
1. browser_navigate → /appbuilder/formacion11/{app}/form/{form_link_name}/edit
2. browser_wait_for (time: 8)
   → URL cambia a /formbuilder/{form_link_name}/edit
```

**Estructura del form builder:**
- Los campos están como `<li elname="fieldLi" labelname="{link_name}">` en el **main page** (div `#appbuilder-popup`), NO en el iframe de preview.
- El iframe `#designPreviewFrame` muestra el preview del form.
- Clickear un `<li>` carga el panel de propiedades a la derecha.

**Listar todos los campos:**
```javascript
() => {
  const fields = document.querySelectorAll('li[elname="fieldLi"]');
  return [...fields].filter(f => f.getAttribute('labelname'))
    .map(f => ({
      labelname: f.getAttribute('labelname'),
      fieldtype: f.getAttribute('fieldtype'),
      seq: f.getAttribute('seq_no'),
      selected: f.classList.contains('selectedType')
    }));
}
```

**Seleccionar campo y modificar propiedad (Playwright):**
```javascript
// Click en el campo (Playwright native — NO JS .click())
await page.locator('li[elname="fieldLi"][labelname="Campo_Link_Name"]').click();
await page.waitForTimeout(1000);

// Leer propiedad
const displayName = await page.locator('#displayName').first().inputValue();
const isMandatory = await page.locator('#isMandatory').isChecked();

// Activar obligatorio
await page.locator('label[for="isMandatory"]').first().click();
```

⚠️ **TRAMPAS:**
- `#displayName` tiene 5 instancias (campo + botones submit/reset/update/cancel) → usar `.first()`
- El click DEBE ser Playwright native (`.click()`), NO `dispatchEvent` vía JS — el form builder no responde a eventos sintéticos de JS
- **Auto-guarda**: cada cambio de propiedad se persiste inmediatamente por XHR. Indicador: `.zc-save-status` muestra "Guardado". No hay botón guardar.
- `FB.FIELDS` (global) contiene el mapa de campos: `FB.FIELDS['Campo_Link_Name']`
