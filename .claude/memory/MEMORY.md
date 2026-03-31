# Zoho MCP Project Memory

## Zoho Recruit
- [Candidatos Cercanos workflow](recruit-candidatos-cercanos.md) — Custom function: busca candidatos por CP, envía email. Código: `deluge-drafts/BuscarCandidatosCercanos-Recruit.deluge`

## Feedback
- [Zoho Deluge class quoting bug](feedback_zoho_class_quoting.md) — `class=\'x\'` renders as `class="'x'"` in DOM, breaking CSS; always use plain `class='x'`

## Project
- Path: `D:\Sicma21\2026\zoho-mcp`
- Purpose: Custom MCP Server connecting Claude Code to Zoho Creator REST API v2.1
- Stack: TypeScript + Node.js ESM, `@modelcontextprotocol/sdk`, `axios`, `dotenv`, `tsx`

## Architecture
- `src/index.ts` — MCP Server entry point (stdio transport, tool registry + dispatch)
- `src/auth.ts` — OAuth 2.0 refresh-token flow with in-memory token cache
- `src/zoho-client.ts` — Singleton axios instance with auth interceptor + Zoho error handling
- `src/tools/metadata.ts` — `list_forms`, `get_form_fields`
- `src/tools/records.ts` — `get_records`, `get_record`, `create_record`, `update_record`, `delete_record`
- `src/tools/functions.ts` — `invoke_function` (calls Deluge REST endpoints)
- `.mcp.json` — Claude Code MCP registration (stdio, uses env vars)
- `.env.example` — Template for credentials

## Key Notes
- Zoho API returns HTTP 200 even for errors — response `code` field signals result (`3000` = success)
- All logging must go to `stderr`; `stdout` is reserved for MCP protocol messages
- Deluge source code is NOT accessible via REST API; only functions marked as REST endpoints can be invoked
- Rate limit: 50 req/min per IP
- Accounts domain is configurable via `ZOHO_ACCOUNTS_DOMAIN` (default: `accounts.zoho.com`)

## Required env vars
`ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_OWNER_ID`, `ZOHO_APP_LINK_NAME`
Optional: `ZOHO_ACCOUNTS_DOMAIN`

## Status
- Implementation complete, `tsc --noEmit` passes with zero errors
- `.env` fully populated and OAuth verified working (accounts.zoho.com)
- IDE structure fully mapped — see `memory/zoho-ide.md`
- Portal del Empleado fully documented — see `memory/portal-empleado.md`
- Dashboard improvement plan COMPLETED — see `memory/dashboard-plan.md` (B1+B2+M2+M3+KPI-FIX+M4+M5+M6+M7+B3+B3-FIX all done)
- RRHH flows documented (EPI, Permisos, Mensajes) + bugs + improvements — see `memory/rrhh-flows.md`
- Sprint mejoras RRHH **COMPLETADO** — see `memory/sprint-rrhh-improvements.md` (M-BUG-1/2/3 ✅, M-UX-1 descartado, M-UX-5 no disponible, M-UX-3 ✅ Tablero RRHH ID:4790826000000987067)
- B3-FIX resuelto: reporte `Copy_of_Cliente_Empleado` (ID `4790826000000968813`) con filtro nativo `[Trabajador.Mail_Portal_Empleado == zoho.loginuserid || ...]`. ZML actualizado a `linkName='Copy_of_Cliente_Empleado'`. Permisos: VIEW report cambiado a `Copy_of_Cliente_Empleado` + VIEW_ALL en `ProfilePermission` para `Nueva_Lista_de_Requisitos` (ID `4790826000000114889`).
- Sección PRL explorada — ver `memory/prl-section.md` (dashboard, formularios, reportes, workflows, bugs detectados)
- **Tablero PRL rediseñado** ✅ — 6 filas, KPIs en columnas separadas (25% cada uno), números 36px, header `#1C3A5E`, bug Panel 6 título corregido → "En Proceso de Validación", bug Panel 7 criterio corregido → `ContadorEnviadosNoAprobados == 0`
- **Patrón multi-popup documentado** — flujo "Asignar Técnico a Cliente" analizado como referencia para replicar en otro caso de uso — ver `memory/multi-popup-pattern.md`
- **Multi-popup Fecha_de_Caducidad_Modelo IMPLEMENTADO** ✅ — workflows `On_Add_Models` (Trabajadores), `On_Add_Models_Empresa1` (Empresa), `On_Add_Models_Autonomos1` (Autónomos) + `On_Success_Caducidad`. Trigger: `on add` (no `on add or edit`). Bug corregido: picklist `Tipo_de_Caducidad` tenía "Trimensual" → cambiado a "Trimestral" para alinear con `Plantilla.TIPO_CADUCIDAD` y los workflows de cálculo. Tests funcionales pendientes de ejecución por el usuario.
- **4 workflows caducidad actualizados** ✅ — `Calcular_Fecha_caducidad_`, `Calcular_fecha_de_caducid`, `Calcular_fecha_de_caducid1`, `Calcular_fecha_de_caducid2` usan override lookup `for each override in Fecha_de_Caducidad_Modelo[Modelo == input.Plantilla && Cliente == input.CLIENTE]` con fallback a `Plantilla.TIPO_CADUCIDAD`
- **Reporte Semanas — 416 condiciones CF restauradas** ✅ — ZML con las 416 condiciones correctas aplicado en App IDE.
- **Página `Semanas_Nuevo` CON TOOLTIPS CSS** ✅ — Calendario 52 semanas con tooltips hover (`data-t` + CSS `::before content:attr(data-t)`). Cada celda muestra `S{n} | {fecha_inicio} - {fecha_fin}` y opcionalmente `| {Tipo}` si está asignada. Función `Calendario52HTML.DevolverHTMLCalendario52Semanas(int anio)` usa puro Deluge (sin `<script>` — Zoho los elimina). Lista `dates` pre-computada en el loop header y reutilizada en el loop body. URL: `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Semanas_Nuevo`
- **Página `Detalle_Semana` IMPLEMENTADA** ✅ — Al hacer click en cualquier celda del calendario 52 semanas, navega a `#Page:Detalle_Semana?Anio={anio}&Semana={wn}`. Muestra rango de fechas + tabla 9 columnas (Técnico | Cliente | Lun–Dom) con badges de turno (M/T/N/?) y tooltip HTML mostrando horas. componentId: `4790826000001006533`, pageFuncWfId: `4790826000001006551`. Función HTML: `Calendario52HTML.DevolverHTMLDetalleSemana(anio, semana)`.
- **Detalle_Semana grilla de días** ✅ — Accede a días/turno via: `parentId = r.Asignacion_T_cnico_Cliente` → `parentRec = Asignacion_T_cnico_Cliente[ID == parentId]` → `diasLab = parentRec.Dias_Laborales` + `turnList = parentRec.Turnos` (subgrid). ⚠️ `Turno[Asignacion_T_cnico_Cliente == parentId]` falla ("Variable does not exist in Turno") — los registros de subform se acceden VIA el padre, no con query inverso. ⚠️ `parentId != 0` (int), NO `parentId != ""` (type mismatch).
- **Candidatos_Cercanos REDISEÑADO** ✅ — Función `Candidatos.BuscarCercanos(string cpRef, int radioKm)` reescrita con **0 llamadas API externas** (`invokeurl=0`). Arquitectura: (1) CP de referencia → mapa hardcodeado de 52 provincias españolas (prefijo 2 dígitos = `cpRef.subString(0,2)` → capital de provincia); (2) candidatos → mapa hardcodeado de 57 ciudades españolas. Solo hace `zoho.recruit.getRecords` (1 call) + `zoho.recruit.getRecordById` (40 calls). ⚠️ Cuota diaria de Zoho agotada en sesión de desarrollo (pruebas iterativas). Resetea a medianoche. ⚠️ Zoho tiene 2 cuotas diarias independientes: "Webhook calls" (`invokeurl`) y "External Call Statements" (todo incluyendo `zoho.recruit.*`). Bug fix: `if(input.CP_Ref == null || input.CP_Ref == "","08001",input.CP_Ref)` (variables de página string sin valor son `null`, no `""`). `.toDecimal()` sobre null de API lanza excepción — siempre guardar en variable y validar antes de convertir.

