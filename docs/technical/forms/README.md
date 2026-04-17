# Formularios

Tabla resumen de todos los formularios de la aplicación.

| Formulario | Link Name | Módulo | Campos clave | Lookups | Documentado |
|-----------|-----------|--------|-------------|---------|-------------|
| [STOP2 Análisis Previo](STOP2_Analisis_Previo.md) | `STOP2_Analisis_Previo` | STOP2 | 22 Decision Box + Empleado, Cliente, OT, Observaciones, Fecha | Empleado→Nuevo_Empleado, Cliente→Nuevo_Cliente | ✅ |
| [Encuesta Interna](Encuesta_Interna.md) | `Encuesta_Interna` | Encuestas | Titulo, Descripcion, Estado_EI, Num_Preguntas | — | ✅ |
| [Pregunta EI](Pregunta_EI.md) | `Pregunta_EI` | Encuestas | Texto_Pregunta, Tipo_Pregunta, Orden | Encuesta_EI→Encuesta_Interna | ✅ |
| [Respuesta EI](Respuesta_EI.md) | `Respuesta_EI` | Encuestas | Subform Detalle_Respuesta_EI (5 campos) | Encuesta_EI_Resp→Encuesta_Interna | ✅ |
| [Completada EI](Completada_EI.md) | `Completada_EI` | Encuestas | Email_Empleado_CE, Encuesta_EI_CE | Encuesta_EI_CE→Encuesta_Interna | ✅ |
| [Nuevo Empleado](Nuevo_Empleado.md) | `Nuevo_Empleado` | RRHH Core | Nombre, Official_Email, Mail_Portal_Empleado | Destino de muchos lookups | ✅ |
| [Solicitud](Solicitud.md) | `Solicitud` | RRHH Permisos | Trabajador_Solicitante, Tipo, Fechas, Observaciones | Trabajador→Nuevo_Empleado | ✅ |
| [Mensaje](Mensaje.md) | `Mensaje` | RRHH Mensajería | Tecnico, Es_Respuesta, Le_do, Contenido | Tecnico→Nuevo_Empleado | ✅ |
| [Conversación](Conversacion.md) | `Conversaci_n` | RRHH Mensajería | T_cnico, Mensajes_no_le_dos, ltimo_Mensaje | T_cnico→Nuevo_Empleado | ✅ |
| [Subir Documento](Subir_Documento.md) | `Subir_Documento` | PRL/CAE | Documento, Trabajador, Plantilla, Estado, Caducidad | Trabajador→Nuevo_Empleado, Plantilla→Plantilla | ✅ |
| [Nuevo Cliente](Nuevo_Cliente.md) | `Nuevo_Cliente` | PRL/CAE | Nombre_de_Cuenta, CIF, 8 Contadores, subform Contactos | — | ✅ |
| [Plantilla](Plantilla.md) | `Plantilla` | PRL/CAE | Nombre_de_la_plantilla, TIPO_CADUCIDAD | — | ✅ |
| [Configuración General](Configuracion_General.md) | `Configuraci_n_General` | Configuración | Notificaciones, Vías, Personal (singleton) | Lookup list→Nuevo_Empleado | ✅ |

> Se irá completando formulario por formulario en archivos individuales.
> Plantilla: ver `_template.md` en esta carpeta.
