# Portal del Empleado — Documentación completa (explorado 2026-03-09)

## Acceso
- URL: `https://domo21.zohocreatorportal.com`
- Rol: Empleado (solo ven esta sección)
- Usuario prueba: `intiblanco97@gmail.com` / `Zoho.2025`

## Navegación lateral — 8 secciones

| # | Sección | Tipo | URL hash |
|---|---------|------|----------|
| 1 | Tablero Inicio | Página/Dashboard | `#Page:Inicio` |
| 2 | Solicitudes de Permisos | Grupo (expandible) | `#Solicitudes_de_Permisos` |
|   | → Solicitudes Permisos | Reporte | `#Report:Ver_Solicitud` |
|   | → Nueva Solicitud Permiso | Formulario | `#Form:Solicitud` |
| 3 | Solicitud de EPI - Herramientas | Grupo (expandible) | `#Solicitud_de_EPI_Herramientas` |
|   | → Solicitudes EPI - Herramientas | Reporte | `#Report:Ver_Solicitud_de_EPIs_Herramientas` |
|   | → Nueva Solicitud EPI - Herramienta | Formulario | `#Form:Solicitud_de_EPIs_Herramientas` |
| 4 | Historial de Asignaciones de Activos | Reporte (solo lectura) | `#Report:Historial_de_Asignaciones_de_Activos_2` |
| 5 | Mensajes | Grupo (expandible) | `#Mensajes` |
|   | → Dejar un mensaje | Formulario | `#Form:Mensaje` |
|   | → Historial Mensajes y Respuestas | Reporte | `#Report:Mensaje_Report` |
| 6 | Datos del Empleado | Formulario (perfil) | `#Form:Datos_del_Empleado` |
| 7 | Confirmaciones de Entrega | Reporte | `#Report:Confirmaciones_de_Entrega_Report` |
| 8 | Encuestas | Reporte | `#Report:Encuestas_Zoho_Survey` |

---

## 1. Tablero Inicio (`#Page:Inicio`)

### Widgets / Tarjetas KPI (fila superior, 4 tarjetas)
| Tarjeta | Valor mostrado |
|---------|---------------|
| Nombre completo | Calculado del registro del empleado |
| Área | Departamento/área profesional del empleado |
| Clientes Actuales | Valor del campo (puede estar vacío) |
| Encuestas Activas | Badge numérico verde con el nº de encuestas pendientes |

### Sección embebida: Confirmaciones de Entrega
- Tabla con las confirmaciones asignadas al empleado
- Si no hay registros: "¡Ningún registro coincide con sus criterios especificados!"

### Sección embebida: Documentación con Clientes (B3)
- Reporte `Copy_of_Cliente_Empleado` (ID `4790826000000968813`)
- Muestra documentos/requisitos del cliente asignado al empleado
- Filtro nativo: `[Trabajador.Mail_Portal_Empleado == zoho.loginuserid || Trabajador.Official_Email == zoho.loginuserid || Trabajador.Correo_Electr_nico == zoho.loginuserid]`
- Requiere `["viewall"]` en `ProfilePermission` para form `Nueva_Lista_de_Requisitos` (ID `4790826000000114889`) porque los registros los crea RRHH (no el empleado)

### Acciones disponibles
- Botones "Imprimir" y "PDF" (arriba derecha) para imprimir el dashboard

---

## 2. Solicitudes de Permisos

### 2a. Reporte: Solicitudes Permisos
**Columnas visibles:**
- Tipo | Nota | Fecha de comienzo | Fecha de Fin | Estado | Tipo de Permiso Retribuido | Tipo de Permiso No Retribuido

**Acciones:** Búsqueda Avanzada | Agregar (acceso directo al formulario) | Más opciones

**Estados posibles:** Sin Respuesta | Aprobado | Rechazado (inferido)

### 2b. Formulario: Nueva Solicitud Permiso
**Aviso visible:** *"Las solicitudes deben hacerse con al menos 15 días de antelación"*

**Campos:**
| Campo | Tipo | Opciones / Observaciones |
|-------|------|--------------------------|
| Tipo | Dropdown (obligatorio) | Vacaciones / Permiso Retribuido / Permiso no Retribuido |
| Fecha de comienzo | Date picker | Pre-rellena con hoy + 15 días |
| Fecha de Fin | Date picker | Pre-rellena con ~7 días después de fecha inicio |
| Nota | Textarea | Libre, opcional |

**Botones:** Enviar | Restablecer

---

## 3. Solicitud de EPI - Herramientas

