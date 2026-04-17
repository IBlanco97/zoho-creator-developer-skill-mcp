# Workflows

Tabla resumen de todos los workflows de la aplicación.

| Workflow | Link Name | Form/Trigger | Tipo | Estado | Documentado |
|----------|-----------|-------------|------|--------|-------------|
| [Enviar Reporte STOP2 Semanal](Enviar_Reporte_STOP2_Semanal.md) | `Enviar_Reporte_STOP2_Sema` | Scheduled (lunes 09:00) | Programa | Deshabilitado | ✅ |
| [W1 Poblar Subform](W1_PoblarSubform.md) | `W1_PoblarSubform` | `Respuesta_EI` on load | On Load | Habilitado | ✅ |
| [W2 Crear Completada EI](W2_CrearCompletada_EI.md) | `W2_CrearCompletada_EI` | `Respuesta_EI` on submit | On Submit | Habilitado | ✅ |
| [W4 Actualizar Contador](W4_ActualizarContador.md) | `W4_ActualizarContador` | `Pregunta_EI` on add/delete | On Submit | Habilitado | ✅ |
| [Notificar Solicitud Permiso](Notificar_Solicitud_Permi.md) | `Notificar_Solicitud_Permi` | `Solicitud` on submit | On Submit | Habilitado | ✅ |
| [Actualizar Conversación](Actualizar_Conversacion_En_Mensaje.md) | `Actualizar_Conversacion_En_Mensaje` | `Mensaje` on submit | On Submit | Habilitado | ✅ |
| [Abrir Historial Conversación](Abrir_Historial_de_Conver.md) | `Abrir_Historial_de_Conver` | `Conversaci_n` acción reporte | Acción | Habilitado | ✅ |
| [Backup Documentos PRL](Backup_de_documentos_PRL.md) | `Backup_de_documentos_PRL` | Scheduled (diario) | Programa | Habilitado | ✅ |

> Se irá completando workflow por workflow en archivos individuales.
> Plantilla: ver `_template.md` en esta carpeta.
