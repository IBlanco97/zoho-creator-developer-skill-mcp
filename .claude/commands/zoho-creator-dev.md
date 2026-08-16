---
name: zoho-creator-dev
description: >
  Desarrollo en Zoho Creator: leer y editar workflows Deluge, explorar formularios,
  gestionar registros y navegar el IDE. También genera el Manual de Usuario de la
  aplicación (módulo a módulo, por perfil de usuario). Usar cuando el usuario pida
  modificar un formulario, editar código Deluge, crear workflows, leer datos de la app,
  generar documentación de usuario, o cualquier tarea sobre la aplicación Zoho Creator.
metadata:
  author: sicma21
  version: "2.0"
---

# Zoho Creator Dev Skill

Asistente de desarrollo para la aplicación Zoho Creator `human-resource-management`
(propietario: `formacion11`). Combina el **MCP REST** (datos) con **Playwright**
(IDE — formularios, workflows Deluge, páginas) para cubrir todo el ciclo de
desarrollo sin salir de Claude Code.

**Esta skill está dividida en módulos.** Lee los archivos complementarios según la tarea:

| Archivo | Contenido | Cuándo leerlo |
|---------|-----------|---------------|
| `~/.claude/commands/zoho-ide-flows.md` | Flujos A-I: navegar IDE, leer/editar Deluge, editar ZML, HTML Snippets | Cualquier tarea en el IDE de Zoho Creator |
| `~/.claude/commands/zoho-api-patterns.md` | Flujos J-Q: KPIs, embeds ZML, permisos portal, .ds export, menú builder, rename, conditional formatting | Tareas de ZML, permisos, menú, reportes |
| `~/.claude/commands/zoho-errors-ref.md` | Tabla de errores comunes + limitaciones + referencia app | Debugging, errores conocidos |
| `~/.claude/commands/zoho-manual-gen.md` | Generación del Manual de Usuario por módulo y perfil | Generar documentación de usuario |

**INSTRUCCIÓN**: Antes de ejecutar cualquier tarea, lee el archivo complementario relevante
usando la herramienta Read. Si la tarea involucra múltiples áreas, lee todos los relevantes.

---

## Herramientas disponibles

### MCP REST (zoho-creator)
| Tool | Cuándo usarlo |
|------|--------------|
| `list_forms` | Descubrir formularios y sus link names |
| `get_form_fields` | Ver campos y tipos de un formulario |
| `get_records` | Leer registros con filtros |
| `get_record` | Leer un registro por ID |
| `create_record` | Crear un registro de prueba |
| `update_record` | Actualizar campos de un registro |
| `delete_record` | Eliminar un registro |
| `invoke_function` | Invocar una función Deluge REST endpoint |

### Playwright MCP (IDE)
| Tool | Cuándo usarlo |
|------|--------------|
| `browser_navigate` | Ir directamente a un form/workflow por URL |
| `browser_snapshot` | Capturar el accessibility tree (más útil que screenshot) |
| `browser_take_screenshot` | Verificación visual |
| `browser_wait_for` | Esperar carga del IDE (usar `time:`, no `text:`) |
| `browser_evaluate` | Leer/escribir código en el editor Deluge |
| `browser_click` | Clic en botones del IDE (guardar, etc.) |
| `browser_press_key` | Shortcuts de teclado (Ctrl+S, Ctrl+A) |
| `browser_type` | Escribir código en el editor |

---

## Reglas críticas

### Regla 1: Navegación siempre por URL directa

**NUNCA** hacer clicks para navegar al formulario o workflow objetivo.
Ir directamente con `browser_navigate`:

```
# Formulario
https://creator.zoho.com/appbuilder/formacion11/human-resource-management/form/{form_link_name}/edit

# Reporte
https://creator.zoho.com/appbuilder/formacion11/human-resource-management/report/{report_link_name}/edit

# Lista de workflows (todos los formularios)
https://creator.zoho.com/appbuilder/formacion11/human-resource-management/workflow/edit

# Editor de un workflow específico
https://creator.zoho.com/appbuilder/formacion11/human-resource-management/workflowbuilder/{workflow_link_name}/edit

# Funciones Deluge (pestaña Funciones del workflow)
https://creator.zoho.com/appbuilder/formacion11/human-resource-management/workflow/edit#Functions
```

