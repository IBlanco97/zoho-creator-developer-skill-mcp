# Flujos RRHH — Documentación desde perspectiva del Gestor de RRHH/PRL
> Explorado: 2026-03-10. Fuente: exportScript (2.2MB `.ds`) + screenshots Playwright.

---

## Acceso RRHH
- URL: `https://creator.zoho.com/appbuilder/formacion11/human-resource-management/`
- Usuario: `ecama@sicma21.com` (Eva Cama — gestora RRHH)
- Rol: Admin / RRHH (perfil con acceso total a formularios y reportes)

---

## FLUJO 1: Solicitudes EPI / Herramientas / Ropa

### Formulario completo (todos los campos, incluyendo ocultos al empleado)
| Campo (link name) | Tipo | Visible a empleado | Notas |
|---|---|---|---|
| `Trabajador_Solicitante` | Picklist → `Nuevo_Empleado` | ❌ Oculto (auto-relleno) | Auto-rellena con `GetEmpleadoLogueado()` |
| `Tipo_de_equipo_solicitado` | Radiobutton | ✅ | EPI / ROPA / HERRAMIENTA |
| `Equipo_Solicitado` | Textarea | ✅ | Descripción libre, obligatorio |
| `Motivo_de_la_Solucitud` | Textarea | ✅ | Opcional. ⚠️ Typo: "Solucitud" |
| `Fecha_Prevista_de_Entrega` | Date | ❌ Deshabilitado | RRHH puede editar; empleado ve pero no edita |
| `Aprobado` | Radiobutton | ❌ Oculto | 6 estados: Sin Respuesta / Aprobado / Rechazado / Gestionándose / Entregado / Confirmado |
| `Equipo_Asignado` | Textarea | ❌ Oculto | Descripción libre del equipo entregado |
| `Equipo_Asignado1` | Picklist → `Nuevo_EPI_Herramienta` | ❌ Oculto | Filtrado por disponibles + tipo solicitado |
| `Nota_Sobre_Respuesta_a_la_Soilicitud` | Textarea | ✅ (readonly) | ⚠️ Typo: "Soilicitud" |
| `Historia_de_la_Solicitud` | Textarea | ✅ (readonly) | Timestamps automáticos por cambio |
| `Etiqueta` | Text | ❌ Oculto | Uso interno |

### Vista RRHH: reporte `Ver_Solicitud_de_EPIs_Herramientas`
- **Nombre display**: "Solicitudes EPI - Herramientas"
- **Filtro**: muestra **TODAS** las solicitudes (sin filtro de empleado) — RRHH ve todas
- **Columnas**: Confirmar | Equipo Solicitado | Equipo Asignado | Fecha Prevista | Estado | Historia | Motivo | Nota Respuesta | Tipo equipo
- **Acción "Aprobar EPI"**: botón de acción personalizado → abre popup con `Responder_Solicitud_EPI`
- **Formato condicional**: Aprobado/Entregado = verde `#92d191` | Rechazado = rojo
- **Filtro por estado**: Sin Respuesta / Aprobado / Rechazado / etc. (presumiblemente filtros rápidos)

### Formulario de respuesta RRHH: `Responder_Solicitud_EPI`
Popup que abre "Aprobar EPI". Campos:
| Campo | Tipo | Valores |
|---|---|---|
| `Respuesta` (Estado) | Radiobutton, obligatorio | Sin Respuesta / Aprobado / Rechazado / Gestionándose / Entregado |
| `Equipo_Asignado` | Textarea | Descripción libre |
| `Fecha_Prevista_de_Entrega` | Date | — |
| `Nota_Sobre_Respuesta_a_la_Soilicitud` | Textarea | — |
| `Historia_de_la_Solicitud` | Textarea (readonly) | Pre-cargada del registro original |
| `Solicitud_a_la_que_se_responde1` | Picklist (oculto) | ID del registro EPI original |

Al enviar: llama `thisapp.NuevoEPIRopaHerramienta.NotificarCambioSolicitudEPI(solicitud, estado)` y actualiza la solicitud original.

