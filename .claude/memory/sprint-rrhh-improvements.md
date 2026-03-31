# Sprint: Mejoras Flujos RRHH
> Plan creado: 2026-03-10. Estado: PENDIENTE de inicio.

## Orden de ejecución priorizado

---

### FASE 1 — Bugs críticos (impacto directo en usuario)

#### #1 · M-BUG-1: Fix filtro Mensaje_Report (empleado no ve respuestas RRHH)
**Dónde**: reporte `Mensaje_Report` en el IDE
**Qué hacer**: cambiar el filtro del reporte de:
```
[Autor.Mail_Portal_Empleado == zoho.loginuserid || Autor.Official_Email == zoho.loginuserid || Autor.Correo_Electr_nico == zoho.loginuserid]
```
a:
```
[Tecnico.Mail_Portal_Empleado == zoho.loginuserid || Tecnico.Official_Email == zoho.loginuserid || Tecnico.Correo_Electr_nico == zoho.loginuserid]
```
**Cómo**: navegar a `/report/Mensaje_Report/edit` → editar criterio del reporte
**Verificación**: en el portal del empleado, sección "Historial Mensajes y Respuestas" debe mostrar también las respuestas de RRHH (filas con `Es_Respuesta = SI`)
**Riesgo**: bajo — solo cambia qué filas ve el empleado; RRHH no se ve afectado

---

#### #2 · M-BUG-3: Notificación push al empleado cuando RRHH responde mensaje
**Dónde**: nuevo workflow en form `Mensaje`
**Qué hacer**: crear workflow `on add` de `Mensaje` con condición `Es_Respuesta == "SI"`:
```deluge
// push notification al técnico (empleado) cuando RRHH responde
pushnotification
(
  sender type : "fields"
  to : "${Tecnico.Mail_Portal_Empleado}"
  title : "Nuevo mensaje de RRHH"
  message : "RRHH ha respondido a tu mensaje: ${Contenido}"
  view: "Mensaje_Report"
)
```
**Cómo**: crear nuevo workflow form en `/workflow/edit` → form `Mensaje` → evento "Creado" → on success → condición `Es_Respuesta == "SI"`
**Verificación**: empleado recibe notificación push en el portal al responder RRHH
**Riesgo**: bajo — workflow nuevo, no modifica nada existente

---

#### #3 · M-BUG-2: Fix Notificar1/Notificar2 duplicados en EPI
**Dónde**: workflows `Notificar1` y `Notificar2` en form `Solicitud_de_EPIs_Herramientas`
**Qué hacer**:
1. Mantener `Notificar1`, corregir la condición con paréntesis correctos:
   ```
   Aprobado == "Rechazado" && (Trabajador_Solicitante.Correo_Electr_nico == zoho.loginuserid || Trabajador_Solicitante.Official_Email == zoho.loginuserid || Trabajador_Solicitante.Mail_Portal_Empleado == zoho.loginuserid)
   ```
2. Eliminar `Notificar2` (es duplicado)
**Cómo**: navegar a `/workflowbuilder/Notificar1/edit` → editar condición; luego eliminar `Notificar2`
**Verificación**: al rechazar un EPI, el empleado recibe UNA sola notificación (no dos)
**Riesgo**: bajo — el comportamiento actual ya es errático; solo puede mejorar

---

### FASE 2 — Mejoras UX (proceso más robusto)

#### #4 · M-UX-1: Validación 15 días permisos (backend)
**Dónde**: nuevo workflow `on validate` en form `Solicitud`
**Qué hacer**: añadir workflow de validación que bloquee si fecha < hoy + 14 días, pero solo para el rol Empleado:
```deluge
if(thisapp.permissions.isUserInProfile("Empleado"))
{
  if(input.Fecha_de_comienzo < zoho.currentdate.addDay(14))
  {
    alert "Las solicitudes deben hacerse con al menos 15 días de antelación. Tu fecha de inicio mínima es: " + zoho.currentdate.addDay(15);
  }
}
```
**Cómo**: crear nuevo workflow form → `Solicitud` → evento "Creado o editado" → on validate
**Verificación**: en el portal, intentar enviar solicitud con fecha inmediata → debe bloquear con el mensaje
**Riesgo**: bajo — workflow nuevo. RRHH no se bloquea (`isUserInProfile("Empleado")` = false para RRHH)

---

#### #5 · M-UX-3: Dashboard RRHH — panel solicitudes pendientes
**Dónde**: nueva página ZML en el portal (o sección en una página existente)
**Qué hacer**: crear página "Tablero RRHH" con:
- KPI: solicitudes EPI sin respuesta (count)
- KPI: solicitudes permiso sin respuesta (count)
- KPI: mensajes sin respuesta de RRHH (last 7 días)
- Embed: `Calendario_Solicitudes` (mes actual)
- Embed: `Conversaci_n_Report` (mensajes recientes)
- Botones de acción rápida: Nueva solicitud EPI / Nueva solicitud permiso / etc.

