# Zoho Creator IDE — Estructura y URLs (explorado 2026-03-07/09, actualizado 2026-03-09)

## URLs directas del IDE (sin clicks, navegación instantánea)

```
# Outer shell (creator.zoho.com)
Constructor home:    /appbuilder/formacion11/{app}/edit
Workflow list:       /appbuilder/formacion11/{app}/workflow/edit
Settings:            /appbuilder/formacion11/{app}/settings/edit

# Form/Report/Workflow editors
Form editor:         /appbuilder/formacion11/{app}/form/{form_link_name}/edit
Report editor:       /appbuilder/formacion11/{app}/report/{report_link_name}/edit
Workflow editor:     /appbuilder/formacion11/{app}/workflowbuilder/{workflow_link_name}/edit
```

Ejemplo real confirmado:
- `https://creator.zoho.com/appbuilder/formacion11/human-resource-management/form/Nuevo_Empleado/edit`
- `https://creator.zoho.com/appbuilder/formacion11/human-resource-management/workflowbuilder/Run_Scripts_While_Adding_40/edit`

## Arquitectura del IDE

- El **Constructor** (formularios/páginas) usa un **iframe** interno (`creatorapp.zoho.com`)
  - Los refs del iframe tienen prefijo diferente (ej. `f8e54` vs `e54`)
  - Playwright captura el contenido del iframe automáticamente en `browser_snapshot`
- El **workflowbuilder** carga directamente (sin iframe)
- El editor Deluge es `zohoedit` (editor propio de Zoho, basado en Monaco/CodeMirror)
  - Es pesado — necesita ~15-20s para cargar completamente
  - Si hay red lenta, puede fallar con "Load timeout for modules: zohoedit"

## Tipos de Workflow (pestañas en /workflow/edit)
1. Flujos de trabajo de formulario
2. Programas (scheduled)
3. Aprobaciones
4. Pagos
5. Planos (Blueprints)
6. Flujos de trabajo por lotes
7. Flujos de trabajo de informe
8. **Funciones** ← aquí están las funciones Deluge invocables via REST

## Módulos de la app human-resource-management
RRHH | PRL | Formaciones | Gestión de Flota | Portal del Empleado | Ayuda y uso del sistema

## Patrones de hash en el iframe del Constructor
- Report: `#Report:{report_link_name}`
- Page:   `#Page:{page_link_name}`
- Form:   `#Form:{form_link_name}`

## Workflow de "Nuevo Empleado" confirmado
- Nombre: "Run Scripts - While Adding a Record"
- Link name: `Run_Scripts_While_Adding_40`
- Evento: Creado → Reglas de campos
- Estado: Habilitado
- Edit URL: `.../workflowbuilder/Run_Scripts_While_Adding_40/edit`

## Tips Playwright para este IDE

1. **Navegar directamente por URL** — nunca hacer clicks para llegar a un form/workflow
2. **Esperar ~10s** después de `browser_navigate` para que cargue el iframe/editor
3. **`browser_snapshot` antes que screenshot** — captura el accessibility tree del iframe automáticamente
4. **Para leer código Deluge**: usar `browser_evaluate` con la API del editor una vez cargado:
   ```js
   // Leer código del editor Monaco/zohoedit:
   () => window.editor?.getValue() || document.querySelector('.view-lines')?.innerText
   ```
5. **Para editar código Deluge**: Ctrl+A + type para reemplazar todo el contenido
6. **Buscar workflows de un form**: ir a `/workflow/edit`, sidebar izquierda tiene lista de todos los formularios con/sin workflows
7. **Página Configuración** (`/settings/edit`): navegar directo da blank. Cargar siempre desde el constructor (`/edit`) y hacer click en el tab Configuración. Una vez cargada la primera vez, la URL `/settings/edit#applicationide` funciona directamente.
8. **Panel derecho del formbuilder NO tiene overlay** → usar `browser_click` directo. El canvas central SÍ tiene overlay → usar `browser_evaluate` + `.click()`.
9. **Diagnosticar overlays**: si `browser_click` falla con "subtree intercepts pointer events" → cambiar a `browser_evaluate` + `.click()`. Si el elemento tampoco responde al `.click()` programático → probar `browser_click` directo (puede que no haya overlay, solo un listener nativo).

## Form Builder — URLs y navegación