- **F2 Semáforo Caducidades EPI IMPLEMENTADO** ✅ — Función `Calendario52HTML.DevolverHTMLSemaforoCaducidades()` + página `Sem_foro_Caducidades_EPI` (componentId: `4790826000001006621`) + TAB permission al rol Gestor RRHH. 562 pills renderizadas. URL: `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Sem_foro_Caducidades_EPI`. Optimización clave: variables intermedias (`est`, `bg`, `nom`, `cad`, `tip`) eliminadas del bucle → inline con `if()` ternarios → ~3 stmts/iter en vez de ~18.

- **F3 Timeline Permisos IMPLEMENTADO** ✅ — Función `Calendario52HTML.DevolverHTMLTimelinePermisos(int anio)` + página `Timeline_Permisos` (componentId: `4790826000001013041`) + TAB permission al rol Gestor RRHH. Tabla 12 columnas mensuales con celdas azules para permisos aprobados. Bug crítico resuelto: `anioStr = anio.toString()` necesario antes de usar `anio` en `toDate()` inline — sin esto Deluge hace aritmética (`2026 - 01 - 31`) en vez de concatenar string.

- **F4 Ficha Empleado IMPLEMENTADO** ✅ — Función `Calendario52HTML.DevolverHTMLFichaEmpleado(int empId)` + página `Ficha_Empleado` (componentId: `4790826000001013095`) + variable de página `EmpNo` (Number, ⚠️ NO `ID` — palabra reservada en Zoho) + TAB permission al rol Gestor RRHH. Snippet: `<%{ empId_ = input.EmpNo; html_ = thisapp.Calendario52HTML.DevolverHTMLFichaEmpleado(empId_); %}<%=html_%><%}%>`. URL: `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Ficha_Empleado?EmpNo={empId}`. Verificado: muestra header nombre+empresa, pills EPI con colores por Estado, sección Próximas Semanas y Solicitudes Pendientes.

- **Roles y Permisos del portal COMPLETADO** ✅ — 6 roles creados + permisos configurados según Excel `ROLES EXCEL.xlsx`. Ver `memory/roles-permisos.md` para detalle completo (IDs, matriz de permisos, fixes aplicados). ProfileIds completos: USUARIO TRAB=`4790826000000171117`, RESPONSABLE CAE=`4790826000000171968`, Gestor RRHH=`4790826000000945001`, SUPER ADM=`4790826000000945003`, SUPERVISOR=`4790826000001016001`, OPERARIO CAE=`4790826000001016003`.

- **P1 Panel de Asignaciones IMPLEMENTADO Y VERIFICADO** ✅ — Función `Calendario52HTML.DevolverHTMLPanelAsignaciones()` (functionId: `4790826000001031061`) + página `Panel_de_Asignaciones` (componentId: `4790826000001031069`) + TAB permission a 5 roles RRHH (Gestor RRHH, RESPONSABLE CAE, SUPER ADM, SUPERVISOR, OPERARIO CAE). Vista centralizada de asignaciones técnico-cliente: 4 KPIs, filtros CSS-only (Todos/Con Problemas/Todo OK/Sin Técnicos), tarjetas por cliente con avatares de técnico. URL: `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Panel_de_Asignaciones`. Backup local: `deluge-drafts/DevolverHTMLPanelAsignaciones.deluge`. Bug CSS corregido: el IDE había guardado `class=\'pa\'` (backslash) → DOM recibía `class="'pa'"` → ningún selector CSS matcheaba. Fix: reinyección de función desde backup via `window._fc` chunked + `a.zc-dem-savescript`. ⚠️ Escribir SIEMPRE `class='pa'` (comillas planas) en strings Deluge. ⚠️ Para abrir el panel de permisos de un rol: Settings → Portal Del Cliente → Permisos → click nombre del rol en la TABLA (no via JS con className=''). El JS click en links vacíos dispara "Cambiar permiso" dialogs en la grid.