### 3a. Reporte: Solicitudes EPI - Herramientas
**Columnas visibles:**
- Confirmar | Equipo Solicitado | Equipo Asignado | Fecha Prevista de Entrega | Estado | Historia de la Solicitud | Motivo de la Solicitud | Nota Sobre Respuesta a la Solicitud

**Estados con color:** Entregado (verde) | Rechazado (rojo) | Pendiente (inferido)

**Historia de la Solicitud:** timestamps de cada cambio de estado, ej:
```
Creado - 10-12-2025 16:13:29
Entregado - 16-12-2025 14:07:30
```

**Columna "Confirmar":** botón para que el empleado confirme la recepción física del equipo

### 3b. Formulario: Nueva Solicitud EPI - Herramienta
**Campos:**
| Campo | Tipo | Opciones |
|-------|------|----------|
| Tipo de equipo solicitado* | Radio (obligatorio) | EPI / ROPA / HERRAMIENTA |
| Equipo Solicitado* | Textarea (obligatorio) | Descripción libre |
| Motivo de la Solicitud | Textarea | Libre, opcional |

**Botones:** Enviar | Restablecer

---

## 4. Historial de Asignaciones de Activos
- Reporte de **solo lectura** (sin botón Agregar)
- Muestra activos de empresa asignados al empleado (vehículos, equipos informáticos, etc.)
- Filtrado automáticamente por empleado (solo ve sus activos)

---

## 5. Mensajes

### 5a. Formulario: Dejar un mensaje
**Campos:**
- Contenido (textarea) — único campo, mensaje libre

**Botón:** Enviar (sin Restablecer)

**Propósito:** Canal de comunicación directa del empleado hacia RRHH.

### 5b. Reporte: Historial Mensajes y Respuestas
**Columnas:** Autor | Contenido | Es Respuesta

- Muestra el hilo de mensajes enviados por el empleado + respuestas de RRHH
- Campo "Es Respuesta": distingue los mensajes de RRHH de los del empleado

---

## 6. Datos del Empleado (`#Form:Datos_del_Empleado`)
Formulario de perfil auto-rellenado con datos existentes del empleado. **Permite actualización por el propio empleado.**

### Sección: Datos Básicos
| Campo | Tipo | Observaciones |
|-------|------|---------------|
| Nombre* | Text (First + Last Name) | |
| Email* | Email | Email corporativo |
| Email Personal o Secundario | Email | |
| Moneda | Dropdown | |
| Fecha de Nacimiento | Date | |
| Foto | File upload / URL | |
| DNI / NIE / Pasaporte* | Text | |
| Móvil* | Phone (prefijo + número) | |
| Teléfono | Phone (prefijo + número) | Opcional |
| Idioma | Dropdown | |
| Sexo | Radio | Masculino / Femenino |

### Sección: Datos de Contacto
| Campo | Tipo |
|-------|------|
| Calle | Text |
| Código postal | Text |
| País | Dropdown + campo libre "Otro" |
| Ciudad | Dropdown + campo libre "Otro" |
| Estado/provincia | Dropdown + campo libre "Otro" |
| Comarca | Dropdown |
| Habitación Empresa | Checkbox (SI) |
| Necesita Habitación | Checkbox (SI) |
| Dirección Habitación Empresa | Text |

### Sección: Datos Profesionales
| Campo | Tipo |
|-------|------|
| Area Profesional* | Dropdown |
| Profesión | Dropdown |
| Categoría Profesional | Dropdown |
| Puesto laboral actual | Dropdown |
| Especialidad | Dropdown |
| Información adicional | Textarea |

### Sección: Régimen
| Campo | Tipo |
|-------|------|
| Tipo de Régimen | Dropdown |
| Tipo Autónomo | Dropdown |
| Precio Base Autónomo | Número |

### Sección: Otra Información
| Campo | Tipo |
|-------|------|
| Carnet de Conducir | Checkbox (SI) |
| Vehículo propio | Checkbox (SI) |

### Campo suelto al final
- **Leída Documentación Bienvenida** (Radio: SI / NO — por defecto: NO)
  - Se conecta con el módulo de Confirmaciones de Entrega

**Botones:** Enviar | Restablecer

---

## 7. Confirmaciones de Entrega
**Columnas:** Mensaje | Estado | Confirmar | Tipo

- Sistema de notificaciones/tareas que RRHH asigna al empleado para que confirme su lectura o recepción
- **Estado:** Confirmado | Pendiente
- **Acción:** Botón "Confirmar" en cada fila (deshabilitado si ya está Confirmado)
- **Tipos existentes:** Lectura Documentación Bienvenida (y potencialmente otros)
- Ejemplo: *"Indique 'Confirmar' cuando haya completado la lectura de la documentación de bienvenida."*