### Workflow de respuesta RRHH (Env_o_de_Formulario7 — on add Responder_Solicitud_EPI)
```deluge
solicitud = Solicitud_de_EPIs_Herramientas[ID == input.Solicitud_a_la_que_se_responde1];
thisapp.NuevoEPIRopaHerramienta.NotificarCambioSolicitudEPI(solicitud, solicitud.Aprobado);
// + lógica adicional (truncada en exportScript)
```

### Ciclo de vida completo (estados del campo `Aprobado`)
```
[Empleado crea] Sin Respuesta
    → RRHH responde: Aprobado / Gestionándose / Rechazado
    → Si avanza: Entregado (RRHH marca cuando entrega físicamente)
    → Empleado confirma: Confirmado (botón "Confirmar" en portal, solo visible cuando Entregado)
```

### Notificaciones automáticas
| Evento | Destinatario | Canal | Código |
|---|---|---|---|
| Nueva solicitud (on add) | RRHH | Push notification / email | `thisapp.SolicitudEPI.NotificarSolicitudEPI(solicitud)` |
| Solicitud rechazada (on add or edit, Aprobado=="Rechazado") | Empleado | Push notification al portal | `Notificar1` + `Notificar2` (⚠️ duplicados — ver bugs) |
| Cambio de estado (via Responder_Solicitud_EPI) | Empleado | Push/email | `NotificarCambioSolicitudEPI(...)` |

### ⚠️ Bugs / Issues detectados
1. **`Notificar1` y `Notificar2` duplicados**: misma condición, mismo mensaje, distinto nombre. Condición OR malformada:
   - `Notificar1`: `Aprobado == "Rechazado" && Correo == loginuserid || Official_Email == loginuserid` — el `||` no está agrupado, puede dispararse sin que sea "Rechazado"
   - `Notificar2`: idem con campos invertidos
   - Riesgo: notificación doble al empleado cuando se rechaza + posible notificación espuria en otros estados
2. **`Notificaciones` workflow vacío**: trigger `on user input de Aprobado` sin acciones — workflow incompleto o huérfano
3. **Typos en campos**: `Motivo_de_la_Solucitud`, `Nota_Sobre_Respuesta_a_la_Soilicitud` — puede confundir a nuevos desarrolladores
4. **`Equipo_Asignado` (textarea) y `Equipo_Asignado1` (picklist) duplicados**: dos campos para asignar equipo con diferente mecanismo — no queda claro cuál usa la notificación al empleado

---

## FLUJO 2: Solicitudes de Permisos / Vacaciones

### Formulario completo
| Campo (link name) | Tipo | Visible a empleado | Notas |
|---|---|---|---|
| `Trabajador_Solicitante` | Picklist → `Nuevo_Empleado` | ❌ Oculto (add) / ✅ (edit RRHH) | Auto-rellena con `GetEmpleadoLogueado()` |
| `plain` | PlainText | ✅ | Aviso HTML "15 días de antelación" |
| `Tipo` | Picklist | ✅ | Vacaciones / Permiso Retribuido / Permiso no Retribuido |
| `Tipo_de_Permiso_No_Retribuido` | Text | ✅ | Libre, para permiso no retribuido |
| `Tipo_de_Permiso_Retribuido` | Picklist | ✅ | 11 opciones legales (hospitalización, matrimonio, etc.) |
| `Fecha_de_comienzo` | Date | ✅ | Valor inicial = `zoho.currentdate` (⚠️ no fuerza +15 días en backend) |
| `Fecha_de_Fin` | Date | ✅ | — |
| `Nota` | Textarea | ✅ | — |
| `Aprobado` | Picklist | ❌ Oculto (add) | SI / NO / Sin Respuesta (distinto a EPI) |