- **Respaldo SFTP IMPLEMENTADO** ✅ — Función `SubirDocumento.BackupDiarioDocumentos` + workflow `Backup_de_documentos_PRL` (scheduled). Sube documentos del formulario `Subir_Documento` al SFTP `192.168.70.15` (user: `sftpzoho`, conexión: `backup_sftp`). Lookback 48h (`zoho.currentdate.subDay(2)`). 3 carpetas: `/respaldo/documentos/trabajadores/`, `/respaldo/documentos/empresa/`, `/respaldo/documentos/sin_clasificar/`. ⚠️ Hay que crear las 3 carpetas en el servidor SFTP manualmente antes de la primera ejecución. ⚠️ Campos lookup se comparan con `0` (no `""`).

- **Chat Mensajes Empleado IMPLEMENTADO Y VERIFICADO** ✅ — Función `Calendario52HTML.DevolverHTMLChatEmpleado()` + página `Mis_Mensajes2` (componentId: `4790826000001017051`, pageFuncWfId: `4790826000001017069`) + TAB permission al rol USUARIO TRABAJADOR (Empleado). UI tipo WhatsApp verificada en portal: burbujas verdes para mensajes del empleado, blancas para respuestas RRHH con label "RRHH", botón "✉ Enviar nuevo mensaje". Snippet corregido (tenía `DevolverHTMLSemaforoCaducidades` del duplicado — cambiado a `DevolverHTMLChatEmpleado`). ⚠️ Páginas vacías `Mis_Mensajes` y `Mis_Mensajes1` existen en admin pero NO en portal del empleado (sin TAB permission). Eliminarlas manualmente en el IDE (Zoho bloquea clicks programáticos con `isTrusted:false` para delete).

- **Mark-as-read al abrir Chat RRHH IMPLEMENTADO** ✅ — `DevolverHTMLChatRRHH` actualizada (79 líneas): al ejecutarse, (1) marca `Le_do = "Leído"` en todos los `Mensaje[Tecnico == empId && Le_do != "Leído"]`, (2) resetea `Conversaci_n[T_cnico == empId].Mensajes_no_le_dos = 0`. Esto hace que el KPI "Mensajes Empleados" del Tablero RRHH (`criteria='Le_do != "Leído" || Le_do is null'`) y el badge de la página `Lista_Conversaciones` (usa `conv.Mensajes_no_le_dos`) se pongan a 0 al entrar en una conversación. El form `Mensaje` tiene campo `Le_do` (checkbox, valor "Leído"). El form `Conversaci_n` tiene campo `Mensajes_no_le_dos` (numérico).

- **Chat RRHH IMPLEMENTADO** ✅ — Función `Calendario52HTML.DevolverHTMLChatRRHH(int empId)` + página `Chat_RRHH` (componentId: `4790826000001017121`, duplicada de `Mis_Mensajes2`) + variable de página `TecnicoNo` (Number) + TAB permission a TODOS los roles RRHH (Gestor RRHH, RESPONSABLE CAE, SUPER ADMINISTRADOR, SUPERVISOR, OPERARIO CAE — NO USUARIO TRABAJADOR). Vista admin tipo WhatsApp: header con initials RRHH + "Mensajes con {tecNombre}", muestra todos los `Mensaje[Tecnico == empId]`, footer "Responder" → `#Form:Mensaje?Tecnico={empId}&Es_Respuesta=SI`. URL: `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Chat_RRHH?TecnicoNo={empId}`. Snippet: `<%{ tecId_ = input.TecnicoNo; html_ = thisapp.Calendario52HTML.DevolverHTMLChatRRHH(tecId_); %}<%=html_%><%}%>`. El autor de cada mensaje se muestra dinámicamente desde `Nuevo_Empleado[ID == autor].Nombre` (fallback "RRHH" si autor==0).

- **Workflow Abrir_Historial_de_Conver ACTUALIZADO** ✅ — Script 1 modificado: de `tecnico=Nuevo_Empleado[ID==input.T_cnico]; url="#Report:Mensajes_de_Empleados?Tecnico="+tecnico.Nombre.last_name` a `url="#Page:Chat_RRHH?TecnicoNo="+input.T_cnico`. Al hacer clic en una fila del reporte `Conversaci_n_Report` ahora navega directamente a la página Chat_RRHH con el ID del técnico. Script 2 (marcar mensajes como leídos) no modificado.

- **Sprint mejoras UX COMPLETADO** ✅ — A3 (filtro empleado + semana actual en Semanas_Nuevo), C2 (renombrado `Listado_Empleados_Salario` → "Listado Empleados (Salarios)"), C3 (renombrado `Announcements` → "Anuncios"), C4 (corregido typo "Portal del Emplealdo" → "Portal del Empleado"), C5 (KPIs clicables Tablero RRHH ya estaban hechos).
- **E1 Mis EPIs IMPLEMENTADO** ✅ — Función `Calendario52HTML.DevolverHTMLMisEPIs()` (ID `4790826000001026043`) + página `Mis_EPIs`. Tabla con badges de tipo (EPI=azul, ROPA=morado, HERRAMIENTA=verde) y estado (Entregado/Confirmado=verde, Rechazado=rojo, Aprobado/Gestionandose=naranja, resto=gris). Botón "+ Nueva Solicitud" → `#Form:Solicitud_de_EPIs_Herramientas`. ⚠️ Usa `cnt_` counter en vez de `.size()` — ver nota abajo.
- **E2 Mis Permisos IMPLEMENTADO** ✅ — Función `Calendario52HTML.DevolverHTMLMisPermisos()` (ID `4790826000001026049`) + página `Mis_Permisos`. Tabla con estado (SI=verde, NO=rojo, Sin Respuesta=gris). Botón "+ Nueva Solicitud" → `#Form:Solicitud`. ⚠️ Usa `cnt_` counter en vez de `.size()`.