---

## 8. Encuestas
- Lista de encuestas activas de Zoho Survey asignadas al empleado
- Cada encuesta muestra: nombre + enlace directo a `survey.zohopublic.com`
- El número de encuestas activas aparece en el badge del dashboard (Tablero Inicio)

---

## Elementos del Header / UI Global

### Barra superior
- Nombre de la app (izquierda): "Gestión de Recursos Humanos"
- Selector de idioma (icono globo)
- Botón Notificaciones (icono campana) → Panel lateral deslizable
- Avatar de perfil (foto + nombre del empleado)

### Panel de Notificaciones
- Se abre como slide-over desde la derecha
- "No hay notificaciones / Aún no ha recibido ninguna notificación" (cuando está vacío)
- Botón de Configuración de notificaciones (engranaje)

### Barra inferior del sidebar
- Avatar del empleado + nombre
- Icono campana (notificaciones) — acceso alternativo
- Icono engranaje (configuración)

---

## Flujos de Trabajo y Casos de Uso

### CU-01: Solicitar permiso
1. Menú → Solicitudes de Permisos → Nueva Solicitud Permiso
2. Seleccionar Tipo (Vacaciones / Permiso Retribuido / Permiso no Retribuido)
3. Ajustar fechas (min. 15 días desde hoy)
4. Añadir Nota opcional
5. Enviar → RRHH recibe la solicitud y la gestiona
6. El empleado consulta el Estado en "Solicitudes Permisos" (Sin Respuesta → Aprobado/Rechazado)

### CU-02: Solicitar EPI/Ropa/Herramienta
1. Menú → Solicitud de EPI - Herramientas → Nueva Solicitud EPI - Herramienta
2. Seleccionar tipo: EPI / ROPA / HERRAMIENTA
3. Describir el equipo solicitado (campo obligatorio)
4. Añadir motivo (opcional)
5. Enviar → RRHH gestiona la solicitud
6. El empleado sigue el estado en "Solicitudes EPI - Herramientas":
   - Creado → (Pendiente) → Entregado / Rechazado
7. Al recibir el equipo, el empleado pulsa "Confirmar" en la columna de la tabla

### CU-03: Ver activos asignados
1. Menú → Historial de Asignaciones de Activos
2. Vista de solo lectura con todos los activos asignados históricamente

### CU-04: Enviar mensaje a RRHH
1. Menú → Mensajes → Dejar un mensaje
2. Escribir contenido libre → Enviar
3. Consultar respuestas en "Historial Mensajes y Respuestas" (columna "Es Respuesta")

### CU-05: Actualizar perfil
1. Menú → Datos del Empleado
2. Editar cualquier campo accesible
3. Confirmar si ha leído la documentación de bienvenida (radio SI)
4. Enviar → datos actualizados en el sistema

### CU-06: Confirmar recepción de documentos/entregas
1. Menú → Confirmaciones de Entrega (o desde el Dashboard directamente)
2. Revisar cada elemento pendiente
3. Pulsar botón "Confirmar" → estado cambia a "Confirmado"
4. Esto también actualiza el campo "Leída Documentación Bienvenida" en el perfil

### CU-07: Participar en encuesta
1. Menú → Encuestas (o badge en Dashboard)
2. Ver encuestas disponibles
3. Clic en el enlace de la encuesta → abre Zoho Survey en nueva pestaña
4. Completar la encuesta externamente

---

## Datos que el Empleado NO puede ver (por diseño)
- Nóminas / Documentos laborales
- Formaciones / Certificaciones / Documentación PRL
- Gestión de flota (vehículos de empresa)
- Información de otros empleados
- Incidencias / Tickets de soporte
- Historial de vacaciones/ausencias aprobadas en formato calendario
- Datos salariales

---

## Limitaciones y Observaciones
- "Clientes Actuales" en el dashboard aparece vacío para este usuario de prueba
- "Historial de Asignaciones de Activos" sin registros para este usuario
- El campo "Leída Documentación Bienvenida" en Datos del Empleado refleja / sincroniza con Confirmaciones de Entrega
- Las fechas en "Nueva Solicitud Permiso" se pre-rellenan automáticamente respetando el mínimo de 15 días
- **Ownership model**: Por defecto los empleados solo ven registros que ellos CREARON. Para ver registros de RRHH (como Nueva_Lista_de_Requisitos), el rol necesita `["viewall"]` en ProfilePermission + filtro nativo del reporte con `zoho.loginuserid`