### Vista RRHH: reporte `Ver_Solicitudes` (default)
- **Nombre display**: "Solicitudes de Permisos o Vacaciones"
- **Filtro**: muestra **TODAS** las solicitudes de todos los empleados
- **Columnas**: Fecha inicio | Fecha fin | Nota | Estado | Trabajador (con link a ficha) | Aprobar | Denegar | Tipo | Tipo Retribuido | Cliente del trabajador | Tipo No Retribuido
- **Filtros rápidos**: Vacaciones | Solicitudes de Permisos Retribuidos | Solicitudes de Permisos No Retribuidos
- **Ordenación**: Fecha_de_comienzo descendente
- **Acciones**:
  - **"Aprobar"** (solo si `Aprobado == "Sin Respuesta"`): `input.Aprobado = "SI"` + `NotificarAEmpleado(...)`
  - **"Denegar"** (solo si `Aprobado == "Sin Respuesta"`): `input.Aprobado = "NO"` + borra asignación calendario + `NotificarAEmpleado(...)`

### Vista RRHH: calendario `Calendario_Solicitudes`
- **Nombre display**: "Calendario Solicitudes"
- **Filtro**: `Aprobado == "SI" || Aprobado == "Sin Respuesta" || Aprobado is null` — muestra aprobadas + pendientes (no rechazadas)
- **Vista**: mes, inicio semana domingo
- **Display**: `Trabajador_Solicitante` + foto del empleado
- **Acciones**: Aprobar / Rechazar directamente desde el calendario
- **Función**: vista visual de RRHH para detectar solapamientos

### Workflows de decisión RRHH
```deluge
// Aprobar:
input.Aprobado = "SI";
trabajador = Nuevo_Empleado[ID == input.Trabajador_Solicitante];
thisapp.SolicitudPermiso.NotificarAEmpleado(trabajador, input.Fecha_de_comienzo, input.Fecha_de_Fin, input.ID);

// Denegar:
input.Aprobado = "NO";
delete from Asignacion_Tecnico_Cliente_Anio[Solicitud == input.ID];
trabajador = Nuevo_Empleado[ID == input.Trabajador_Solicitante];
thisapp.SolicitudPermiso.NotificarAEmpleado(trabajador, input.Fecha_de_comienzo, input.Fecha_de_Fin, input.ID);
```

### Integración con calendario de planificación
Al crear una solicitud (cualquier estado), se ejecuta `CrearAsignacionCalendario`:
```deluge
solicitud = Solicitud[ID == input.ID];
etiqueta = solicitud.Tipo + " - " + solicitud.Trabajador_Solicitante.Nombre;
insert into Rango_Fechas_Asingacion [
  Fecha_de_Comienzo1 = solicitud.Fecha_de_comienzo
  Fecha_de_Fin = solicitud.Fecha_de_Fin
  Tipo = "Permiso"
  Solicitud = solicitud.ID
  Etiqueta = etiqueta
  Tecnico = solicitud.Trabajador_Solicitante.ID
];
thisapp.ProgramaAnualActividadTecnico.CrearSolicitudPermisoEnCalendario52(solicitud);
```
→ El permiso entra directamente en el **calendario 52 semanas del técnico** (para gestión de proyectos/asignaciones a clientes).

Al eliminar la solicitud: limpia `Asignacion_Tecnico_Cliente_Anio` y `Rango_Fechas_Asingacion`.

### Notificaciones
| Evento | Destinatario | Canal |
|---|---|---|
| Aprobado / Denegado | Empleado | `thisapp.SolicitudPermiso.NotificarAEmpleado(...)` (email/push) |

### ⚠️ Bugs / Issues detectados
1. **Sin validación de 15 días en backend**: el formulario muestra el aviso "15 días de antelación" como plaintext HTML pero no hay workflow `on validate` que lo compruebe. Un empleado puede poner fechas inmediatas sin error del sistema.
2. **Campo `Aprobado` inconsistente con EPI**: usa SI/NO/Sin Respuesta (picklist) en lugar de Aprobado/Rechazado (radiobutton). Los KPIs del dashboard usan `Aprobado == "Sin Respuesta"` — funciona, pero mezcla semántica
3. **Filtro hardcoded en calendario**: `Aprobado == "Sin Respuesta" || Aprobado is null` incluye pendientes pero no hay alerta visual de "antigüedad" para solicitudes sin respuesta hace más de X días
4. **`Aprobar_Solicitud_Reporte` y `Rechazar_Solicitud_Report` vs `Aprobar1` y `Denegar1`**: hay DOS pares de workflows de aprobar/rechazar — uno para el reporte lista, otro para el calendario. Posible divergencia si uno se actualiza y el otro no.