- **Menu Builder (Generador de Menús) COMPLETAMENTE EXPLORADO** ✅ — API de guardado capturada y verificada: `reorderComponent` POST (incremental, auto-triggered on drag) + `saveAppMenuStructure` (full atomic save). Move programático probado: DOM move + `$(workarea).sortable('option','update').call(...)` → XHR `reorderComponent` → `{"status":"success"}`. 8 objetos globales JS (`AppNavigator`, `AppNavigatorUrls`, etc.). Direct API call también funciona. Ver `memory/menu-builder.md`.

- **Workflow `Actualizar_Conversacion_En_Mensaje` IMPLEMENTADO** ✅ — Form: `Mensaje`, trigger: Creado → Envío de formulario correcto. Script: `for each conv in Conversaci_n[T_cnico == input.Tecnico] { conv.ltimo_Mensaje = input.ID; }`. Nota: campo en `Mensaje` se llama `Tecnico` (sin acento), campo en `Conversaci_n` se llama `T_cnico` (é→_). Nota 2: batch-update inline `Form[criteria].ltimo_Mensaje = x` falla con "Improper Statement Error" porque `ltimo_` empieza con minúscula — usar `for each` loop.

- **Bug fix `DevolverHTMLListaConversaciones` línea 78** ✅ — `c = tecId % 8` → `c = ifnull(tecId, 0).toLong() % 8`. Causa: registros `Conversaci_n` sin `T_cnico` asignado devuelven `null`, y `null % 8` lanzaba "mod operation mismatch of data type expressions".

- **Mark-as-read IMPLEMENTADO y BUG CORREGIDO** ✅ — `DevolverHTMLChatRRHH` actualizada (2 bugs): (1) Query `Mensaje[Tecnico==empId && Le_do != "Leído"]` NO capturaba registros con `Le_do=null` — fix: iterar `Mensaje[Tecnico==empId]` completo + `if(unread.Le_do != "Leído")` dentro del loop (Deluge if-condition sí evalúa null como `true`, query filter no). (2) `Nuevo_Empleado[ID==empId]` retorna empty set y `tecRec.ID == null` lanzaba "empty set and values cannot be retrieved" — fix: `empId==0` guard + counter loop `empFound=0; for each tr in Form[crit]{ tecRec=tr; empFound=1; break; } if(empFound==0){ return error; }`. ⚠️ `Form[ID==x].Field` sobre empty set SIEMPRE lanza excepción — nunca acceder campos directamente sin counter guard.

- **Página `Clientes_Doc` IMPLEMENTADA** ✅ — Función `Calendario52HTML.DevolverHTMLClientesDoc()` (functionId: `4790826000001031003`) + página `Clientes_Doc` (componentId: `4790826000001031011`) + TAB permission a roles RRHH. Cards color-coded, 8 KPIs, filtros CSS-only. Botón "Ver Docs" → `#Page:Documentaci_n_del_Cliente?ClienteID={id}` ✅ (actualizado). URL: `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Clientes_Doc`. Backup local: `D:/Sicma21/2026/zoho-mcp/clientes-doc-function.deluge`.

- **`Clientes_Doc` embebido en `Tablero_PRL` COMPLETADO** ✅ — Snippet `Clientes_Doc_Html2` (htmlViewId: `4790826000001031053`, workflowid: `4790826000001031055`) embebido como `row_6` en `Tablero_PRL`. Verificado en portal: 122 clientes, 139 cards renderizadas, filtros funcionales. ⚠️ PATRÓN CRÍTICO para embed HTML Snippet en Page Builder vía API: (1) llamar `storeFunction` con `scripttype=htmlpageadd&parentPageId=BuilderConstants.pageComponentId` → obtener `htmlViewId`; (2) INMEDIATAMENTE llamar `updateTemplateContent` con el ZML+`<dsp>` Y con `newElemType=html_snippet` en el POST body. Ambas llamadas deben ocurrir en la misma sesión del browser. Sin `newElemType=html_snippet`, `updateTemplateContent` devuelve `{"status":"Failed!"}`. El `storeFunction` de sesiones anteriores no vale (el server lo invalida). Ver `memory/page-builder-snippet-pattern.md`.

- **`Documentaci_n_del_Cliente` REDISEÑADA** ✅ — Función `Calendario52HTML.DevolverHTMLDocCliente(int clienteId)` (ID `4790826000001028043`) + snippet `DocClienteHtml` (htmlViewId: `4790826000001028053`). Página rediseñada desde cero: 6 KPIs color-coded, 2 semáforos (Caducidad + Envío), barra de progreso, tablas agrupadas (Empresa + Trabajador sub-agrupado por nombre). Backup local: `deluge-drafts/DevolverHTMLDocCliente.deluge`. Bugs corregidos: (1) `clienteId.toLong()` en queries; (2) `d.Documento != null` → flag int (lookup devuelve bigint, no string); (3) `d.Plantilla != null` guard antes de `.Nombre_de_la_plantilla`; (4) `d.Caducidad_Tolerancia != null` antes de `.toString()`. API de actualización: `populateCustomFunction` con `scripttype=workflowmodify` + `functionid`.