### Regla 2: Esperar siempre después de navegar

⚠️ `time:` está en **segundos**, no milisegundos. `time: 3000` = 50 minutos — puede corromper la sesión.

| Destino | Espera mínima |
|---------|--------------|
| Constructor (formulario/reporte) | 10s |
| Workflow list | 8s |
| Workflowbuilder (editor Deluge) | 15s |

### Regla 3: Usar `browser_snapshot` antes que screenshot

`browser_snapshot` captura el accessibility tree completo, incluyendo el iframe del Constructor.
Usar `browser_take_screenshot` solo para confirmación visual.

### Regla 4: Obtener link names antes de navegar

Usar `list_forms` (MCP REST) para obtener el `link_name` exacto antes de construir la URL.
Los link names codifican caracteres especiales (ej. `Formaci_n` para "Formación").

### Regla 5: Guardar — botón correcto según contexto

| Contexto | Botón correcto | Notas |
|----------|---------------|-------|
| **Workflow editor (Deluge)** | `Control+s` via `browser_press_key` | Ctrl+S funciona aquí |
| **Custom Function editor** (`/customFunction/{ns}.{name}/edit`) | `document.querySelector('#saveFuncBtn').click()` | El botón es `input[type="button"]` (no `<button>`), por eso `querySelectorAll('button')` devuelve 0. Ctrl+S NO dispara save. Verificar por POST `populateCustomFunction` → 200. |
| **Form builder — dialog campo** | `document.querySelector('a.mdmButton.dGray').click()` | Cierra config de campo (autonumber, etc.) — texto "Listo" |
| **Form builder — guardar form** | `page.mouse.click(1489, 24)` via `browser_run_code_unsafe` | ⚠️ `a.zc-common-done` NO es visible → timeout. Usar coordenada. Confirmado: URL cambia de `/formbuilder/` a `/form/` |
| **Workflow builder (acción inline Deluge)** | `document.querySelector('input.wb-save-button').click()` | ⚠️ El botón se llama **"Actualizar"** (no "Guardar"). Verificar por POST `updateAction` → 200. NO necesita "Listo" toolbar después — wb-save-button persiste por sí solo. |
| **Workflow on_validate ("Validaciones al enviar formularios")** | `Array.from(document.querySelectorAll('input[type=button]')).find(b=>b.value==='Guardar').click()` → luego `.find(b=>b.value==='Actualizar').click()` | ⚠️ Este editor abre **directamente** a un CM completo (sin selector de tipo de acción). Botón dice "Guardar" en primer save → cambia a "Actualizar". Verificar por POST `saveAction → 200` + `updateAction → 200`. NO es `wb-save-button`. |
| **App IDE (ZML de página)** | `document.querySelector('a.zc-dem-savescript').click()` | ⚠️ "Apply" es del popup del ícono, NO guarda ZML. "Listo" navega sin guardar. |
| **Page Builder (script Deluge de página)** | Click "Guardar" (botón en el panel, NO "Listo") | Verificar por respuesta XHR, no `cm.isClean()` |

