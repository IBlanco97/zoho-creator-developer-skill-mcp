# zoho-app — Zoho Creator Source Backups

Local backups of deployed Zoho Creator code for `human-resource-management`.
These files are reference copies — the live source of truth is the Zoho App IDE.

## Structure

```
zoho-app/
├── functions/
│   ├── Calendario52HTML/     # HTML dashboard functions (DevolverHTML*)
│   ├── Candidatos/           # Zoho Recruit — búsqueda candidatos cercanos
│   ├── Configuracion/        # MostrarConfiguracion panel
│   ├── NotificacionesMail/   # Email/WhatsApp notification helpers
│   └── SubirDocumento/       # SFTP backup function
├── pages/
│   └── Inicio/               # Página de inicio (ZML template + on-load script)
└── workflows/
    ├── encuestas/            # Encuestas internas (W1, W2, W4)
    └── notificaciones/       # All notification workflows
```

## Deployed Functions — Calendario52HTML namespace

| Function | Page | Roles |
|----------|------|-------|
| DevolverHTMLDashboardEmpleado | Dashboard_Empleado | USUARIO TRABAJADOR |
| DevolverHTMLMisEPIs* | Mis_EPIs | USUARIO TRABAJADOR |
| DevolverHTMLMisPermisos* | Mis_Permisos | USUARIO TRABAJADOR |
| DevolverHTMLMisActivos* | Mis_Activos | USUARIO TRABAJADOR |
| DevolverHTMLMisFormaciones | Mis_Formaciones | USUARIO TRABAJADOR |
| DevolverHTMLChatEmpleado* | Mis_Mensajes2 | USUARIO TRABAJADOR |
| DevolverHTMLChatRRHH* | Chat_RRHH | Gestor RRHH + admin roles |
| DevolverHTMLListaConversaciones* | Lista_Conversaciones | Gestor RRHH + admin roles |
| DevolverHTMLTableroPRL | Tablero_PRL | Gestor RRHH + CAE roles |
| DevolverHTMLTableroFormaciones | Tablero_Formaciones | Gestor RRHH, SUPER ADM, SUPERVISOR |
| DevolverHTMLSemaforoCaducidades | Semaforo_Caducidades_EPI | Gestor RRHH + admin roles |
| DevolverHTMLTimelinePermisos* | Timeline_Permisos | Gestor RRHH + admin roles |
| DevolverHTMLFichaEmpleado* | Ficha_Empleado | Gestor RRHH + admin roles |
| DevolverHTMLPanelAsignaciones | Panel_de_Asignaciones | Gestor RRHH + admin roles |
| DevolverHTMLClientesDoc | Clientes_Doc | Gestor RRHH + admin roles |
| DevolverHTMLDocCliente | Documentacion_del_Cliente | Gestor RRHH + admin roles |
| DevolverHTMLTableroFlota | Tablero_Flota | Gestor RRHH + admin roles |
| DevolverHTMLHistorialSolicitudesEPI | Historial_Solicitudes_EPI | Gestor RRHH + admin roles |
| DevolverHTMLEncuestasAdmin | Tablero_Encuestas | Gestor RRHH + admin roles |
| DevolverHTMLMisEncuestas | Mis_Encuestas | USUARIO TRABAJADOR |
| DevolverHTMLResultadosEI | Resultados_EI | Gestor RRHH + admin roles |
| Configuracion.MostrarConfiguracion* | Configuracion_General | Admin roles only |

`*` = deployed but no local backup in this folder (draft not exported)

## Role IDs

| Role | profileId |
|------|-----------|
| USUARIO TRABAJADOR | 4790826000000171117 |
| RESPONSABLE CAE | 4790826000000171968 |
| Gestor RRHH | 4790826000000945001 |
| SUPER ADMINISTRADOR | 4790826000000945003 |
| SUPERVISOR | 4790826000001016001 |
| OPERARIO CAE | 4790826000001016003 |