- **URL del editor de vista previa** (solo lectura): `/form/{form_link_name}/edit`
- **URL del form builder real** (edición): `/formbuilder/{form_link_name}/edit`
- Para abrir el builder desde el editor de vista previa: clic en "Abrir Creador de formularios":
  ```js
  // browser_evaluate con ref del enlace (ref=f12e155 aprox.)
  (el) => el.click()
  // Playwright lo traduce como: page.locator('#designPreviewFrame').contentFrame().getByText('Abrir Creador de formularios').evaluate(...)
  ```
  → La URL cambia automáticamente a `/formbuilder/...`

## Form Builder — Interacción con campos

- El **canvas central** tiene overlay que bloquea pointer-events → usar `browser_evaluate` + `.click()`
- El **panel lateral derecho** (Propiedades) NO tiene overlay → usar `browser_click` directo
- El **#fieldsList** (lista de campos en la barra lateral) → usar `browser_evaluate` + `.click()` sobre el `generic` con el nombre del campo para seleccionarlo en el canvas:
  ```js
  // Clic en el nombre del campo dentro de #fieldsList para seleccionarlo:
  (el) => { el.click(); }
  // El campo queda seleccionado (azul) y el panel derecho se actualiza
  ```

## Form Builder — Añadir campos vía Playwright

- El form builder tiene un overlay que bloquea pointer-events; usar `browser_evaluate` + `.click()` en JS
- Para abrir el builder desde la lista de formularios:
  ```js
  const link = doc.querySelector('a[isthirdpartyform]');
  link.click();
  ```
- Para añadir un campo al canvas — doble click en el item de la lista de campo:
  ```js
  const items = document.querySelectorAll('li.ui-draggable.ui-draggable-handle');
  const target = [...items].find(el => el.textContent.trim() === 'Número');
  target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
  ```
- **Link names auto-codificados**: Zoho encoda caracteres con tilde (é→_f, í→_f, etc.)
  - "Caducidad específica" → `Caducidad_espec_fica`
  - Corregir manualmente via JS value + events:
    ```js
    const inp = document.querySelector('#labelName');
    inp.value = 'Nombre_Correcto';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    ```
- Guardar campo: click en "Listo" (NO usar Ctrl+S — causa blank snapshot)

## Form Builder — Ver referencias de campo (workflows que usan un campo)

Permite ver todos los workflows y funciones que referencian un campo específico.

### Pasos
1. Navegar al form builder: `https://creator.zoho.com/appbuilder/formacion11/{app}/formbuilder/{form_link_name}/edit`
2. Esperar ~8s a que cargue el editor
3. Seleccionar el campo en `#fieldsList` (sidebar izquierda con nombre del campo visible):
   ```js
   // browser_evaluate con ref del generic que contiene el nombre del campo
   (el) => { el.click(); }
   // El campo se selecciona en el canvas (azul) y el panel derecho muestra sus propiedades
   ```
4. En el panel derecho, hacer clic en "Ver referencias de campo" con `browser_click` directo:
   ```
   browser_click(ref=eXXX, element="Ver referencias de campo")
   // NO usar browser_evaluate aquí — el panel derecho no tiene overlay
   ```
5. Se abre un modal "Referencias de campo" con:
   - Lista de workflows/funciones que referencian el campo
   - Por cada referencia: nombre, Event, Formulario, Aplicación, estado (Habilitado/Deshabilitado)
   - Link "Ver" con URL directa al editor del workflow

### Datos del modal
```
Flujos de trabajo y funciones (N)
  - {nombre_workflow}
      Event     : {tipo_evento}
      Formulario: {nombre_form}
      Aplicación: {nombre_app}
      [{estado}]
      [Ver] -> /workflowbuilder/{wf_link_name}/edit
```

### Notas técnicas
- El div "Ver referencias de campo" tiene clase `formActFieldCont scriptSettings choicesCont`
- `browser_evaluate` + `.click()` / `.dispatchEvent()` NO funciona en este elemento
- `browser_click` directo SI funciona porque el panel derecho no tiene overlay
- Cerrar el modal: `browser_click` en el botón "OK"

---

## Field Rules (Reglas de Campos) — Workflow

- Tipo: `Creado o editado` → `Reglas de campos`
- **Patrón recomendado**: 2 acciones para toggle show/hide:
  1. `Ejecutar sin condición` → **Hide** [campo1, campo2]  ← reset/default
  2. `Ejecutar solo si condición` → **Show** [campo1, campo2]
  - Zoho evalúa las acciones en orden; la incondicional garantiza estado inicial correcto
- Selector de campos usa **Select2 multi-select** (`#s2id_showHideField`):
  - Los chips aparecen en `.select2-choices` cuando se seleccionan
  - Buscar campo: escribir en `input.select2-input` vía `browser_evaluate` + keyup event
  - Luego click en la opción del dropdown (ref de `[role="option"]`)
