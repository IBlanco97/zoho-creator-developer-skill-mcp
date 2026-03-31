---
name: menu-builder
description: Zoho Creator App Menu Builder — API, DOM structure, programmatic move/reorder, save mechanism (fully explored & verified)
type: reference
---

# Zoho Creator — Menu Builder (Generador de Menús de Aplicaciones)

## How to Open

1. Navigate to `https://creator.zoho.com/appbuilder/formacion11/human-resource-management/edit`
2. Wait ~8s for builder to load
3. Click: `document.querySelector('[title*="Generador de menús"]')?.click()`
4. Panel slides in from the right (`#zc-app-prop-pane` with class `active`)

## DOM Structure

```
#zc-app-prop-pane (slider panel, class: zc-dem-amb-main-cont)
├── Close button: a.zc-dem-right-close (x:1484, y:8)
├── #menu-builder-area (class: zc-dem-amb-area)
│   ├── #menu-builder-section-area-lazy-loader (left panel loader)
│   ├── #menu-builder-section-area (left panel — ~259 unassigned skeleton items, class: hide initially)
│   └── #menu-builder-workarea-cont (right panel — the actual menu)
│       ├── .zc-dem-amb-space-prop-cont (space properties header)
│       ├── #menu-builder-artboard (class: zc-dem-amb-space-container ui-sortable)
│       │   ├── DIV (hidden placeholder, index 0)
│       │   ├── DIV[eltype="space"][data-id="..."] × 6 (actual spaces)
│       │   │   └── .zc-dem-amb-space-wrapper.ui-sortable-handle
│       │   │       ├── .zc-dem-space-inner-wrap
│       │   │       │   ├── input.zc-dem-amb-disp-name (disabled, space name)
│       │   │       │   └── i[elname="spaceIcon"] (icon class)
│       │   │       └── [artboard-space-workarea] (ui-sortable, contains sections + components)
│       │   │           ├── [eltype="section"][data-id="..."] (sub-sections)
│       │   │           │   ├── input.zc-dem-amb-disp-name (section name)
│       │   │           │   └── [artboard-section-workarea] (ui-sortable)
│       │   │           │       └── [eltype="component"][data-id="..."] items
│       │   │           └── [eltype="component"][data-id="..."] (top-level items)
│       │   └── DIV.zc-dem-create-new-space.hide (add space placeholder)
│       └── #navigator-placeholders
```

## Current Spaces (6)

| # | ID | Name | Icon | Sections | Top-Level |
|---|-----|------|------|----------|-----------|
| 1 | 4790826000000022779 | RRHH | users-2-b-check | 5 | 15 |
| 2 | 4790826000000069001 | PRL | files-archive-paper-check | 3 | 7 |
| 3 | 4790826000000753994 | Formaciones | education-paper-diploma | 1 | 3 |
| 4 | 4790826000000177506 | Gestión de Flota | envir-car | 1 | 3 |
| 5 | 4790826000000112063 | Portal del Empleado | design-2-microsoft | 2 | 7 |
| 6 | 4790826000000826717 | Ayuda y uso del sistema | objects-spaceship | 0 | 4 |

## JavaScript Global Objects

- `AppNavigator` — Main controller (save, config, generate structure)
- `AppNavigatorSortable` — Drag & drop sortable management
- `AppNavigatorInteraction` — UI interactions (rename, delete, add, highlight)
- `AppNavigatorUrls` — API endpoint generators
- `AppNavigatorDomSelectors` — DOM query helpers
- `AppNavigatorToolbar` — Toolbar interactions
- `AppNavigatorKeyMap` — Keyboard shortcuts
- `AppNavigatorIcon` — Icon management

### Key Properties
- `AppNavigator.component.deviceType` = `1` (web)
- `AppNavigator.component.csrfParam` = `"zccpn"`
- `AppNavigator.component.csrfToken` = session-specific CSRF token
- `AppNavigator.isBuilderChanged` — dirty flag
- `AppNavigator.appNavigatorSpaces` — `[{id, displayName}, ...]`

### Constants
```
navigatorConstants (data-type values):
  SPACE:"1", SECTION:"2", CUSTOM_SECTION:"3",
  FORM:"11", VIEW/REPORT:"12", PAGE:"13",
  LANGUAGE_SELECTION:"21", CONNECTION:"22",
  BLANK_SEPARATOR:"31", BLANK_SEPARATOR_WITH_TEXT:"32",
  LINE_SEPARATOR:"33", LINE_SEPARATOR_WITH_TEXT:"34"

navigatorElements (eltype attribute values):
  SPACE:"space", SECTION:"section", SYSTEM_SECTION:"systemsection",
  COMPONENT:"component", SYSTEM_COMPONENT:"systemcomponent", SEPARATOR:"separator"

reorderTypeConstants:
  ACROSS_PARENT:1, WITHIN_PARENT:2, INCLUSION:3, EXCLUSION:4
```

## API Endpoints

Base: `https://creator.zoho.com/appbuilder/formacion11/human-resource-management/appmenu/edit/`

All use POST with `zccpn` CSRF + `deviceType=1`.