- **Página `Configuracion_General` IMPLEMENTADA** ✅ — Función `Configuracion.MostrarConfiguracion()` + página `Configuracion_General` (componentId: `4790826000001029132`, duplicada de `Ficha_Empleado`). Panel HTML con 7 secciones (Caducidad Docs, Asignación Técnico-Cliente, Solicitudes EPI, Solicitudes Permisos, Mensajes RRHH, Bienvenida Trabajadores, Integración WhatsApp). Badges verdes/rojos/grises por estado. Botón "Editar" usa `#Form:Configuraci_n_General?recLinkID={recordId}&viewLinkName=Configuraci_n_General_Report` (abre directamente en modo edición). TAB permission para 5 roles admin (NO USUARIO TRABAJADOR). URL: `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Configuracion_General`.

- **Manual de usuario COMPLETO** ✅ — 4 módulos + índice en `docs/manual/`: A (Portal Empleado, 8 secciones), B (Panel RRHH, 14 secciones), C (PRL/CAE, 8 secciones), D (Administración, 10 secciones). Índice por perfil (Empleado, Gestor RRHH, Gestor PRL, Administrador). 30+ screenshots en `docs/manual/img/`.
- **Task 3 Mis_Activos IMPLEMENTADO** ✅ — Función `Calendario52HTML.DevolverHTMLMisActivos()` + página `Mis_Activos` (componentId: `4790826000001028147`, duplicada de `Inventario_EPI`) + TAB permission al rol USUARIO TRABAJADOR (profileId: `4790826000000171117`). Muestra activos con `Estado=="Activa"` filtrados por `Trabajador.Mail_Portal_Empleado == zoho.loginuserid`. Badges tipo (EPI=azul, ROPA=morado, HERR=verde) + unidades + serie + fecha desde. Empty state + botón "+ Solicitar EPI / Herramienta". Verificado en portal: renders correctamente. URL: `#Page:Mis_Activos`.

- **N8 Notificar Solicitud Permiso a RRHH IMPLEMENTADO** ✅ — Workflow `Notificar_Solicitud_Permi` en form `Solicitud` (Nueva Solicitud Permiso). Trigger: Creado → Envío de formulario correcto. Gateado por `config.Notificar_nuevas_solicitudes_a_personal_correspondiente == "Activado"`. Canales: push (`zoho.pushNotification`), WhatsApp (`thisapp.NuevoEmpleado.whatsapp`), email HTML inline con header `#1C3A5E` + tabla + CTA + footer. Destinatarios: `config.Personal_a_Notificar_Solicitudes_de_Permisos` (deduplicado por `Official_Email`, `Correo_Electr_nico`, `Mail_Portal_Empleado`). Canales controlados por `config.V_as_de_Notificaci_n1`. Bug evitado: campo `Observaciones` no existe en form `Solicitud` — eliminado del script. Backup local: `deluge-drafts/SolicitudPermiso-NotificarSolicitudPermisoARRHH.deluge`. IDs: `Notificar_Solicitud_Permi`, 1 Acción, 27-03-2026.

## ▶ Próxima sesión — continuar aquí

**Pendiente (manual / no automatizable):**
- Eliminar páginas vacías: `Mis_Mensajes` y `Mis_Mensajes1` — App IDE → click real "Más" → "Eliminar" (requiere `isTrusted:true`)
- Crear 3 carpetas SFTP `192.168.70.15`: `/respaldo/documentos/{trabajadores,empresa,sin_clasificar}/`

**Próximo sprint:** E3 (dashboard empleado mejorado), R1 (kanban RRHH solicitudes pendientes)
**Notificaciones: TODAS DESPLEGADAS** ✅ — Las 4 funciones en `deluge-drafts/` ya estaban desplegadas con HTML corporativo + WhatsApp + push: `NotificarCambioSolicitudEPI`, `NotificarSolicitudEPI`, `EnviarMailBienvenida`, `ActualizarEstadosRequisitos` (bug fix caducados ya aplicado). Los drafts locales son referencias históricas, NO pendientes.