---

## FLUJO 3: Mensajes Empleado ↔ RRHH

### Modelo de datos
```
Nuevo_Empleado (técnico)
    └── Conversaci_n [T_cnico → Nuevo_Empleado] ← "thread" por empleado (1:1)
            └── Mensaje (last message ID only, not a list)

Mensaje [Autor → Nuevo_Empleado, Tecnico → Nuevo_Empleado, Es_Respuesta: SI/NO]
    ← Todos los mensajes del hilo (sentido: empleado→RRHH y RRHH→empleado)
```

⚠️ **Limitación arquitectónica**: `Conversaci_n.Mensaje` guarda SOLO el **último** mensaje (picklist a un único ID), no un historial. El historial completo vive en el form `Mensaje` filtrado por `Tecnico`.

### Vista empleado (portal)
- **Formulario "Dejar un mensaje"** (`#Form:Mensaje`):
  - Campo visible: solo `Contenido` (textarea)
  - OnLoad: auto-rellena `Autor` desde `GetEmpleadoLogueado()` + oculta Autor, Fecha_Hora, Tecnico, Es_Respuesta
  - SetearTecnico: si `Es_Respuesta != "SI"` → `input.Tecnico = input.Autor` (el técnico es el propio empleado)
- **Reporte "Historial Mensajes y Respuestas"** (`Mensaje_Report`):
  - Filtro: `Autor.Mail_Portal_Empleado == zoho.loginuserid || ...` — solo mensajes donde el autor es el empleado logueado
  - Columnas: Autor | Contenido | Fecha-Hora | Técnico | Es Respuesta
  - ⚠️ El filtro solo muestra mensajes del EMPLEADO como autor, NO las respuestas de RRHH (donde `Es_Respuesta = "SI"` y el `Autor` es RRHH, no el empleado)

### Vista RRHH: reporte `Conversaci_n_Report` (default)
- **Nombre display**: "Mensajes de Empleados"
- **Columnas**: Conversación con (técnico) | Dejar un mensaje | Ultimo Mensaje | Responder | Autor Últ. Mensaje
- **Acción "Responder"**: `Responder_Mensaje_a_Emple` → abre popup `#Form:Mensaje?Es_Respuesta=SI&Autor={RRHH_ID}&Tecnico={técnico_ID}`
- **Acción "Abrir Historial"**: `Abrir_Historial_de_Conver` → abre hilo completo

### Vista RRHH: reporte `Mensajes_de_Empleados` (list)
- Muestra **todos** los mensajes de todos los empleados (sin filtro)
- Columnas: Autor | Contenido | Fecha-Hora
- Vista alternativa/diagnóstico

### Workflow "Crear conversación" (on add Mensaje)
```deluge
conversacion = Conversaci_n[T_cnico = input.Tecnico];
if(conversacion.ID == null) {
    // Primera vez: crea thread
    conversacion = insert into Conversaci_n [
        Mensaje = input.ID
        T_cnico = input.Autor
    ];
} else {
    // Actualiza último mensaje en el thread
    conversacion.Mensaje = input.ID;
}
```

### Workflow "Responder Mensaje a Empleado" (on click, Conversaci_n)
```deluge
regitroUsuario = Nuevo_Empleado[Official_Email == zoho.loginuserid || ...];
url = "#Form:Mensaje?Es_Respuesta=SI&Autor=" + regitroUsuario.ID + "&Tecnico=" + input.T_cnico;
openUrl(url, "popup window");
```