**Truco template literal para `cm.setValue` con código Deluge complejo**: usar template literal (`` ` ``) dentro del `function` de `browser_evaluate` evita el doble-escaping de `"` y `'`. Las comillas simples dentro del Deluge son literales en el template, las dobles sólo requieren `\"` en JSON. `\t`/`\n` se escriben como `\\t`/`\\n` en JSON → se pasan como escape sequences al JS → el template literal los interpreta como tab/newline. No usar si el Deluge contiene backticks (raro). Ejemplo: `` `\tif(cond)\n\t{\n\t\thtml = html + "<div class='x'>y</div>";\n\t}\n` ``

⚠️ **`cm.isClean()` no es señal fiable de save** en NINGÚN editor de Zoho — la plataforma jamás llama `cm.markClean()`, así que tras un save exitoso `isClean()` sigue devolviendo `false`. Verifica SIEMPRE por la respuesta del POST (`populateCustomFunction`/`updateAction`/`updateTemplateContent` → 200) o reload + re-leer el código.

### Regla 6: Pointer-intercept en form builder — JS vs. browser_click

El form builder tiene overlays que bloquean pointer-events de Playwright en muchos elementos. Reglas:
- **Elementos normales** (botones, labels): `browser_evaluate` con `.click()` en JS.
- **Select2 dropdowns** (opciones de campo/operador): NO funcionan con JS — usar `browser_click ref=eNNNN` con ref del accessibility tree.
- **`select2-drop-mask`**: Antes de cualquier click en un selector Select2, siempre limpiar: `document.getElementById('select2-drop-mask')?.click()`.
- **Autocomplete** (`ui-menu-item-wrapper`): Si el click con ref da timeout por overlay, usar `document.getElementById('ui-id-N').click()` directamente.

### Regla 7: Configurar "Establecer filtro" en campos Lookup (cascading dropdowns)

Flujo para configurar filtros en un campo Lookup del form builder:

```
1. Activar filtro via JS: document.getElementById('setFilter').click()
2. Tomar snapshot depth:7 → localizar ref del field selector de Row 1
3. Limpiar mask: document.getElementById('select2-drop-mask')?.click()
4. browser_click ref=<field-selector> → dropdown abre con opciones
5. browser_click ref=<opcion-campo> (e.g. "Area")
   → El dropdown de operador abre automáticamente tras seleccionar campo
6. browser_click ref=<opcion-operador> (e.g. "equals")
7. Rellenar valor:
   - Si el campo es TEXT: JS native setter en el input visible
     inputs = document.querySelectorAll('input[placeholder="Enter Value "]')
     target = el que tenga offsetParent (visible)
     setter.call(target, 'input.Area_Profesional')
     target.dispatchEvent(new Event('input', {bubbles:true}))
   - Si el campo es PICKLIST: aparece Select2 en vez de textbox
     → limpiar mask, browser_click ref=<value-selector>, browser_click ref=<opcion>
8. browser_click ref=<Add New> para añadir Row 2
9. Repetir pasos 3-7 para Row 2
10. browser_click ref=<Listo del dialog>  ← cierra el dialog de filtro
11. browser_click ref=e31  ← "Listo" del TOOLBAR → guarda el form en el servidor
```

⚠️ "Listo" del dialog solo aplica el filtro en memoria. Sin el "Listo" del toolbar, se pierde al cerrar.
⚠️ Si el input de valor tiene autocomplete activo, cerrar con `document.getElementById('ui-id-N').click()`.

---

## Referencia rápida de la app

**App**: `human-resource-management` | **Owner**: `formacion11`

### Módulos
`RRHH` | `PRL` | `Formaciones` | `Gestión de Flota` | `Portal del Empleado` | `Ayuda y uso del sistema`

### Eventos de formulario
`Creado` → Reglas de campos | Al enviar | Después del envío
`Editado` → Reglas de campos | Al actualizar | Después de actualizar
`Eliminado`

### Reports clave (Nuevo_Empleado)
| Form | Report link name para REST API |
|------|-------------------------------|
| `Nuevo_Empleado` | `Listado_Empleados_Salario` (no `Nuevo_Empleado_Report`) |
| `Catalogo_Profesional` | `Catalogo_Profesional_Report` |

### Hash navigation en el Constructor
```
Report: #Report:{report_link_name}
Page:   #Page:{page_link_name}
Form:   #Form:{form_link_name}
Form (edit): #Form:{form_link_name}?recLinkID={record_id}&viewLinkName={report_link_name}
```