- Condición "contains SI": seleccionar campo → operador `contains` → valor `SI`
- **Guardar acción**: click "Guardar" → acción aparece en la lista de la izquierda
- **Finalizar workflow**: click "Listo" → navega a `/workflow/edit` con el workflow visible

## Link Names de workflows (auto-generados con truncado)
- "Mostrar Caducidad Específica" → `Mostrar_Caducidad_Espec_f`
- Los link names se truncan a ~25 chars y codifican acentos
- Para editar un workflow conocido, buscar su link name en la tabla del `/workflow/edit`

## App IDE (Configuración → Herramientas del desarrollador → IDE de la aplicación)

### URL directa
```
https://creator.zoho.com/appbuilder/formacion11/{app}/settings/edit#applicationide
```
- Cargar desde `settings/edit` → click en "IDE de la aplicación" → esperar ~12s
- Una vez cargado, la URL directa `#applicationide` funciona directamente

### Estructura del IDE
- **Editor**: CodeMirror (no Monaco) — leer con `.querySelector('.CodeMirror').CodeMirror.getValue()`
- **Botones**: "Abrir creador", "Guardar", "Exportar" (descarga el .ds), "Papelera"
- El editor muestra el código del **ítem seleccionado** (no todo el .ds a la vez)

### Árbol lateral (virtual scrolling)
El árbol tiene 4 secciones colapsables:

1. **Formatos** — forms con sus reportes y workflows como hijos
   - Ítem form: texto = "Nombre del Form" (sin sufijo)
   - Ítem reporte: texto = "NombreLista" / "NombreReporte" / "NombreCalendario"
   - Ítem workflow: texto = "Nombre del WorkflowFlujo de trabajo"
2. **Páginas** — páginas ZML
3. **Programas** — workflows programados (scheduled)
4. **Funciones personalizadas** — namespaces Deluge con sus funciones
   - Ítem namespace: texto = "NombreNamespace" (ej: `NuevoRequisitoDoc`)
   - Ítem función: texto = "Deluge" + NombreFunción (ej: `DelugeCalcularCaducidadTolerancia`)

### Navegar el árbol con Playwright (virtual list)
```js
// El contenedor scrollable de la sidebar es ZCScrollable[8]
const sidebar = document.querySelectorAll('.ZCScrollable')[8];
// scrollHeight total: ~29330px para esta app
// Todos los items son <a class="zc-dem-box-sizing">

// Patrón: scroll + wait + query
async () => {
  const sidebar = document.querySelectorAll('.ZCScrollable')[8];
  sidebar.scrollTop = 26350; // ajustar según posición
  await new Promise(r => setTimeout(r, 800));
  const links = [...document.querySelectorAll('a.zc-dem-box-sizing')];
  const target = links.find(a => a.textContent.trim().startsWith('DelugeCalcularCaducidad'));
  if (target) target.click();
}
```

### Posiciones de scroll aproximadas (esta app)
| Sección                  | scrollTop aprox |
|--------------------------|----------------|
| Formatos (inicio)        | 0              |
| NuevoEmpleado            | ~25550         |
| NuevoRequisitoDoc (forms)| ~26800 (en Formatos) |
| NuevoRequisitoDoc (func) | ~26350 (en Funciones personalizadas) |
| Funciones personalizadas | ~27000+        |
| Programas / Páginas      | ~28000+        |

### Leer código con CodeMirror
```js
document.querySelector('.CodeMirror').CodeMirror.getValue()
// Devuelve el código limpio del ítem seleccionado (sin números de línea)
```

---

## Exportar código fuente de la app (Deluge Script)

### URL directa de exportación
```
https://creator.zoho.com/appbuilder/formacion11/{app}/exportScript
```
- Requiere sesión autenticada en el browser (cookies de Zoho)
- Devuelve un archivo `.ds` (Deluge Script) con **todo el código fuente** de la app
- Content-Type: `text/Deluge-script;charset=UTF-8`
- Content-Disposition: `attachment;filename="Gestión_de_Recursos_Humanos.ds"`
- Tamaño: ~2.2 MB para human-resource-management

### Ruta en la UI
`Configuración` (pestaña superior) → `Herramientas del desarrollador` → `IDE de la aplicación` → botón `Exportar`