### ⚠️ Bugs / Issues detectados
1. **`Mensaje_Report` del portal SOLO muestra mensajes del empleado como autor**: las respuestas de RRHH (donde `Es_Respuesta = "SI"` y `Autor` = empleado RRHH) NO aparecen en el filtro `[Autor.Mail == zoho.loginuserid]`. El empleado no puede ver las respuestas de RRHH en este reporte.
   - ⚠️ **BUG CRÍTICO**: la funcionalidad de "Historial Mensajes y Respuestas" está rota para el empleado — no ve las respuestas
   - Fix: cambiar filtro a `[Tecnico.Mail == zoho.loginuserid]` o incluir OR con `Es_Respuesta == "SI" && Tecnico.Mail == zoho.loginuserid`
2. **`Conversaci_n.Mensaje` = último mensaje únicamente**: no hay relación de lista. Si RRHH quiere ver el hilo completo, necesita "Abrir Historial" — el `Conversaci_n_Report` solo muestra el último mensaje
3. **Typo**: `regitroUsuario` (en lugar de `registroUsuario`) en el workflow de responder
4. **Sin notificación push al empleado cuando RRHH responde**: no hay workflow `on add de Mensaje where Es_Respuesta == "SI"` → push notification al empleado. El empleado solo se entera si revisa el portal

---

## RESUMEN: Qué hace RRHH que el empleado no ve

| Acción RRHH | Formulario/Reporte | Resultado |
|---|---|---|
| Ver solicitudes EPI de todos los empleados | `Ver_Solicitud_de_EPIs_Herramientas` (sin filtro) | Lista global |
| Responder solicitud EPI | Botón "Aprobar EPI" → popup `Responder_Solicitud_EPI` | Cambia estado + notifica empleado |
| Ver solicitudes permisos de todos | `Ver_Solicitudes` (default, sin filtro) | Lista global con filtros rápidos |
| Ver calendario de permisos | `Calendario_Solicitudes` | Vista mensual con estados visuales |
| Aprobar/denegar permiso | Botón en reporte o calendario | Actualiza estado + integra en calendario del técnico |
| Ver conversaciones/mensajes | `Conversaci_n_Report` | Una fila por empleado con último mensaje |
| Responder a empleado | Botón "Responder" → popup `Mensaje` con `Es_Respuesta=SI` | Nuevo registro en `Mensaje` |
| Ver historial completo de conversación | Botón "Abrir Historial" | Filtra `Mensaje` por técnico |

---

## MEJORAS PROPUESTAS

### 🔴 Críticas (bugs activos)

**M-BUG-1: Filtro Mensaje_Report roto (empleado no ve respuestas RRHH)**
- Problema: filtro `[Autor.Mail == zoho.loginuserid]` excluye las respuestas de RRHH
- Fix: cambiar filtro del reporte `Mensaje_Report` a:
  `[Tecnico.Mail_Portal_Empleado == zoho.loginuserid || Tecnico.Official_Email == zoho.loginuserid || Tecnico.Correo_Electr_nico == zoho.loginuserid]`
- Impacto: empleado puede ver el hilo completo incluyendo respuestas RRHH

**M-BUG-2: Notificar1/Notificar2 — condiciones OR malformadas (EPI)**
- Problema: dos workflows casi idénticos con condición sin paréntesis que agrupa mal el AND/OR
- Fix: unificar en un solo workflow con condición:
  `(Aprobado == "Rechazado" && (Trabajador_Solicitante.Correo_Electr_nico == zoho.loginuserid || Trabajador_Solicitante.Official_Email == zoho.loginuserid))`
- Eliminar el duplicado

**M-BUG-3: Sin notificación al empleado cuando RRHH responde mensaje**
- Problema: no hay push notification ni email al empleado al recibir respuesta
- Fix: añadir workflow `on add de Mensaje where Es_Respuesta == "SI"` → push notification al empleado logueado como `input.Tecnico`

### 🟡 Mejoras de flujo (UX/proceso)

