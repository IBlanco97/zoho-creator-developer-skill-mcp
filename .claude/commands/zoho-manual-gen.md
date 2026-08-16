---
name: zoho-manual-gen
description: >
  Generación del Manual de Usuario de Zoho Creator human-resource-management.
  Estructura por módulo y perfil, flujo de captura, reglas de estilo.
  Módulo complementario de zoho-creator-dev.
metadata:
  author: sicma21
  version: "2.0"
---

# Zoho Manual Generation

Módulo complementario de `zoho-creator-dev`. Define cómo generar el Manual de Usuario.

---

## Perfiles de usuario

| Perfil | URL base | Usuario prueba |
|--------|----------|----------------|
| USUARIO TRABAJADOR (Empleado) | `https://domo21.zohocreatorportal.com` | `intiblanco97@gmail.com` / `Zoho.2025` |
| RRHH / Admin | `https://creator.zoho.com/appbuilder/formacion11/human-resource-management/` | `ecama@sicma21.com` |
| Responsable CAE / PRL | mismo que RRHH | según rol asignado |
| Super Administrador | mismo que RRHH | cuenta admin |

---

## Módulos a documentar

### MÓDULO A — Portal del Empleado (USUARIO TRABAJADOR)

| Sección | URL hash | Descripción |
|---------|----------|-------------|
| A1 Tablero Inicio | `#Page:Inicio` | KPIs personales, Confirmaciones, Docs cliente |
| A2 Solicitudes de Permisos | `#Report:Ver_Solicitud` | Ver + `#Form:Solicitud` |
| A3 Solicitud de EPI/Herramientas | `#Report:Ver_Solicitud_de_EPIs_Herramientas` | Ver + Form |
| A4 Mis EPIs | `#Page:Mis_EPIs` | Página HTML |
| A5 Mis Permisos | `#Page:Mis_Permisos` | Página HTML |
| A6 Mis Activos | `#Page:Mis_Activos` | Página HTML |
| A7 Mis Mensajes | `#Page:Mis_Mensajes2` | Chat empleado ↔ RRHH |
| A8 Datos del Empleado | `#Form:Datos_del_Empleado` | Formulario de perfil |
| A9 Confirmaciones de Entrega | `#Report:Confirmaciones_de_Entrega_Report` | Solo lectura |
| A10 Encuestas | `#Report:Encuestas_Zoho_Survey` | Solo lectura |

### MÓDULO B — Panel RRHH (Gestor RRHH / Supervisor / Super Admin)

| Sección | URL hash | Descripción |
|---------|----------|-------------|
| B1 Tablero RRHH | `#Page:Tablero_RRHH` | KPIs, solicitudes pendientes |
| B2 Gestión de Permisos | `#Report:Ver_Solicitudes` + Calendario | Lista + calendario |
| B3 Gestión de EPI | `#Report:Ver_Solicitud_de_EPIs_Herramientas` | Popup "Aprobar EPI" |
| B4 Chat con Empleados | `#Report:Conversaci_n_Report` → `#Page:Chat_RRHH?TecnicoNo={id}` | Conversaciones |
| B5 Panel de Asignaciones | `#Page:Panel_de_Asignaciones` | Vista técnico-cliente |
| B6 Semáforo Caducidades EPI | `#Page:Sem_foro_Caducidades_EPI` | Pills por estado |
| B7 Calendario 52 Semanas | `#Page:Semanas_Nuevo` → `#Page:Detalle_Semana` | Grid anual |
| B8 Timeline Permisos | `#Page:Timeline_Permisos` | Tabla mensual |
| B9 Ficha Empleado | `#Page:Ficha_Empleado?EmpNo={id}` | Perfil completo |
| B10 Documentación Clientes | `#Page:Clientes_Doc` → `#Page:Documentaci_n_del_Cliente` | Panel + ficha |
| B11 Configuración General | `#Page:Configuracion_General` | Ajustes del sistema |

### MÓDULO C — Sección PRL / CAE

| Sección | URL hash | Descripción |
|---------|----------|-------------|
| C1 Tablero PRL | `#Page:Tablero_PRL` | KPIs semáforos, clientes embed |
| C2 Gestión de Clientes | `#Report:Ver_Clientes` | Lista clientes CAE |
| C3 Requisitos de Documentación | `#Report:Clientes_Requisitos` | Filtrado estado/envío |
| C4 Subida de Documentos | `#Form:Subir_Documento` | Formulario subida |
| C5 Envío a Cliente | desde Clientes_Requisitos | Acción "Enviar" |
| C6 Control de Caducidades | estados en Nuevo_Requisitos_Doc | Semáforo |
| C7 Modificar Requisitos | popups Modificar_Requisitos_* | Por tipo entidad |

### MÓDULO D — Administración (Super Administrador)

| Sección | Descripción |
|---------|-------------|
| D1 Gestión de usuarios y roles | Settings → Portal → Permisos |
| D2 Alta de empleados | Form: Nuevo_Empleado |
| D3 Asignación técnico-cliente | Form: Asignacion_T_cnico_Cliente |
| D4 Backup SFTP | Workflow: Backup_de_documentos_PRL |

---

## Flujo de generación

```
1. Determinar rol objetivo
2. Navegar al portal con el usuario del rol
3. Para cada pantalla:
   a. browser_navigate → URL hash
   b. browser_wait_for (time: 5)
   c. browser_take_screenshot (fullPage: false)
   d. browser_snapshot → extraer texto/estructura
   e. Documentar: título, propósito, campos, acciones, estados, pasos
4. Generar fichero Markdown en /docs/manual/
```

---

## Reglas de estilo

- **Audiencia**: usuario final no técnico. Evitar "workflow", "form", "link name", "criteria".
- **Voz**: segunda persona singular, imperativo. "Haz clic en", "Selecciona", "Escribe".
- **Capturas**: siempre incluir captura principal. Sub-flujos: captura adicional si no es trivial.
- **Estados**: documentar todos los posibles y su significado.
- **Semáforos**: explicar colores con lenguaje claro (Rojo=urgente, Amarillo=próximo a vencer, Verde=OK, Azul=en proceso).
- **Restricciones**: si botón deshabilitado o campo solo lectura, explicar cuándo y por qué.

## Qué NO incluir

- IDs, link names, nombres internos con guiones bajos
- Menciones a Deluge, workflows, MCP, términos de desarrollo
- Bugs conocidos (van al changelog técnico)
- Credenciales de prueba

## Formato Markdown

```markdown
# [Nombre de la sección]

## ¿Para qué sirve esta pantalla?
[1-2 frases en lenguaje llano]

## ¿Cómo acceder?
Menú lateral → [Ruta de navegación]

## Vista general
[Captura de pantalla]

## Campos / Columnas
| Campo | Descripción |
|-------|-------------|

## Cómo [realizar la acción principal]
1. Paso uno
2. Paso dos

## Estados posibles
| Estado | Significado | Qué hacer |
|--------|-------------|-----------|

## Notas importantes
- ...
```

## Estructura de ficheros

```
docs/manual/
  A-portal-empleado.md
  B-panel-rrhh.md
  C-seccion-prl.md
  D-administracion.md
```
