---
name: zoho-api-patterns
description: >
  Patrones avanzados de Zoho Creator: KPIs filtrados, embeds ZML, permisos portal,
  exportScript, menú builder, rename programático, conditional formatting.
  Módulo complementario de zoho-creator-dev.
metadata:
  author: sicma21
  version: "2.0"
---

# Zoho API Patterns (Flujos J-Q)

Módulo complementario de `zoho-creator-dev`. Patrones avanzados para ZML, permisos y APIs internas.

---

## Flujo J: KPI Form Data filtrado por usuario portal logueado

⚠️ TRAMPA: `"${LoginEmail}"` sustituye en tiempo de diseño con email del admin — NO funciona.

**Patrón correcto** — usar `zoho.loginuserid` directamente en criteria ZML:
```
criteria='Campo.Mail_Portal_Empleado == zoho.loginuserid &amp;&amp; Estado == &quot;Valor&quot;'
```

**Campos típicos para filtrar por empleado:**
- Via lookup: `NombreLookup.Mail_Portal_Empleado == zoho.loginuserid`
- Email directo: `Email_Empleado == zoho.loginuserid`
- En Deluge de página: `Nuevo_Empleado[Mail_Portal_Empleado == zoho.loginuserid || Official_Email == zoho.loginuserid]`

---

## Flujo K: Embeber un reporte en una página ZML

**ZML tipo:**
```xml
<row>
  <column width='100%'>
    <panel elementName='Panel Titulo'>
      <pr width='fill' height='fill'>
        <pc padding='15px' bgColor='#F5F5F5' width='100%' hAlign='left' vAlign='middle'>
          <pr width='auto' height='auto'>
            <pc><text size='18px' bold='true' type='Text' value='Mi Sección'/></pc>
          </pr>
        </pc>
      </pr>
    </panel>
  </column>
</row>
<row>
  <column width='100%'>
    <report elementName='Report X' appLinkName='thisapp' linkName='LinkNameReporte'
            criteriaString='Campo == zoho.loginuserid &amp;&amp; Otro == &quot;Valor&quot;'
            iszreport='false' heightType='auto' heightValue='300' />
  </column>
</row>
```

**Reglas ZML críticas:**
- `padding`: solo UN valor (`'15px'`) — NO shorthand (`'10px 20px'`)
- `action`: valores = `OpenURL, OpenForm, OpenReport, OpenPage, ExecuteFunction, Link, Form, Report, Page, Function, Share, CustomAction`. ❌ `AddRecord` NO es válido
- `criteriaString`: XML-encoded — `&&` = `&amp;&amp;`, `"` = `&quot;`, `>=` = `&gt;=`
- `zoho.loginuserid` y `zoho.currentdate` se evalúan en runtime del portal

**Verificación**: portal en tab SEPARADO. `document.body.innerText.includes('Texto')` para confirmar.

---

## Flujo L: Gestionar permisos del portal (rol Empleado)

**Contexto**: Customer Portal tiene modelo de OWNERSHIP. Por defecto solo ves registros que TÚ creaste.

**Los 3 requisitos para ver registros RRHH en portal:**
1. `reportActionPerms.view` incluye report ID → acceso lectura
2. `ProfilePermission[formId]` incluye `["viewall"]` → bypass ownership
3. Filtro nativo del reporte con `zoho.loginuserid` → solo ve sus datos

### Flujo rápido: Solo TAB permission (para páginas nuevas)

Para conceder acceso TAB a una página nueva (el caso más común), NO hace falta capturar JSON ni hacer fetch manual. Basta con clicar la UI nativa:

```javascript
// 1. Navegar a /settings/edit#portal, wait 8s
// 2. Click tab "Permisos" (JS click OK — no necesita isTrusted):
document.querySelector('[class*="zc-dem"]')  // encontrar via snapshot
// O buscar el texto "Permisos" en el DOM

// 3. Click en el rol deseado (JS click funciona en a[permissionset]):
const links = [...document.querySelectorAll('a[permissionset]')];
links.find(l => l.textContent.trim() === 'NOMBRE_ROL').click();

// 4. Esperar 4s → checkboxes cargados (~90 TAB checkboxes)

// 5. Marcar checkbox TAB (⚠️ tabla duplicada — click PRIMER elemento [0]):
//    getElementById retorna [0] (frozen header), que es el que el form JS lee al submit.
//    Clickar [1] (body) NO persiste. Para uncheck, también usar [0].
const chks = [...document.querySelectorAll('[id="COMPONENT_ID_TAB"]')];
if (!chks[0].checked) chks[0].click();  // check
// Para uncheck: if (chks[0].checked) chks[0].click();

// 6. Click "Actualizar" (submit nativo — maneja CSRF automáticamente):
[...document.querySelectorAll('input[type=submit]')].find(b => b.value === 'Actualizar').click();

// 7. Esperar 4s → response {"profileName":"...","profileID":"..."}
```

⚠️ Para múltiples roles a la vez, usar un async loop en un solo `browser_evaluate`:
```javascript
await (async () => {
  const roles = ['ROL_1', 'ROL_2', 'ROL_3'];
  const compId = 'COMPONENT_ID';
  for (const rol of roles) {
    document.querySelectorAll('a[permissionset]').forEach(l => { if(l.textContent.trim()===rol) l.click(); });
    await new Promise(r => setTimeout(r, 4000));
    const chks = [...document.querySelectorAll(`[id="${compId}_TAB"]`)];
    if (chks[0] && !chks[0].checked) chks[0].click();
    [...document.querySelectorAll('input[type=submit]')].find(b=>b.value==='Actualizar')?.click();
    await new Promise(r => setTimeout(r, 4000));
  }
})();
```

**Verificación post-save**: recargar la página y comprobar el atributo `permissionset` del `<a>`:
```javascript
link.getAttribute('permissionset').includes('COMPONENT_ID')  // true = persistido
```

### Flujo completo: Modificar ProfilePermission / reportActionPerms (viewall, etc.)

Para cambios más complejos (añadir `["viewall"]` a un form, dar acceso a un reporte), se necesita capturar y modificar el JSON:

### Paso 1: Capturar CSRF token (zccpn)

```
1. browser_navigate → /settings/edit#portal
2. browser_wait_for (time: 10)
3. browser_evaluate: () => document.querySelector('#settings-portal-href')?.click()
4. browser_wait_for (time: 5)
5. browser_snapshot → localizar tab "Permisos" ref
6. browser_click ref=eXXX (tab Permisos) ⚠️ DEBE ser browser_click, NO evaluate (isTrusted)
7. browser_snapshot → localizar link del rol
8. browser_click ref=eYYY (link del rol) ⚠️ DEBE ser browser_click (isTrusted)
9. browser_wait_for (time: 3.5) → >1000 checkboxes
   ⚠️ NO hacer browser_snapshot aquí — supera límite de tokens
```

Instalar interceptor XHR:
```javascript
() => {
  window._capturedBody = null;
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(m, u, ...a) {
    this._url = u; return origOpen.call(this, m, u, ...a);
  };
  XMLHttpRequest.prototype.send = function(body) {
    if (this._url?.includes('updatePermissionSet')) window._capturedBody = body;
    return origSend.call(this, body);
  };
  return 'interceptor installed';
}
```

Click "Actualizar" → recuperar body → parsear → modificar → fetch con cambios.

### Paso 2: Llamar updatePermissionSet

```javascript
async () => {
  const zccpn = '...'; // del body capturado
  const permissionJson = { /* actual + modificado */ };
  permissionJson.ProfilePermission["FORM_ID"] = ["viewall"];
  const reportActionPerms = { /* actual + report ID añadido */ };

  const body = new URLSearchParams({
    permissionSetName: 'Empleado', userType: '2', actionStatus: 'UPDATE',
    profileId: 'PROFILE_ID',
    permissionJson: JSON.stringify(permissionJson),
    reportActionPerms: JSON.stringify(reportActionPerms),
    zccpn: zccpn
  });

  const resp = await fetch(
    '/appbuilder/formacion11/human-resource-management/usersandpermissions/edit/updatePermissionSet',
    { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString() }
  );
  return { status: resp.status, body: (await resp.text()).slice(0, 300) };
}
```

Éxito: HTTP 200 con JSON `{"profileName":"...","profileID":"..."}`.

