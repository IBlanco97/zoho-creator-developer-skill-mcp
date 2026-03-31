---
name: roles-permisos
description: Roles del portal Zoho Creator, sus profileIds y matriz de permisos según ROLES EXCEL.xlsx
type: project
---

# Roles y Permisos — Portal human-resource-management

Fuente de verdad: `ROLES EXCEL.xlsx` en la raíz del proyecto.

## Roles activos y sus profileIds

| Rol | profileId | Notas |
|-----|-----------|-------|
| USUARIO TRABAJADOR | `4790826000000171117` | Ex "Empleado" |
| RESPONSABLE CAE | `4790826000000171968` | Ex "Gestor PRL" |
| Gestor RRHH | `4790826000000945001` | Rol existente |
| SUPER ADMINISTRADOR | `4790826000000945003` | Rol nuevo |
| SUPERVISOR | `4790826000001016001` | Rol nuevo |
| OPERARIO CAE | `4790826000001016003` | Rol nuevo |

## Matriz de permisos (fuente: Excel)

| Permiso | SUPER ADM | RESP CAE | SUPERVISOR | OPERARIO CAE | USUARIO TRAB |
|---------|:---------:|:--------:|:----------:|:------------:|:------------:|
| CREAR TRABAJADORES | X | X | - | - | - |
| DESACTIVAR TRABAJADORES | X | X | - | - | - |
| ASIGNAR ROLES | X | X | - | - | - |
| VER DOCUMENTACIÓN | X | X | X | X | - |
| SUBIR DOCUMENTOS | X | X | X | - | - |
| ELIMINAR DOCUMENTOS | X | - | - | - | - |
| ASIGNAR TRABAJADORES A CLIENTES | X | X | X | X | - |
| ACEPTAR/DENEGAR PERMISOS | X | X | X | - | - |
| SOLICITAR PERMISO | - | - | - | - | X |
| ASIGNAR/DESASIGNAR HERRAMIENTAS | X | - | X | - | - |
| SOLICITAR HERRAMIENTAS | - | - | - | - | X |
| ASIGNAR/DESASIGNAR ACTIVOS | X | - | X | - | - |
| SOLICITAR ACTIVO | - | - | - | - | X |
| ASIGNAR/DESASIGNAR EPIs | X | X | X | - | - |
| SOLICITAR EPIS | - | - | - | - | X |
| RESPONDER MENSAJES EMPLEADOS | X | X | X | - | - |
| ENVIAR MENSAJES A RRHH | - | - | - | - | X |
| ACCESO A "CAE" (sección PRL/RRHH) | X | X | - | X | - |
| ACCESO A "PORTAL DEL EMPLEADO" | X | - | X | X | - |
| ACCESO A SU DOCUMENTACIÓN | X | - | - | - | X |

## Component IDs clave

### Formularios
| Componente | ID |
|-----------|-----|
| Conversación (Mensajes) | `4790826000000842019` |
| Asignar/Desasignar Trabajadores | `4790826000000856043` |
| Nuevo Empleado | (en SUPER ADM / RESP CAE) |

### Páginas del portal (TAB permission)
| Página | componentId | Roles con acceso |
|--------|-------------|-----------------|
| Tablero Inicio | `4790826000000...` | Todos los que tienen CAE o portal |
| Tablero RRHH | `4790826000000987067` | SUPER ADM, RESP CAE, Gestor RRHH |
| Semáforo Caducidades EPI | `4790826000001006621` | SUPER ADM, RESP CAE, Gestor RRHH |
| 52 Semanas Nuevo | `4790826000000682015` | SUPER ADM, RESP CAE, Gestor RRHH |
| Timeline Permisos | `4790826000001013041` | SUPER ADM, RESP CAE, Gestor RRHH |
| Detalle Semana | `4790826000001006533` | SUPER ADM, RESP CAE, Gestor RRHH |
| Ficha Empleado | `4790826000001013095` | SUPER ADM, RESP CAE, Gestor RRHH |
| Documentación Empleado | `4790826000000518473` | SUPER ADM, USUARIO TRAB |
| Profile Page | `4790826000000015013` | SUPER ADM, USUARIO TRAB |
| Solicitudes de Permisos | `4790826000000300071` | SUPER ADM, USUARIO TRAB |

## Fixes aplicados esta sesión (2026-03-21)

### SUPER ADMINISTRADOR
- ✅ Añadido `add` a Conversación (RESPONDER MENSAJES)
- ✅ Añadido `add` a Asignar/Desasignar Trabajadores
- ✅ TAB activado en 6 páginas nuevas: Tablero RRHH, Semáforo EPI, 52 Semanas, Timeline Permisos, Detalle Semana, Ficha Empleado

### RESPONSABLE CAE
- ✅ Añadido `add` a Conversación
- ✅ Añadido `add` a Asignar/Desasignar Trabajadores
- ✅ TAB activado en 6 páginas nuevas (igual que SUPER ADM)
- ✅ Eliminadas páginas de Portal del Empleado: Documentación Empleado, Profile Page, Solicitudes de Permisos (Excel: ACCESO A PORTAL DEL EMPLEADO = -)

### USUARIO TRABAJADOR
- ✅ Añadidas páginas del portal: Documentación Empleado, Profile Page, Solicitudes de Permisos (TAB)
- ✅ Eliminadas páginas CAE incorrectas: Timeline Permisos, Detalle Semana

## Técnica de modificación programática

Flujo eficiente para cambiar permisos sin hacer click en 1176 checkboxes:
1. Navegar a `settings/edit` → Portal del cliente → tab Permisos → click nombre del rol
2. Instalar interceptor XHR (`window._permReqs = []`, monkey-patch `open`+`send`)
3. Click en "Actualizar" → captura el body completo con CSRF implícito en cookies
4. Parsear body: `new URLSearchParams(body)` → `JSON.parse(params.get('permissionJson'))`
5. Modificar `pj.ProfilePermission` (añadir/eliminar IDs y permisos)
6. `params.set('permissionJson', JSON.stringify(pj))` → `fetch(url, {method:'POST', credentials:'include', body: params.toString()})`
7. Respuesta de éxito: `{"profileName":"...","profileID":"..."}`

**Why:** Evita tener que hacer click en centenares de checkboxes uno a uno, y permite cambios quirúrgicos y verificables programáticamente.