## IDE Navigation (Playwright)
- Form editor: `https://creator.zoho.com/appbuilder/formacion11/{app}/form/{form_link_name}/edit`
- Workflow editor: `https://creator.zoho.com/appbuilder/formacion11/{app}/workflowbuilder/{wf_link_name}/edit`
- Workflow list: `https://creator.zoho.com/appbuilder/formacion11/{app}/workflow/edit`
- **App IDE**: `https://creator.zoho.com/appbuilder/formacion11/{app}/settings/edit#applicationide`
- Always navigate by direct URL — never click through the UI to reach a form/workflow
- Wait ~10s after navigate for the editor to load
- IDE uses an iframe in Constructor mode (Playwright captures it automatically with `browser_snapshot`)
- **Pointer intercept**: Zoho overlays block Playwright clicks → use `browser_evaluate` + `.click()` via JS
- **Link names with accents**: Zoho auto-encodes tildes (é/í → `_f`); always fix manually via JS value assignment
- **Abrir form en modo edición (recLinkID)**: `#Form:{form_link_name}?recLinkID={recordId}&viewLinkName={report_link_name}` — abre el registro en modo edición. Es el patrón que usa el action "Edit" nativo de Zoho en reportes (`action > on click > Edit`).
- **Saving (form/workflow builder)**: click "Listo" link, NOT Ctrl+S
- **Saving ZML in App IDE**: click `a.zc-dem-savescript` ("Guardar"). ⚠️ ANTES de guardar: tras `setValue()`, CodeMirror queda como clean → forzar dirty con `replaceRange(lastChar, ...)` o el XHR no se dispara. El endpoint `/validatePageZML` valida+guarda en una sola llamada para páginas — si `isValid:true`, el contenido fue guardado. `cm.isClean()` permanece `false` y el toast desaparece en <1s: ambos son indicadores NO fiables. **Verificar**: navegar a otra página en el árbol IDE y volver — el CodeMirror recarga desde servidor.
- **App runner URL para preview como admin**: `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:{page_link_name}`. Las URLs `/portal/...` y `/appbuilder/.../page/...` dan 403 al admin.
- **ZML `padding` attr**: solo acepta un valor (`padding='15px'`), NO shorthand CSS (`padding='10px 20px'` → error de validación al guardar).
- **ZML `action` attr en `<pc>`**: valores válidos: `OpenURL, OpenForm, OpenReport, OpenPage, ExecuteFunction, Link, Form, Report, Page, Function, Share, CustomAction`. Para abrir formulario de alta usar `action='OpenForm'`. ❌ `AddRecord` NO es válido.
- **ZML `<report>` embed**: `criteriaString` usa XML-encoded operators: `&amp;&amp;` para `&&`, `&quot;` para `"`, `&gt;` para `>=`. ⚠️ `zoho.loginuserid` en `criteriaString=` de embed NO se evalúa — queda como literal. `zoho.currentdate` pendiente verificar. Solución correcta: poner el filtro en la definición nativa del reporte `[Campo == zoho.loginuserid]` (igual que `Mensaje_Report`). `zoho.loginuserid` SÍ funciona en filtros nativos de reporte y en `criteria=` de `<text type='Form Data'>`.
- **Verificar contenido portal**: `fullPage:true` en screenshot NO captura iframes lazy de Zoho. Usar `document.body.innerText` para confirmar que secciones están en el DOM.
- **KPI Form Data + usuario logueado**: `zoho.loginuserid` SÍ se evalúa en `criteria=` de text `type='Form Data'` en ZML en runtime del portal. Patrón correcto: `criteria='Campo.Mail_Portal_Empleado == zoho.loginuserid'`. ⚠️ TRAMPA: variables de página como `"${LoginEmail}"` NO funcionan — Zoho las sustituye en tiempo de diseño con el email del admin (string literal fijo).
- **Page Builder — añadir variable**: abrir panel `.zc-pb-script-variables` → botón `button[text="Agregar nuevo"]` (clase `zc-dem-btn`) → diálogo: `textbox[placeholder="Enter variable name"]` + click Select2 link + opción del listbox + botón "Agregar"
- **Chrome/Playwright conflict**: Si Chrome ya está abierto con el perfil de Playwright, el lanzamiento falla ("Abriendo en una sesión existente"). Solución: cerrar Chrome completamente antes de usar Playwright.
- **App IDE árbol — click correcto**: usar `a.zc-dem-box-sizing` (sidebar tree items). El elemento `a.zc-comp-link.zc-common-page` navega fuera al preview de la página — NO lo uses.
- **App IDE árbol — display names de páginas**: el árbol muestra el display name, NO el link name. Página `Inicio` (link) → `"Tablero Inicio"` en el árbol. Buscar siempre por display name.
- **Portal SPA — refrescar cambios ZML**: navegar a `#Page:Inicio` en el mismo tab no recarga el ZML del servidor. Usar `location.reload(true)` para forzar hard reload completo.
- **SPA hash navigation unreliable con `goto()`**: `page.goto()` con solo cambio de hash (`#Report:X` → `#Page:Y`) a veces NO navega (título cambia pero contenido queda). Workaround: llamar `goto()` dos veces o usar `location.href = url` via `browser_evaluate`.
- Field picker in workflow actions uses **Select2** (`#s2id_showHideField`) — click options from dropdown to add chips

## Seguridad al crear reportes/formularios nuevos

**Proceso recomendado (2 pasos)**:
1. Crear el reporte/formulario vía UI de Zoho Creator → verificar que carga y muestra datos correctos
2. Solo entonces actualizar el ZML/referencias para usarlo en el portal

**Por analizar**: si el cambio ZML es solo cambiar un `linkName` (una línea), el riesgo real es mínimo — rollback inmediato en App IDE. Para cambios ZML de una sola línea puede ser más rápido ir directo, siempre que el nombre del nuevo componente esté verificado.

**Rollback siempre disponible**: App IDE → revertir `linkName` al original. No hay riesgo de pérdida de datos, solo de página no cargando.

## Portal Permissions API (programmatic)

- **Endpoint**: `POST /appbuilder/{owner}/{app}/usersandpermissions/edit/updatePermissionSet`
- **Key params**: `permissionSetName`, `userType=2`, `actionStatus=UPDATE`, `profileId`, `permissionJson`, `reportActionPerms`, `zccpn` (CSRF token)
- **`reportActionPerms`**: `{"view": ["reportId1", "reportId2", ...]}` — lista de report IDs accesibles al rol
- **`permissionJson.ProfilePermission`**: `{"componentId": ["add","viewall",...], ...}` — permisos de formulario
- **profileId de rol Empleado**: `4790826000000171117`
- **Para mostrar registros de RRHH a empleados (no propietarios)** — PATRÓN CRÍTICO:
  1. Añadir `reportId` a `reportActionPerms.view` (dar acceso al reporte)
  2. Añadir `["viewall"]` al **form** ID en `ProfilePermission` — sin esto, el portal solo muestra registros que el empleado CREÓ (ownership model). Los registros creados por RRHH son invisibles aunque el filtro nativo sea correcto.
  3. El filtro nativo del reporte restringe qué filas ve cada empleado → vista filtrada para cada uno
- **Cómo capturar el CSRF + body completo**: interceptar XHR al hacer click en "Actualizar" en el editor de permisos:
  ```js
  window._saveReqs = [];
  const o = XMLHttpRequest.prototype.open, s = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(m,u,...a){this._u=u;this._m=m;return o.call(this,m,u,...a)};
  XMLHttpRequest.prototype.send = function(b){if(this._u?.includes('updatePermission'))window._saveReqs.push({url:this._u,body:b});return s.call(this,b)};
  ```
  Luego relanzar con body modificado: `fetch(url, {method:'POST', headers:{...}, credentials:'include', body: modifiedBody})`