**IDs conocidos:**
- Rol Empleado profileId: `4790826000000171117`
- Form Nueva_Lista_de_Requisitos: `4790826000000114889`
- Report Copy_of_Cliente_Empleado: `4790826000000968813`

**Checkboxes con guión en ID**: usar `document.getElementById('id-VIEW')`, NO `querySelector('#id-VIEW')`.

**Editor de permisos — tabla duplicada**: `querySelectorAll('[id="compId_TAB"]')` devuelve 2 elementos. Click en el **PRIMERO** `[0]` — es el frozen header que el form JS lee al submit. El `[1]` (body scrollable) NO persiste.

---

## Flujo M: Exploración rápida del exportScript (multi-consulta)

10-20x más rápido que navegar el IDE para consultas múltiples.

```javascript
// 1. Cargar .ds completo (~2.2MB):
async () => {
  const r = await fetch('/appbuilder/formacion11/human-resource-management/exportScript',
    {credentials: 'include'});
  window._ds = await r.text();
  return 'loaded ' + window._ds.length + ' chars';
}

// 2. Extraer campos de un formulario:
() => {
  const start = window._ds.indexOf('form FormLinkName\n');
  return window._ds.substring(start, start + 5000);
}

// 3. Listar TODOS los workflows:
() => {
  const re = /\t\t\t(\w+)\s+as\s+"([^"]+)"\s*\{\s*type\s*=\s*\w+\s*\n\s*form\s*=\s*(\w+)/g;
  const results = []; let m;
  while ((m = re.exec(window._ds)) !== null)
    results.push(`${m[3]} | ${m[1]} | "${m[2]}"`);
  return results.join('\n');
}
```

**Estructura del .ds:**
- Formularios: `form FormLinkName\n\t\t{`
- Reportes: `list|default list|calendar|summary ReportLinkName\n`
- Workflows: `WorkflowId as "Display Name" { type = form, form = FormName, ... }`
- Funciones: `function FunctionName\n`

---

## Flujo N: Conditional formatting via ZML del App IDE

⚠️ NO usar REST API `updateConditionalFormatting` para condiciones múltiples — devuelve "error".

**Patrón ZML de regla:**
```
"Nombre de la regla"
{
    condition = (Campo == "Valor" || OtroCampo == "Otro")
    fields = [S1]
    format = "background-color:#a5d6a7;"
}
```

**Flujo**: Leer .ds backup → generar bloque CF → reemplazar en App IDE → guardar con dirty trick.

---

## Flujo P: Renombrar displayName programáticamente

**Reporte:**
```javascript
async () => {
  const zccpn = document.cookie.split(';')
    .find(c => c.trim().startsWith('zccpn=')).trim().slice(6);
  const body = new URLSearchParams({ viewDisplayName: 'Nuevo Nombre', zccpn });
  const resp = await fetch(
    '/appbuilder/formacion11/human-resource-management/report/{linkName}/edit/renameView',
    { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString() });
  return { status: resp.status, body: await resp.text() };
}
```

**Space (módulo)**: abrir Menu Builder primero, usar `AppNavigatorUrls.getRenameSpaceUrl()`.

**IDs de spaces:** RRHH: `4790826000000022779`, PRL: `4790826000000069001`, Portal: `4790826000000112063`

---

## Flujo Q: Generador de Menús (Menu Builder)

**API BASE**: `{appURL}/appmenu/edit/`

**Jerarquía**: Space → Section (type 1=colapsable, type 2=flat) → Component (11=form, 12=report, 13=page)

**Leer estructura** (requiere abrir Menu Builder primero):
```javascript
$.ajax({ url: AppNavigatorUrls.getAppMenuComponentsAndStructureUrl(), type: 'GET',
         data: { deviceType: 1, zccpn: AppNavigator.component.csrfToken }, success: r => {
           // r.response.app_menu_components.spaces → array con sections y components
         }})
```

⚠️ SIEMPRE usar `deviceType: 1` hardcodeado — `AppNavigator.component.deviceType` puede cambiar a 3.

