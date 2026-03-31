# Plan de Mejoras: Dashboard Portal del Empleado

## Estado (2026-03-09)

### Completado ✅
| ID | Feature | Detalle |
|----|---------|---------|
| B1 | Fix AND/OR precedence en Confirmaciones | criteriaString distribuye `&& Estado == "Sin Respuesta"` a cada rama OR. Guardado en App IDE (ZML) |
| B2 | Eliminar código muerto WhatsApp | Eliminadas 5 líneas de script (`numero = Empresa1[...]`, `if(numero != null){ enlace_a_whatsapp = ... }`) |
| M2 | Tarjeta puesto/contrato | 3 vars nuevas (EmpleadoPuesto, EmpleadoContrato, EmpleadoDelegacion Text). Script: `empleado.Puesto_laboral_actual`, `.Tipo_de_Contrato1`, `.Delegacion`. Nueva `<row>` con 3 panels (33%/33%/34%) en ZML. Guardado con `a.zc-dem-savescript`. |
| M3 | KPI cards solicitudes pendientes | 2 panels (50%/50%): Permisos Pendientes (naranja, `Solicitud.ID.count`) + EPIs/Herramientas Pendientes (azul, `Solicitud_de_EPIs_Herramientas.ID.count`). `type='Form Data'` con criteria `Trabajador_Solicitante.Mail_Portal_Empleado == "${LoginEmail}" && Aprobado == "Sin Respuesta"` |
| KPI-FIX | Filtros KPI por empleado logueado | `zoho.loginuserid` NO se evalúa en `criteria=` de text `Form Data`. Fix: (1) variable `LoginEmail` Text en Page Builder, (2) `input.LoginEmail = zoho.loginuserid` al inicio del script, (3) criteria usa `"${LoginEmail}"` (con comillas). También recuperadas asignaciones faltantes M2: EmpleadoPuesto, EmpleadoContrato, EmpleadoDelegacion en script. |

### Pendiente (en orden de ejecución)

| ID | Feature | Descripción |
|----|---------|-------------|
| ~~M2~~ | ~~Tarjeta puesto/contrato~~ | ~~DONE~~ |
| ~~M3~~ | ~~KPI cards solicitudes pendientes~~ | ~~2 tarjetas: count permisos + EPIs pendientes del empleado. Guardado con `a.zc-dem-savescript` en App IDE~~ |
| ~~M4~~ | ~~Botones de acción rápida~~ | ~~DONE — 3 panels con action='OpenForm': naranja Solicitud, azul Solicitud_de_EPIs_Herramientas, gris Mensaje~~ |
| ~~M5~~ | ~~Sección Anuncios~~ | ~~DONE — título panel gris claro + embed `Announcements` (linkname confirmado: `Announcements`). Permisos rol Empleado habilitados manualmente.~~ |
| ~~M6~~ | ~~Próximas ausencias aprobadas~~ | ~~DONE — título panel + embed `Ver_Solicitud` con criteriaString: `Trabajador_Solicitante.Mail_Portal_Empleado == zoho.loginuserid && Aprobado == "Aprobado" && Fecha_de_comienzo >= zoho.currentdate`~~ |
| ~~M7~~ | ~~Mensajes de RRHH con respuesta~~ | ~~DONE — título panel gris + embed `Mensaje_Report` (link name confirmado en .ds). Filtro `zoho.loginuserid` ya integrado en la definición del reporte.~~ |
| ~~B3~~ | ~~Enriquecer tarjeta Clientes~~ | ~~DONE — título panel gris + embed `Trabajadores_Documentos` (link name del reporte "Cliente - Empleado") con criteriaString `Trabajador.Mail_Portal_Empleado == zoho.loginuserid || ...`. El rol Empleado ya tenía acceso. Verificado en portal.~~ |

### Pendiente (próximas sesiones)

| ID | Feature | Descripción |
|----|---------|-------------|
| ~~B3-FIX~~ | ~~Fix filtrado "Documentación con Clientes"~~ | ~~DONE~~ |

### Regla de ejecución
- Feature por feature — confirmar antes de pasar al siguiente
- Siempre: estudiar el `.ds` antes de editar para conocer campos reales
- Guardar ZML desde App IDE: `document.querySelector('a.zc-dem-savescript').click()` → toast "Guardado"
- Guardar script de página desde Page Builder: "Listo" panel script → "Listo" toolbar

---

## Arquitectura técnica: Página `Inicio`

### Página
- Link name: `Inicio`
- Display name: "Tablero Inicio"
- Portal URL: `#Page:Inicio`