**M-UX-1: Validación 15 días en permisos (backend)**
- Actual: solo aviso visual HTML, sin validación real
- Mejora: añadir workflow `on validate de Solicitud` que compruebe `input.Fecha_de_comienzo >= zoho.currentdate.addDay(14)` con mensaje de error bloqueante
- Excepción: permitir al rol RRHH saltarse la validación (`isUserInProfile("Empleado")`)

**M-UX-2: Notificación push a RRHH cuando empleado envía nuevo mensaje**
- Actual: no hay notificación cuando llega un nuevo mensaje al buzón
- Mejora: workflow `on add de Mensaje where Es_Respuesta != "SI"` → push notification a todos los usuarios del perfil RRHH

**M-UX-3: Dashboard RRHH — panel de solicitudes pendientes**
- RRHH no tiene dashboard equivalente al del empleado
- Mejora: página "Tablero RRHH" con KPIs:
  - Nº solicitudes EPI sin respuesta (semáforo por antigüedad)
  - Nº solicitudes permiso sin respuesta
  - Nº mensajes sin responder (últimos 7 días)
  - Calendario de permisos mes actual embebido

**M-UX-4: Unificar semántica de estados Aprobado**
- EPI: radiobutton con 6 estados (Sin Respuesta / Aprobado / Rechazado / Gestionándose / Entregado / Confirmado)
- Permiso: picklist con 3 estados (SI / NO / Sin Respuesta)
- Mejora: homogeneizar a términos consistentes (p.ej. "Pendiente" en lugar de "Sin Respuesta" en ambos, "Aprobado/Rechazado" en ambos)

**M-UX-5: Historial visual del hilo de mensajes (portal empleado)**
- Actual: tabla plana con columna "Es Respuesta" para distinguir dirección
- Mejora: añadir formato condicional al `Mensaje_Report` del portal → filas con `Es_Respuesta == "SI"` en color diferente (p.ej. fondo azul claro) para distinguir visualmente mensajes del empleado vs respuestas RRHH

**M-UX-6: Consolidar Equipo_Asignado duplicado en EPI**
- Existen `Equipo_Asignado` (textarea) y `Equipo_Asignado1` (picklist de inventario) para la misma función
- Mejora: decidir si la asignación es manual (textarea) o desde inventario (picklist) — usar solo uno, o vincular: al seleccionar `Equipo_Asignado1` auto-rellenar `Equipo_Asignado` con el nombre

### 🟢 Mejoras de proceso / PRL

**M-PRL-1: Historial de EPIs asignados por empleado (vista RRHH)**
- Actualmente existe `Historial de Asignaciones de Activos` para el empleado
- Mejora: reporte RRHH con EPIs/Herramientas asignados agrupados por empleado, con fecha de asignación y confirmación

**M-PRL-2: Alertas de EPIs próximos a caducar**
- Si los EPIs tienen fecha de caducidad en `Nuevo_EPI_Herramienta`, añadir workflow programado que notifique a RRHH/PRL con 30 días de antelación

**M-PRL-3: Motivo de rechazo obligatorio en EPI**
- Actual: `Nota_Sobre_Respuesta_a_la_Soilicitud` es opcional en `Responder_Solicitud_EPI`
- Mejora: si `Respuesta == "Rechazado"`, hacer obligatorio el campo de nota
- Añadir validación `on validate` en `Responder_Solicitud_EPI`

**M-PRL-4: SLA / tiempo de respuesta en solicitudes EPI**
- Añadir campo `Fecha_de_Solicitud` (auto-relleno con `zoho.currenttime` en on add) para calcular tiempo de respuesta
- En el reporte RRHH, añadir columna calculada o formato condicional para solicitudes con más de X días sin respuesta (semáforo rojo/naranja)

**M-PRL-5: Campo "Urgencia" en solicitud EPI**
- El formulario actual no tiene campo de urgencia/prioridad
- Mejora: radio Normal / Urgente — permite a RRHH priorizar en el reporte y filtrar