**Mutaciones** (helper):
```javascript
const post = (url, data) => new Promise(res => {
  $.ajax({ url, type: 'POST', dataType: 'JSON',
           data: { ...data, deviceType: 1, zccpn: AppNavigator.component.csrfToken },
           success: r => res({ ok: true, status: r.status }),
           error: x => res({ ok: false, code: x.status }) });
});
```

**Endpoints principales:**
- `reorderComponent`: mover componente (targetType: 1=space, 2=section)
- `addNewAppDeviceSection`: crear grupo
- `deleteAppDeviceSection`: borrar grupo (solo type:1, type:2 da 500)
- `renameSectionUrl`: renombrar grupo
- `removeComponentUrl`: quitar del menú (requiere `componentType: 1`)
- `renameSpaceUrl`: renombrar space

⚠️ Cada cambio se guarda inmediatamente — no hay undo.
⚠️ Wrappers type:2 se auto-eliminan cuando su componente es movido.

---

## Flujo R: Redirect tras editar un form-singleton fuera del reporte + Select2 en Workflow Builder

**Contexto**: si una página bonita abre el form de edición directamente por hash (`#Form:LinkName?recLinkID=X&viewLinkName=Y`, patrón del botón "Editar"), Zoho muestra su pantalla nativa de "guardado correctamente" al terminar en vez de volver a la página — el form nunca pasó por el reporte, así que no hay a dónde volver por defecto.

**Fix**: crear un workflow en el form, evento `Modificado` (o `Creado o editado`) → trigger `Envío de formulario correcto` (equivalente a "After Update success" / "On Submit Success") → acción tipo **Notificación → Redirigir a una URL** → target tipo **Página** → seleccionar la página deseada → ventana **Misma ventana**. Reutilizable para cualquier form-singleton (Configuración, etc.) editado fuera de su reporte.

```
1. /workflow/edit → "Nuevo flujo de trabajo" → elegir formulario
2. Radio "Modificado" (Record Event)
3. Form Event dropdown (select2, ver truco abajo) → "Envío de formulario correcto"
4. Nombrar + "Crear flujo de trabajo" → entra al workflow builder
5. "+ Agregar nueva acción" → tipo "Notificación" → "Redirigir a una URL"
6. Dropdown "Sitio web/Formulario/Reporte/Página" → "Página"
7. Dropdown "Seleccione la página" → la página destino
8. Dropdown ventana → dejar "Misma ventana"
9. "Guardar" → "Listo" (toolbar)
```

⚠️ **Select2 en Workflow Builder no abre con `.click()` de JS** (a diferencia de otros contextos donde sí funciona) — necesita el evento `mousedown`, y seleccionar la opción necesita la secuencia completa `mouseover→mousedown→mouseup→click` sobre el `<li>` (o su `div` interno):
```javascript
() => {
  document.querySelector('#s2id_wf-trigger-events a.select2-choice')
    .dispatchEvent(new MouseEvent('mousedown', {bubbles:true, cancelable:true, view:window}));
  // luego, con el dropdown abierto:
  const li = [...document.querySelector('#select2-drop').querySelectorAll('li.select2-result-selectable')]
    .find(l => l.textContent.trim() === 'Envío de formulario correcto');
  const target = li.querySelector('div') || li;
  ['mouseover','mousedown','mouseup','click'].forEach(t =>
    target.dispatchEvent(new MouseEvent(t, {bubbles:true, cancelable:true, view:window})));
}
```
Localizar el select2 correcto por su `id` contenedor (`#s2id_wf-trigger-events`, `#s2id_autogen93`, etc.) — inspeccionar `document.querySelectorAll('.select2-container')` y su `parentText`/`textContent` si el `id` autogenerado no es obvio.

---

## Flujos RRHH conocidos (referencia rápida)

> Ver documentación completa en `memory/rrhh-flows.md`

### EPI / Herramientas
- Form: `Solicitud_de_EPIs_Herramientas`
- Estados: Sin Respuesta → Aprobado/Gestionándose/Rechazado → Entregado → Confirmado

### Permisos / Vacaciones
- Form: `Solicitud`
- Estados: SI / NO / Sin Respuesta

### Mensajes
- Form: `Mensaje` — modelo `Conversaci_n` (1 por empleado)
- Fix conocido: filtro `[Tecnico.Mail_Portal_Empleado == zoho.loginuserid || ...]`