- **Encontrar component ID de un reporte**: en HTML de `/report/{link_name}/edit`, buscar `"link_name":"{link_name}"` → la clave `"id"` adyacente es el componentId
- **Navegar al editor de permisos** (Playwright):
  1. `browser_navigate` → `settings/edit#portal`
  2. Esperar 2s → `document.querySelector('#settings-portal-href').click()`
  3. Esperar 1.5s → `document.querySelector('#portalTab a#profiles').click()` (tab Permisos)
  4. Esperar 1.5s → `document.querySelector('a.zc-edit-permission[permissionset]').click()`
  5. Esperar 2s → tabla cargada (268 filas con `.zc-share-td-txt`)
  6. Submit: `#portalContent input[type=submit][value="Actualizar"]`
  7. Señal de éxito: página vuelve a la lista (edit buttons reaparecen) — el toast desaparece muy rápido
- **Checkboxes en el editor**: form-level usan `id="compId_PERM"` (guión bajo); VIEW de reportes usan `id="reportId-VIEW"` (guión). Para uncheckar por JS: `document.getElementById('id-VIEW')` (querySelector falla con `-` en IDs)
- **Páginas — permiso TAB**: Las páginas usan permiso `TAB` (no VIEW). Checkbox id: `{componentId}_TAB`. Las páginas nuevas (creadas vía "Duplicar") empiezan con TAB=false en TODOS los roles — hay que activarlo explícitamente para el rol que debe verla. Encontrar component ID: buscar la fila en el editor de permisos con `Array.from(document.querySelectorAll('tr')).find(r => r.textContent.includes('Nombre Página'))` → el input `id` de esa fila tiene el patrón `{componentId}_TAB`.
- **Nueva UI de permisos (2026)**: El selector `a.zc-edit-permission[permissionset]` ya NO existe. Ahora el tab "Permisos" muestra una tabla con filas clickeables (`a.zc-custom-dropdown-header`). Haciendo click en el nombre del rol ("Gestor RRHH") carga la tabla completa de checkboxes (~1176). Flujo: navigate a `settings/edit` → click "Portal del cliente" → esperar carga → click tab "Permisos" → click nombre del rol → esperar 2s → tabla con checkboxes disponible → submit con `#portalContent input[type=submit][value="Actualizar"]`.
- **Palabra reservada `ID` en Page Builder**: `ID` es el nombre del campo primario en todo record de Zoho. No puede usarse como nombre de variable de página — da error "'ID' es una palabra restringida". Usar nombres alternativos: `EmpNo`, `EmpId`, `RecordId`, etc.
- **Varios VIEW reports**: cuando hay >1 report en `reportActionPerms.view` para un form, el link muestra "X Informes" (no el nombre). Click abre dropdown con checkboxes individuales.

## Guardar funciones custom Deluge

- **URL correcta**: `https://creator.zoho.com/appbuilder/formacion11/{app}/customFunction/{Namespace.FunctionName}/edit`
- **Guardar y Ejecutar son SIEMPRE `INPUT`, no `<button>`**: `document.getElementById('saveFuncBtn').click()` / `document.getElementById('executeFuncBtn').click()`. ⚠️ `querySelectorAll('button')` NO los encuentra — el editor de funciones usa `INPUT[type=button]` siempre (no solo tras errores). ⚠️ `Ctrl+S` NO guarda de forma fiable.
- **Flujo correcto vía Playwright**: `cm.setValue(c)` → dirty trick → `document.getElementById('saveFuncBtn').click()` → esperar toast "Guardado"
- **Dirty trick correcto**: `cm.replaceRange(' ', {line:0,ch:0}); cm.replaceRange('', {line:0,ch:0}, {line:0,ch:1})` — inserta y elimina un espacio al inicio. ⚠️ `replaceRange('x',{line:ll,ch:ll_len})` + `replaceRange('',{line:ll,ch:ll_len})` NO funciona: el segundo `replaceRange` sin `to` es un insert vacío (no-op), dejando `}x` al final → error "Reached end of function block".
- **Ejecutar (test run) con parámetros**: `document.getElementById('executeFuncBtn').click()` → diálogo con `textarea[name="args-{paramName}"]` por cada argumento. Params de tipo `List`: valores separados por coma. Submit: `document.getElementById('proceedBtn').click()`. Resultado en `.zc-dem-execute-success` (status) y `.zc-dem-execute-script-result` (log completo con URLs de llamadas externas).
- **Email HTML vía `sendmail`**: `sendmail [ message: htmlString ]` sí acepta HTML completo. `FuncionesEstaticas.Notificacion` solo envía plain-text — para emails con formato usar `sendmail` directamente.
- **App IDE `a.zc-dem-savescript`**: dispara XHR a `/applicationide/custom_functions/.../save` y SÍ actualiza el runtime para funciones con namespace (confirmado: portal renderizó CSS correcto tras guardado). ⚠️ El exportScript puede seguir mostrando el código anterior (discrepancia conocida entre App IDE y workflow editor), pero el runtime usa la versión guardada via App IDE.
- ⚠️ **`Name` sub-fields**: no encadenar directamente `Lookup[criteria].Name.last_name` — falla con "not of type Lookup". Usar variable intermedia: `rec = Lookup[criteria]; val = rec.Name.last_name;`
- ⚠️ **Zoho elimina `<script>`** de salida de funciones en HTML Snippets (XSS prevention). Usar puro Deluge para generar HTML; NO usar patrón híbrido Deluge+JS que inyecte `<script>`.
- Llegar al editor: Workflow list → tab "Funciones" → click en nombre de la función
- Alternativa URL: `https://creator.zoho.com/appbuilder/formacion11/{app}/workflow/edit#Functions`