### Cómo descargarlo con Playwright (método recomendado)
```js
// Desde el contexto autenticado del browser:
const resp = await fetch('/appbuilder/formacion11/human-resource-management/exportScript', {
  credentials: 'include'
});
const source = await resp.text();
// source contiene todo el código Deluge de la app (~2.2MB)
```
- Playwright guarda el `.ds` automáticamente en `.playwright-mcp/` al hacer la petición
- El archivo descargado tiene toda la info: formularios, campos, reports, workflows, funciones

### Estructura del archivo .ds
```
application "Gestión de Recursos Humanos"
{
  date format = "dd-MM-yyyy"
  time zone = "Europe/Madrid"
  forms {
    form Add_Announcement { ... }
    form Nuevo_Requisitos_Doc { ... }
    ...
  }
  functions { ... }
}
```

### Estructura del archivo .ds (71304 líneas, ~2.2MB)
| Sección                          | Líneas aprox | Contenido |
|----------------------------------|-------------|-----------|
| `forms {}`                       | 12–14834    | Definición de campos de cada form (sin código Deluge) |
| `reports {}`                     | 14835–24894 | Configuración de columnas/filtros de reportes |
| `pages {}`                       | 24895–25132 | Contenido ZML/HTML de páginas |
| `functions { Deluge {} }`        | 25135–41015 | **Todo el código Deluge**: funciones puras + workflows de form |
| `functions {}` (custom actions)  | 41016–49160 | Triggers de custom actions (type = functions, form = X) |
| `web {}`                         | 49161+      | Configuración de layout web (label placement, etc.) |
| `reports configuration`          | ~71298+     | Configuración de reportes adicional |

### Código Deluge en el .ds: cómo encontrarlo
- **Función pura**: `void NombreNS.NombreFuncion(params) { ... }`
- **Workflow de form**: entrada con nombre + metadata + código:
  ```
  Run_Scripts_While_Adding_40 as "Run Scripts - While Adding a Record"
  {
    type = form
    form = Add_Announcement
    record event = on add
    field rules { actions { hide Campo; } }
  }
  ```
- **Buscar por form**: `grep "form = NombreForm"` en el .ds
- **Workflow de formulario** guardado con link_name auto-generado (ej: `N_Orden_Autoincrementado6`)

### Cuándo usarlo
- Para leer código fuente de funciones Deluge antes de modificarlas
- Para auditar la estructura completa de la app sin navegar por el IDE
- Para búsquedas de texto en todo el código (grep en el .ds)
- Para conocer todos los link names de formularios, reports y workflows
- **Más rápido que el App IDE** para búsquedas masivas (grep local vs. virtual list)

### ⚠️ exportScript NO contiene ZML de páginas en formato XML
- El .ds sí tiene una sección `pages {}` (líneas ~24895-25132) con el ZML, pero en formato Deluge script, no XML
- Buscar `"Portal del Empleado"` funciona pero `"<page"` no — el ZML en el .ds está en sintaxis diferente
- **Para leer/editar ZML de una página**: usar el App IDE (`settings/edit#applicationide`) → click en la página del árbol → CodeMirror muestra el XML del ZML directamente

---

---

## Páginas (ZML) — Edición de script de página

### El App IDE solo muestra ZML para páginas
- Al seleccionar una página en el árbol del App IDE → CodeMirror muestra **solo el ZML**
- El bloque `script {}` de la página NO es accesible desde el App IDE
- Para editar el script de página: usar el **Page Builder**

### Page Builder — Acceso al script de página
```
URL:  /appbuilder/formacion11/{app}/pagebuilder/{page_link_name}/edit
Ej:   /appbuilder/formacion11/human-resource-management/pagebuilder/Inicio/edit
```

#### Flujo de edición de script en Page Builder
1. Navegar a la URL del page builder → esperar ~10s
2. Click en el icono `.zc-pb-script-variables` (icono de variables/script en la toolbar derecha):
   ```js
   document.querySelector('.zc-pb-script-variables').click();
   ```
3. Se abre un panel lateral derecho con dos pestañas:
   - **"Variables"** (`generic "Variables de página"`) — lista de variables de página (tabla con Nombre / Tipo)
   - **"Secuencia de comandos"** (`generic "Page Functions"` + `generic "Secuencia de comandos"`) — editor Deluge
4. Click en la pestaña "Secuencia de comandos":
   ```js
   document.querySelector('...').click()  // o: page.getByText('Secuencia de comandos').evaluate(el => el.click())
   ```
5. Esperar ~8s a que cargue CodeMirror
6. Leer/escribir con `.querySelector('.CodeMirror').CodeMirror.getValue()` / `.setValue(newCode)`
7. Click "Listo" en el panel de script → guarda el script
8. Click "Listo" en la **toolbar principal** (link en la parte superior) → guarda TODA la página (ZML + script) y navega a `/page/{name}/edit`