### Variables de página actuales (post M2 — sin cambios en M3, M3 usa `zoho.loginuserid` directo en ZML)
| Variable | Tipo | Asignada en script |
|----------|------|--------------------|
| Confirmaciones | Collection | ✅ `Confirmaciones_de_Entrega[...]` |
| EmpleadoNombre | Text | ✅ `empleado.Nombre` |
| EmpleadoArea | Text | ✅ `empleado.Area_Profesional` |
| EmpleadoPuesto | Text | ✅ `empleado.Puesto_laboral_actual` |
| EmpleadoContrato | Text | ✅ `empleado.Tipo_de_Contrato1` |
| EmpleadoDelegacion | Text | ✅ `empleado.Delegacion` |
| EmpleadoClientes | Text | ✅ loop sobre `Clientes_Habituales` |
| EmpleadoID | Number | ❌ declarada pero NO asignada en script |
| WhatsappEmpresa | Text | ❌ declarada, nunca asignada (dead) |

> **Nota**: `WhatsappEmpresa` y `EmpleadoID` son variables muertas — se pueden borrar en una futura sesión de limpieza.

### Script actual (post B1 + B2 + M2 + KPI-FIX)
```deluge
input.LoginEmail = zoho.loginuserid;
input.Confirmaciones = Confirmaciones_de_Entrega[Empleado.Official_Email == zoho.loginuserid];
empleado = Nuevo_Empleado[Official_Email == zoho.loginuserid || Mail_Portal_Empleado == zoho.loginuserid || Correo_Electr_nico == zoho.loginuserid];
input.EmpleadoNombre = empleado.Nombre;
input.EmpleadoArea = empleado.Area_Profesional;
input.EmpleadoPuesto = empleado.Puesto_laboral_actual;
input.EmpleadoContrato = empleado.Tipo_de_Contrato1;
input.EmpleadoDelegacion = empleado.Delegacion;
input.EmpleadoClientes = "";
first = true;
for each  clienteID in empleado.Clientes_Habituales
{
	cliente = Nuevo_Cliente[ID == clienteID];
	if(!first) { input.EmpleadoClientes = input.EmpleadoClientes + ", "; }
	else { first = false; }
	input.EmpleadoClientes = input.EmpleadoClientes + cliente.Nombre_de_Cuenta;
}
```

### Para M2: campos disponibles en Nuevo_Empleado
- `Puesto_laboral_actual` (Dropdown)
- `Tipo_de_Contrato1` (Dropdown)
- `Delegacion` (Dropdown)
- `Fecha_de_Alta` (Date)
- `Area_Profesional` (Dropdown) — ya usado

### Para M3: forms de solicitudes
- Solicitudes de permiso: form `Solicitud` — campo `Tipo`, `Estado` (Sin Respuesta / Aprobado / Rechazado), filtrar empleado por `Empleado.Official_Email == zoho.loginuserid`
- Solicitudes EPI: form `Solicitud_de_EPIs_Herramientas` — campo `Aprobado` (Sin Respuesta / Aprobado / Rechazado / Gestionándose / Entregado / Confirmado)

### Para M5: form Anuncios
- Form: `Add_Announcement`
- Report a embeder: buscar link name del reporte en el `.ds`

### Para M6: ausencias
- Report `Ver_Solicitud` filtrado por `Aprobado == "Aprobado"` y fecha futura

### Para M7: mensajes
- Form `Mensaje` — campos: `Autor`, `Contenido`, `Es_Respuesta`
- Report `Mensaje_Report`

---

## ZML actual del dashboard (post M3)

Estructura del ZML (13394 chars):
1. `<row>` — Panel 2: Título "Portal del Empleado"
2. `<row>` outer → `<column width='100%'>`:
   - `<row>` — 4 cols: EmpleadoNombre (29%) | Área (27%) | Clientes Actuales (27%) | Encuestas Activas badge (17%)
   - `<row>` — 3 cols: Puesto (33%) | Contrato (33%) | Delegación (34%)  ← M2
   - `<row>` — 2 cols: Permisos Pendientes (50%) | EPIs/Herramientas Pendientes (50%)  ← M3
   - `<row>` — 3 cols: Nueva Solicitud Permiso (33%) | Nueva Solicitud EPI (33%) | Mensaje a RRHH (34%)  ← M4
   - `<row>` — Panel título "Anuncios" (gris #F5F5F5, 100%)  ← M5
   - `<row>` — Report Announcements (100%)  ← M5
   - `<row>` — Report Confirmaciones_de_Entrega_Report (100%)

Para añadir nuevas secciones: insertar `<row>` dentro del `<column width='100%'>` antes del report row.