**Consideraciones de permisos**: esta página solo debe ser accesible para el rol RRHH (no para Empleado)
**Cómo**: App IDE → nueva página → ZML similar al Tablero Inicio del empleado
**Riesgo**: medio — requiere crear página nueva, configurar permisos de portal para rol RRHH

---

#### #6 · M-UX-5: Formato condicional historial mensajes (portal empleado)
**Dónde**: reporte `Mensaje_Report`
**Qué hacer**: añadir formato condicional para distinguir mensajes del empleado vs respuestas RRHH:
- `Es_Respuesta == "SI"`: fondo azul claro `#E3F2FD`, texto azul oscuro → visual "respuesta de RRHH"
- `Es_Respuesta != "SI"`: estilo neutro (default)
**Cómo**: `/report/Mensaje_Report/edit` → pestaña "Formato condicional"
**Riesgo**: bajo — solo visual, no cambia lógica

---

### FASE 3 — Mejoras PRL (para el sprint siguiente, si se aprueba)

#### #7 · M-PRL-3: Motivo de rechazo obligatorio en EPI
- Workflow `on validate` en `Responder_Solicitud_EPI`: si `Respuesta == "Rechazado"` y `Nota_Sobre_Respuesta_a_la_Soilicitud` está vacía → alert bloqueante

#### #8 · M-PRL-4: Semáforo de antigüedad en solicitudes EPI sin respuesta
- Añadir campo `Fecha_de_Solicitud` (date, auto-relleno on add con `zoho.currentdate`)
- En `Ver_Solicitud_de_EPIs_Herramientas`: formato condicional:
  - Verde: `Aprobado != "Sin Respuesta"` (ya gestionada)
  - Naranja: `Aprobado == "Sin Respuesta" && Fecha_de_Solicitud >= zoho.currentdate.addDay(-3)` (< 3 días)
  - Rojo: `Aprobado == "Sin Respuesta" && Fecha_de_Solicitud < zoho.currentdate.addDay(-3)` (> 3 días sin respuesta)

#### #9 · M-PRL-5: Campo Urgencia en solicitud EPI
- Añadir campo `Urgencia` (radiobutton: Normal / Urgente) al form `Solicitud_de_EPIs_Herramientas`
- Visible al empleado en el portal
- En el reporte RRHH: formato condicional "Urgente" = fondo rojo claro + ordenar Urgentes primero

---

## Orden de ejecución recomendado para este sprint
```
#1 M-BUG-1  → Fix Mensaje_Report filtro          ✅ DONE (ya estaba aplicado)
#2 M-BUG-3  → Notificación respuesta RRHH         ✅ DONE (ya estaba implementado)
#3 M-BUG-2  → Fix Notificar1 EPI                 ✅ DONE (to:Added_User, cond:Aprobado==Rechazado)
#4 M-UX-1   → Validación 15 días backend          ❌ DESCARTADO (los 15 días no son obligatorios)
#5 M-UX-5   → Formato condicional mensajes        ❌ NO DISPONIBLE (backend 500: Zoho no soporta para report tipo "list"; sidebar oculto por CSS)
#6 M-UX-3   → Dashboard RRHH                      ✅ DONE (página Tablero_RRHH, ID:4790826000000987067, TAB perm → Gestor RRHH)
```

---

## IDs y link names confirmados (no buscar de nuevo)

| Elemento | Link Name / ID |
|---|---|
| App | `human-resource-management` |
| Owner | `formacion11` |
| Form EPI | `Solicitud_de_EPIs_Herramientas` |
| Form Respuesta EPI | `Responder_Solicitud_EPI` |
| Form Permisos | `Solicitud` |
| Form Mensaje | `Mensaje` |
| Report EPI empleado | `Ver_Solicitud_de_EPIs_Herramientas` |
| Report Permisos RRHH | `Ver_Solicitudes` |
| Calendar Permisos | `Calendario_Solicitudes` |
| Report Mensajes empleado | `Mensaje_Report` |
| Report Conversaciones RRHH | `Conversaci_n_Report` |
| Workflow Aprobar permiso | `Aprobar1` |
| Workflow Denegar permiso | `Denegar1` |
| Workflow Notificar EPI add | `Notificar` |
| Workflow Notificar EPI rechazado 1 | `Notificar1` |
| Workflow Notificar EPI rechazado 2 (duplicado) | `Notificar2` |
| Workflow Responder mensaje | `Responder_Mensaje_a_Emple` |
| Rol Empleado profileId | `4790826000000171117` |