### Reorder (incremental — auto-triggered on drag)
- **`reorderComponent`** — Move component within/between spaces/sections
  - Params: `componentId`, `componentType` (1=component, 2=systemcomponent, 3=separator), `targetId` (space/section ID), `targetType` (1=space, 2=section), `position` (1-based)
  - Response: `{"status":"success"}`
- **`reorderAppDeviceSpace`** — Reorder spaces in artboard
- **`reorderAppDeviceSection`** — Reorder sections within space

### Full Save
- **`saveAppMenuStructure`** — Saves entire menu atomically
  - Param: `appMenuStructure` = JSON string `{configurations, app_menu_components, components_meta}`
  - Called by `AppNavigator.saveNavigatorConfig()`

### CRUD
- `addNewAppDeviceSpace` — Create space (`appDeviceSpaceName`, `position`)
- `addNewAppDeviceSection` — Create section (`appDeviceSectionName`, `appDeviceSpaceId`, `position`)
- `addNewSeparator` — Add separator
- `deleteAppDeviceSpace` / `deleteAppDeviceSection` — Delete space/section
- `removeComponent` — Remove component (moves to unassigned)
- `renameAppDeviceSpace` / `renameAppDeviceSection` / `renameComponent` / `renameSeparatorText`
- `updateAppDeviceSpaceIcon` / `updateAppDeviceSectionIcon` / `updateAppDeviceComponentIcon`
- `bulkReorder` / `bulkDelete` — Multi-select operations

### Read
- `getAppMenuStructureComponents` — Full menu structure + components
- `getUnusedComponents` — Unassigned components
- `getRecommendedIcons` — Icon suggestions

## Estructura de respuesta (campos reales — verificado 2026-03-26)

```
spaces[i]:    { id, display_name, link_name, icon_name, sections }
sections[j]:  { id, type, components }      // ⚠️ NO hay display_name en sections
components[k]:{ id, link_name, type, display_name, icon_name }

type de section: 1 = grupo colapsable (tiene nombre), 2 = wrapper de ítem suelto
```

## addNewAppDeviceSection (VERIFICADO)

```js
$.ajax({ url: AppNavigatorUrls.getAddNewSectionUrl(), type: 'POST', dataType: 'JSON',
  data: { deviceType: 1, appDeviceSectionName: 'Nombre', appDeviceSpaceId: 'SPACE_ID',
          position: N, zccpn: AppNavigator.component.csrfToken },
  success: r => console.log(r.response.appDeviceSectionId) // ID del nuevo grupo
});
```

## deleteAppDeviceSection — SOLO para type:1

- **type:1** (grupos colapsables creados manualmente): `deleteAppDeviceSection` funciona ✅
- **type:2** (wrappers auto-generados por Zoho): devuelve HTTP 500 ❌
- **Auto-cleanup**: cuando el único componente de un type:2 wrapper se mueve a otro contenedor,
  el wrapper type:2 vacío desaparece automáticamente — no hace falta borrarlo.

## Patrón "agrupar ítems sueltos en un grupo"

```
1. addNewAppDeviceSection → ID_NUEVO
2. reorderComponent × N (targetType:2, targetId:ID_NUEVO, position:1..N)
   → Los wrappers type:2 vacíos se eliminan solos
3. deleteAppDeviceSection solo si quedó algún type:1 vacío
```

## Programmatic Move (TESTED & VERIFIED)

### Move component within same space (DOM + sortable trigger)
```js
const space = document.querySelector('[eltype="space"][data-id="SPACE_ID"]');
const workarea = space.querySelector('[artboard-space-workarea]');
const item = workarea.querySelector('[data-id="COMPONENT_ID"]');
workarea.insertBefore(item, targetSibling); // or workarea.appendChild(item)
$(workarea).sortable('option', 'update').call(workarea, {}, { item: $(item) });
// → fires POST reorderComponent automatically → {"status":"success"}
```

### Direct API call (bypassing DOM)
```js
$.ajax({
  url: AppNavigatorUrls.getReorderComponentUrl(),
  type: 'POST', dataType: 'JSON',
  data: {
    deviceType: 1,
    componentId: 'COMPONENT_ID',
    componentType: 1,  // 1=component, 2=systemcomponent, 3=separator
    targetId: 'TARGET_SPACE_OR_SECTION_ID',
    targetType: 1,     // 1=space, 2=section
    position: 3,       // 1-based
    zccpn: AppNavigator.component.csrfToken
  },
  success: r => console.log(r) // {"status":"success"}
});
```

### Cross-space / cross-section moves
All sortables have `connectWith: ["[artboard-space-workarea]", "[artboard-section-workarea]"]`.
The `componentUpdate` function auto-detects `targetType` from closest `[eltype]` ancestor.
To move cross-space: move DOM node to target `[artboard-space-workarea]` → trigger update on target.

## Save Behavior
- **No explicit save button** — each operation fires its own XHR immediately
- Status indicator: `.zc-save-status` shows "Guardado" after success
- `destroyBuilder()` only resets keyboard context — no auto-save on close
- 22 jQuery UI Sortable instances (1 artboard + spaces + sections)

## Add Space Buttons
- `.zc-dem-add-space-btn` with `i.zc-common-plus` icon between each space column
- Clicking creates a new space via `addNewAppDeviceSpace` endpoint