#### Notas importantes
- El "Listo" del panel script ≠ el "Listo" de la toolbar. Hay que hacer AMBOS clicks para guardar todo.
- Para encontrar el botón "Listo" correcto al final:
  ```js
  const btns = [...document.querySelectorAll('button')];
  btns.find(b => b.textContent.trim() === 'Listo').click();  // script panel Listo
  // Luego:
  page.getByRole('link', { name: 'Listo' }).evaluate(el => el.click());  // toolbar Listo
  ```
- Después de "Listo" en toolbar, la URL cambia de `/pagebuilder/` a `/page/` — confirma guardado exitoso

#### Variables de página vs script
- Las variables de página (parámetros de la función `page`) se gestionan en la pestaña "Variables"
- El script (bloque `script {}`) se gestionan en la pestaña "Secuencia de comandos"
- Las variables declaradas pero nunca asignadas en el script son "dead variables" — inofensivas pero desperdician recursos si hay queries DB

### App IDE — Guardar ZML (botón correcto)
- El botón para **guardar** el ZML editado en el App IDE es **"Guardar"** (`a.zc-dem-savescript`) ← CORRECTO
- ⚠️ "Apply" (`INPUT zc-dem-btn zc-dem-primarybtn`) es para el popup de configuración del ícono — NO guarda el ZML
- ⚠️ "Listo" (`a.zc-dem-done`) navega fuera del editor — NO guarda
- Después de Guardar aparece un toast "Guardado" — verificarlo con:
  ```js
  document.querySelector('[class*="zc-dem-notification"]')?.textContent  // → "Guardado"
  ```
- Verificar persistencia: navegar fuera → volver al App IDE → click "Tablero Inicio" → comprobar CodeMirror
```js
// Guardar ZML en App IDE (botón correcto):
const saveBtn = document.querySelector('a.zc-dem-savescript');
saveBtn.click();
```

### Page Builder — Gestión de variables de página

#### Abrir el panel de variables
```js
document.querySelector('.zc-pb-script-variables').click();
// Abre panel lateral con 2 pestañas: "Variables" y "Secuencia de comandos"
```

#### Añadir variable nueva ("Agregar nuevo")
**IMPORTANTE**: Los botones Cancelar son `<input type="button" name="cancel">`, **no** `<button>` — usar así:
```js
// Cerrar todos los diálogos de variable acumulados:
document.querySelectorAll('input[name="cancel"]').forEach(b => b.click());
```

**Flujo completo para añadir variable tipo Text:**
1. Click "Agregar nuevo" (es un `<button>`)
2. `browser_type` en `textbox "Enter variable name"` con el nombre
3. Abrir Select2 (tipo de dato):
   ```js
   document.querySelector('.select2-choice').dispatchEvent(new MouseEvent('mousedown', {bubbles:true, cancelable:true}));
   ```
4. Esperar a que aparezca `combobox [expanded]` con `option "Text"` en el snapshot
5. `browser_click` en `option "Text"` por su ref
6. `browser_click` en `button "Agregar"` por su ref
7. Confirma con toast "Variable guardada correctamente"

**Problema: diálogos acumulados**
Si se hace click en "Agregar nuevo" varias veces, los diálogos se apilan. La causa es que `button.click()` vía JS abre el diálogo pero puede llamarse más de una vez accidentalmente. Solución: cerrar todos con `input[name="cancel"]` antes de empezar.

#### Opciones del Select2 de tipo de dato
`Text | Number | Decimal | Boolean | Collection`

### Verificar guardado de ZML en App IDE
Después de guardar desde page builder, verificar en App IDE:
```js
const val = document.querySelector('.CodeMirror').CodeMirror.getValue();
// Comprobar que el ZML tiene los cambios esperados
```
El App IDE muestra el ZML guardado — si el ZML fue editado previamente en App IDE y luego se guardó desde page builder, ambos cambios se preservan (el page builder carga el ZML guardado del servidor).

---

## Formulario `Nuevo_Requisitos_Doc` — Estado actual (2026-03-07)
- Campos nuevos añadidos: `Caducidad_Especifica`, `Tipo_Caducidad_Especifica`, `Tolerancia_Especifica`
- Workflow de Field Rule: `Mostrar_Caducidad_Espec_f` (2 acciones, habilitado)
- Campos de `Tipo_Caducidad_Especifica`: No Caduca, Puntual, Mensual, Trimestral, Semestral, Anual, Bianual, Trianual, Quinquenal