## Leer código fuente Deluge (3 métodos)
1. **exportScript** (más rápido): `fetch('/appbuilder/formacion11/{app}/exportScript', {credentials:'include'})` → archivo `.ds` de 2.2MB con TODO el código. Descarga automática a `.playwright-mcp/`
2. **Workflow editor** (`/workflowbuilder/{link}/edit`): click en "Deluge script" → CodeMirror carga en ~15s → leer con `.querySelector('.CodeMirror').CodeMirror.getValue()`
3. **App IDE** (`settings/edit#applicationide`): árbol virtual con Formatos/Páginas/Programas/Funciones — navegar con `ZCScrollable[8].scrollTop + a.zc-dem-box-sizing.click()`; funciones tienen prefijo "Deluge" en el árbol
- Details: see `memory/zoho-ide.md`

## Referencias rápidas
- [Roles y permisos del portal](roles-permisos.md) — 6 roles, profileIds, matriz Excel, component IDs de páginas/formularios, técnica de modificación programática
- [Menú sidebar completo](app-menu-structure.md) — RRHH (22 items) + PRL (16 items) con display names y hash URLs

## APIs de renombrado (Zoho Builder — sin UI)

### Renombrar displayName de un reporte
```
POST /appbuilder/{owner}/{app}/report/{linkName}/edit/renameView
Body: viewDisplayName={newName}&zccpn={csrfFromCookie}
Response: {newName} (texto plano, HTML-encoded)
```

### Renombrar displayName de un space (módulo de navegación)
```
POST /appbuilder/{owner}/{app}/appmenu/edit/renameAppDeviceSpace
Body: appDeviceSpaceId={id}&appDeviceSpaceName={newName}&deviceType={1}&zccpn={csrfFromCookie}
Response: {"response":{"appDeviceSpaceLinkName":"..."},"status":"success"}
```
- Space IDs: `AppNavigator.appNavigatorSpaces` (array con `{id, name}`) — disponible en la página del constructor
- Space IDs conocidos: RRHH=`4790826000000022779`, PRL=`4790826000000069001`, Portal del Empleado=`4790826000000112063`
- El CSRF token `zccpn` está en `document.cookie` (key `zccpn=`)

### Cómo funciona iCustomizePopup (popup renombrar en Builder)
- El div `#renameReport` en el DOM es solo una PLANTILLA — NO tiene botón de submit
- `$.fn.renameReport` llama a `iCustomizePopup({body, buttons:[{name:ZCButton.RENAME, type:MODAL_SUBMIT}], success: fn})`
- Al confirmar, `success()` llama a `ReportBuilder.renameReportDispName(newName)` → POST `/edit/renameView`
- Para automatizar: llamar directamente al endpoint de renombrado sin pasar por el popup

## Feedback
- [Copia antes/después de cambios](feedback_copies_before_after.md) — Exportar código antes de aplicar cambios, verificar después
- [Deluge int+string concat](feedback_deluge_int_string_concat.md) — `int anio + "-mm-dd"` puede hacer aritmética; usar `anio.toString()` primero
- [Portal permissions tab click](feedback_portal_permissions_click.md) — Tab "Permisos" requiere `browser_click` con ref real (no JS programático). Navegar sin `#portal` y esperar 10s para que el snapshot sea accesible.
- [Zoho trusted events](feedback_zoho_trusted_events.md) — Delete en App IDE requiere `isTrusted:true` (click real del usuario). JS programático silenciosamente ignorado.

## Editar script de página (Page Builder)
- App IDE solo muestra ZML para páginas, NO el script Deluge
- Para editar script: navegar a `/pagebuilder/{page_link_name}/edit`
- Abrir panel script: `document.querySelector('.zc-pb-script-variables').click()`
- Pestaña "Secuencia de comandos" → esperar ~8s → CodeMirror disponible
- **Guardar page script**: botón "Guardar" en el panel de script → XHR a `/pagebuilder/{page}/function/save` → response `{"status":"success","pageFuncWfId":"..."}`. Luego click "Listo" (toolbar `#builder-close`) → URL cambia a `/page/{page}/edit`.
- ⚠️ **`cm.isClean()` NO es indicador fiable** del guardado de page scripts — permanece `true` incluso tras `setValue()`+`replaceRange()`. Verificar por el XHR response.
- Details: see `memory/zoho-ide.md` sección "Páginas (ZML) — Edición de script de página"

## HTML Snippets en páginas (Page Builder)
- Cada HTML Snippet tiene su propio código Deluge, **independiente** del page script. Acceder via botón "Configurar" en el componente dentro de Page Builder.
- Sintaxis JSP-like: `<%{ deluge_code %><%=variable%><%}%>`
- **Los HTML Snippets SÍ pueden llamar funciones custom**: `thisapp.Namespace.FunctionName(args)`. Los page scripts NO pueden — error "Calling a custom function is not supported in page script".
- Al duplicar una página, el código del HTML Snippet se copia verbatim de la original — hay que actualizarlo manualmente si la lógica debe cambiar.
- **Múltiples instancias CodeMirror**: cuando el panel de script y el diálogo Configurar están abiertos simultáneamente, hay 3 CMs (`querySelectorAll('.CodeMirror')`). Index [0] NO es fiable. Identificar el correcto por `lineCount()` o por la clase `codemirror-div` del snippet editor.
- Guardar: botón "Guardar" en el diálogo Configurar (toast "Guardado"). Luego Escape para cerrar diálogo (el overlay bloquea clicks fuera) → después click "Listo" toolbar.
- **Patrón correcto para páginas con custom functions**: poner lógica en función custom Deluge → llamarla desde el HTML Snippet (`thisapp.Namespace.Fn(args)`). El page script puede computar variables de página (`input.Var`) pero NO puede renderizar HTML via custom functions.
