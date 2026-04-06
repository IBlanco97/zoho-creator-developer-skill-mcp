# Plan: Dashboard Flota + Historial Solicitudes EPI (RRHH)

## Resumen

Dos nuevas páginas HTML Snippet para la app `human-resource-management`:

1. **Dashboard de Flota** (`Tablero_Flota`) — rediseño completo del dashboard actual (que solo tiene 2 KPIs y 2 reportes embebidos) con el patrón probado de HTML Snippet + función Deluge
2. **Historial Solicitudes EPI** (`Historial_Solicitudes_EPI`) — nueva página para gestores RRHH con vista completa de todas las solicitudes de EPIs/Herramientas de todos los empleados

---

## Tarea 1: Dashboard de Flota (rediseño `Tablero_Flota`)

### Función Deluge: `Calendario52HTML.DevolverHTMLTableroFlota()`

**KPIs (4 tarjetas):**
| KPI | Query | Color |
|-----|-------|-------|
| Total Vehículos | `Add_Vehicle[ID != 0]` | Azul `#3182ce` |
| Asignados | `Add_Vehicle[Chofer != 0 && Estado_del_Vehiculo == "Activo"]` | Verde `#38a169` |
| Sin Chofer | `Add_Vehicle[Chofer == 0 && Estado_del_Vehiculo == "Activo"]` | Naranja `#dd6b20` |
| Archivados | `Add_Vehicle[Estado_del_Vehiculo == "Archivado"]` | Gris `#718096` |

**Filtros CSS-only (4 botones radio):**
- Todos | Asignados | Sin Chofer | Archivados

**Tarjetas por vehículo:**
- Header: Nombre + badge estado (Activo=verde, Archivado=gris)
- Body: Marca/Modelo, Matrícula (`Numero_de_Registro`), Combustible, Año
- Chofer asignado: avatar con iniciales + nombre (o "Sin asignar" en naranja)
- Footer: botón "Ver Historial" → enlace al reporte de asignaciones filtrado

**Sección inferior: Asignaciones Activas Recientes**
- Tabla con últimas asignaciones activas (`Assign_Driver[Estado_de_la_Asignaci_n == "Activa"]`)
- Columnas: Vehículo | Chofer | Desde | Odómetro Inicial

### Implementación en Zoho:
1. Crear función `Calendario52HTML.DevolverHTMLTableroFlota` en App IDE
2. Actualizar página `Tablero_Flota` existente: reemplazar ZML actual por HTML Snippet que llama a la función
3. El snippet ya existente se reemplaza, no hace falta crear página nueva

---

## Tarea 2: Historial Solicitudes EPI (nueva página RRHH)

### Función Deluge: `Calendario52HTML.DevolverHTMLHistorialSolicitudesEPI()`

**KPIs (4 tarjetas):**
| KPI | Query | Color |
|-----|-------|-------|
| Total Solicitudes | `Solicitud_de_EPIs_Herramientas[ID != 0]` | Azul `#3182ce` |
| Pendientes | `Solicitud_de_EPIs_Herramientas[Aprobado == "Sin Respuesta"]` | Naranja `#dd6b20` |
| Aprobadas/Entregadas | `...[Aprobado == "Aprobado" \|\| Aprobado == "Entregado" \|\| Aprobado == "Confirmado"]` | Verde `#38a169` |
| Rechazadas | `...[Aprobado == "Rechazado"]` | Rojo `#e53e3e` |

**Filtros CSS-only (5 botones):**
- Todas | Pendientes | Aprobadas | Entregadas | Rechazadas

**Tabla de solicitudes:**
| Columna | Campo |
|---------|-------|
| Empleado | `Trabajador_Solicitante` (lookup → Nuevo_Empleado.Nombre) |
| Tipo | `Tipo_de_equipo_solicitado` (EPI/ROPA/HERRAMIENTA) — badge color |
| Equipo Solicitado | `Equipo_Solicitado` |
| Fecha | `Added_Time` |
| Estado | `Aprobado` — badge color por estado |
| Acción | Botón "Responder" → `#Form:Responder_Solicitud_EPI?Solicitud_a_la_que_se_responde1={ID}` |

**Ordenamiento:** Más recientes primero (iteración inversa o sort por Added_Time desc)

### Implementación en Zoho:
1. Crear función `Calendario52HTML.DevolverHTMLHistorialSolicitudesEPI` en App IDE
2. Duplicar una página existente (ej. `Ficha_Empleado`) → renombrar a `Historial_Solicitudes_EPI`
3. Crear HTML Snippet con el snippet estándar
4. Dar TAB permission a roles RRHH (Gestor RRHH, RESPONSABLE CAE, SUPER ADM, SUPERVISOR, OPERARIO CAE)
5. Añadir al menú RRHH en la sección adecuada

---

## Secuencia de implementación

### Paso 1: Escribir código Deluge localmente
- Crear `deluge-drafts/DevolverHTMLTableroFlota.deluge`
- Crear `deluge-drafts/DevolverHTMLHistorialSolicitudesEPI.deluge`

### Paso 2: Desplegar función Tablero Flota
- App IDE → función `Calendario52HTML` → crear `DevolverHTMLTableroFlota`
- Pegar código via chunked `window._fc` (>4KB)
- Guardar con `a.zc-dem-savescript`

### Paso 3: Actualizar página Tablero_Flota
- App IDE → página `Tablero_Flota` → reemplazar ZML actual por snippet HTML

### Paso 4: Desplegar función Historial Solicitudes EPI
- App IDE → función `Calendario52HTML` → crear `DevolverHTMLHistorialSolicitudesEPI`
- Pegar código

### Paso 5: Crear página Historial_Solicitudes_EPI
- Duplicar página existente → configurar snippet → TAB permissions

### Paso 6: Verificar en portal
- Navegar a `#Page:Tablero_Flota` y `#Page:Historial_Solicitudes_EPI`
- Confirmar KPIs, filtros, tarjetas/tabla

---

## Patrones aplicados (del proyecto)
- HTML Snippet + función Deluge (patrón estándar)
- CSS-only filters (radio buttons ocultos + sibling combinators)
- Contador manual (`cnt_`) en vez de `.size()`
- Guard `!= 0` para IDs (nunca `!= ""`)
- `ifnull()` antes de `.toString()` en campos opcionales
- `class='x'` sin backslash (evitar bug CSS `class="'x'"`)
- Ternarios inline para minimizar statements por iteración
- Chunks `window._fc` para código >4KB
