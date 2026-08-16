# Zoho Creator — Revisión de Permisos de Portal

Revisa que los permisos de acceso (TAB permissions) de páginas, formularios y reportes del portal de Zoho Creator estén correctamente configurados según la matriz de roles del proyecto.

## Cuándo usar

- Después de crear o modificar páginas, formularios o reportes
- Al final de cada sprint de desarrollo
- Cuando un usuario reporta que no ve una sección que debería ver (o ve algo que no debería)
- Al invocar `/zoho-permisos-check`

## Roles del proyecto y sus IDs

| Rol | ProfileId | Acceso |
|-----|-----------|--------|
| USUARIO TRABAJADOR (Empleado) | `4790826000000171117` | Solo Portal Empleado |
| RESPONSABLE CAE | `4790826000000171968` | Panel RRHH + PRL |
| Gestor RRHH | `4790826000000945001` | Panel RRHH completo |
| SUPER ADMINISTRADOR | `4790826000000945003` | Todo |
| SUPERVISOR | `4790826000001016001` | Panel RRHH |
| OPERARIO CAE | `4790826000001016003` | Panel RRHH limitado |

## Matriz de permisos esperada

### Portal del Empleado (domo21.zohocreatorportal.com)

| Página / Formulario | USUARIO TRAB | RESP CAE | Gestor RRHH | SUPER ADM | SUPERVISOR | OPERARIO CAE |
|---------------------|:---:|:---:|:---:|:---:|:---:|:---:|
| Inicio | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Mis EPIs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Mis Permisos | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Mis Activos | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Mis Mensajes (Chat) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Mis Formaciones | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver Solicitud (Permisos) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver Solicitud EPIs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Datos del Empleado | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Confirmaciones Entrega | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Encuestas | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Panel RRHH (creator.zoho.com / portal)

| Página / Formulario | USUARIO TRAB | RESP CAE | Gestor RRHH | SUPER ADM | SUPERVISOR | OPERARIO CAE |
|---------------------|:---:|:---:|:---:|:---:|:---:|:---:|
| Tablero RRHH | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chat RRHH | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Panel de Asignaciones | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Semáforo Caducidades EPI | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Calendario 52 Semanas | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Timeline Permisos | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Ficha Empleado | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Clientes Doc | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Configuración General | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tablero Formaciones | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |

### Sección PRL / CAE

| Página / Formulario | USUARIO TRAB | RESP CAE | Gestor RRHH | SUPER ADM | SUPERVISOR | OPERARIO CAE |
|---------------------|:---:|:---:|:---:|:---:|:---:|:---:|
| Tablero PRL | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Subir Documento | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Ver Clientes | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Clientes Requisitos | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |

## Procedimiento de revisión

### Paso 1 — Navegar a permisos del portal

```
URL CORRECTA:  https://creator.zoho.com/appbuilder/formacion11/human-resource-management/settings/edit#portal
URL 404:       .../portal/settings/  ❌ no existe esa ruta
```

Click "Permisos" tab dentro de "Portal del cliente".

### Paso 2 — Abrir panel de un rol

Antes de cualquier click: eliminar overlay del menú usuario.

```js
document.querySelector('.zc-dem-menuoverlay')?.remove();
const links = document.querySelectorAll('a.editProfile.zc-edit-permission');
links[N].click();  // 0=USUARIO TRAB, 1=PROJECT MANAGER, 2=SUPERADM, 3=SUPERVISOR, 4=OPERARIO
```

### Paso 3 — Leer permisos

Tabla `Módulo | Acceso | Ver | Editar | Eliminar | Más`:

```js
Array.from(document.querySelectorAll('table tr')).map(row => ({
  name: row.querySelector('td')?.textContent?.trim(),
  acceso: row.querySelector('input[type="checkbox"]')?.checked
})).filter(r => r.name);
```

### Paso 4 — Modificar y guardar

```js
// Toggle: vanilla click PERSISTE en esta UI (no necesita jQuery trigger)
row.querySelector('input[type="checkbox"]').click();
// Guardar: es <input type="button">, NO <button>
document.querySelector('input[value="Actualizar"]').click();
```

⚠️ NO buscar el save button con regex `/aplicar|apply/i` — captura el form "Apply Resignation" y navega al editor. Usar selector exacto `input[value="Actualizar"]`.

### Paso 3 — Verificar en portal

Loguear con usuario de prueba del rol afectado y confirmar visualmente:
- `intiblanco97@gmail.com` / `Zoho.2025` → USUARIO TRABAJADOR en `domo21.zohocreatorportal.com`
- `ecama@sicma21.com` / `Zoho.2025` → Admin en `creator.zoho.com`

### Paso 4 — Documentar resultado

Reportar tabla de hallazgos:
```
| Elemento | Rol | Esperado | Real | Estado |
|----------|-----|----------|------|--------|
| Mis EPIs | USUARIO TRAB | ✅ | ✅ | OK |
| Chat RRHH | USUARIO TRAB | ❌ | ✅ | ⚠️ FIX |
```

## Acceso directo a permisos por rol (API)

```
GET https://creator.zoho.com/api/v2/formacion11/human-resource-management/portal/settings/permissions/{profileId}
```

ProfileIds: ver tabla de roles arriba.

## Notas críticas

- El panel de permisos de un rol se abre haciendo clic en el **nombre del rol en la tabla**, NO via JS (isTrusted:false bloquea el diálogo)
- Los TAB permissions son distintos de los permisos de formulario (CREATE/VIEW/EDIT/DELETE)
- Páginas HTML (Page:*) solo tienen TAB permission — no tienen CRUD
- Formularios tienen: VIEW_SUBMISSIONS, CREATE, EDIT_OWN, DELETE_OWN (granular)
- Reportes tienen: VIEW, VIEW_ALL, EXPORT
