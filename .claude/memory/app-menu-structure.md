---
name: app-menu-structure
description: Complete sidebar menu structure for RRHH and PRL contexts with display names and hash URLs
type: reference
---

# App Runner — Sidebar Menu Structure

Extracted 2026-03-26 via `browser_evaluate` on sidebar links.

## RRHH Context

| Display Name | Hash URL | Type |
|-------------|----------|------|
| Tablero RRHH | `#Page:Tablero_RRHH` | Page |
| Configuracion General | `#Page:Configuracion_General` | Page |
| Listado Empleados | `#Report:Employee_Details` | Report |
| Listado Empleados (Salarios) | `#Report:Listado_Empleados_Salario` | Report |
| Ficha Empleado | `#Page:Ficha_Empleado` | Page |
| 52 Semanas | `#Page:Semanas_Nuevo` | Page |
| Asignacion Técnico Cliente Report | `#Report:Asignacion_T_cnico_Cliente_Report` | Report |
| Solicitud de EPI - Herramienta | `#Report:Solicitudes_de_EPIs_Herramientas_Report` | Report |
| Solicitudes de Permisos | `#Page:Tablero_Solicitudes` | Page |
| Encuestas | `#Page:Encuestas_Zoho_Survey_HHRR` | Page |
| **Activos** (group) | | |
| ├ Activos de Empleados | `#Report:Employee_Assets` | Report |
| ├ Historial de Asignaciones de Activos | `#Report:Historial_Asignaciones_Activos` | Report |
| └ Tablero Activos | `#Page:Tablero_Activos` | Page |
| **WhatsApp Difusión** (group) | | |
| ├ Enviar WhatsApp | `#Form:WhatsApp` | Form |
| └ Historial de WhatsApp Enviados | `#Report:WhatsApp_a_Trabajadores_Report` | Report |
| **Mensajes** (group) | | |
| ├ Mensajes Recibidos | `#Page:Lista_Conversaciones` | Page |
| └ Chat RRHH | `#Page:Chat_RRHH` | Page |
| Candidatos Cercanos | `#Page:Candidatos_Cercanos` | Page |
| Gestión de Bajas | `#Report:Dar_de_Baja_Report` | Report |
| Mapa Empleados | `#Report:Mapa_Empleados` | Report |
| Empresa | `#Page:Empresa` | Page |
| **Dashboards y Analiticas** (group) | | |
| ├ Semáforo Caducidades EPI | `#Page:Sem_foro_Caducidades_EPI` | Page |
| ├ Timeline Permisos | `#Page:Timeline_Permisos` | Page |
| └ Panel de Asignaciones | `#Page:Panel_de_Asignaciones` | Page |
| **Asignar / Desasignar Trabajadores** (group) | | |
| ├ Asignar / Desasignar (form) | `#Form:Asignar_Desasignar_Trabajadores` | Form |
| └ Asignar / Desasignar (report) | `#Report:Asignar_Desasignar_Trabajadores_Report` | Report |
| Usuarios | `#Report:Usuario1_Report` | Report |

## PRL Context

| Display Name | Hash URL | Type |
|-------------|----------|------|
| Tablero PRL | `#Page:Tablero_PRL` | Page |
| Clientes | `#Report:Clientes` | Report |
| Clientes Doc | `#Page:Clientes_Doc` | Page |
| Cliente - Empleado | `#Report:Trabajadores_Documentos` | Report |
| Documentos | `#Report:Otros_Documentos` | Report |
| Subir Documento | `#Form:Subir_Documento` | Form |
| Enviar Documentos | `#Form:Env_o_de_documentaci_n` | Form |
| **EPI - Herramientas** (group) | | |
| ├ Inventario EPI | `#Page:Inventario_EPI` | Page |
| └ Historial de Asignaciones | `#Report:Asignacion_EPI_Ropa_Herramienta_Report` | Report |
| **Otros** (group) | | |
| ├ Modelos de Documentos | `#Report:Ver_Plantillas` | Report |
| ├ Plantillas Envío | `#Report:Ver_Plantillas_Env_o` | Report |
| ├ Plantillas de Correo | `#Report:Plantilla_de_Correo_Report` | Report |
| ├ Mapa de Clientes | `#Report:Mapa_de_Clientes` | Report |
| └ Importar Cuenta Cliente | `#Form:Importar_Cuenta_Cliente` | Form |
| **Registros** (group) | | |
| ├ Historial de envíos de documentación | `#Report:Env_o_de_documentaci_n_Report` | Report |
| ├ Formaciones | `#Report:Formaci_n_Report` | Report |
| └ Calendario de Formaciones | `#Report:Calendario_de_Formaciones` | Report |
| **Centro Formativo** (group) | | |
| └ Centro Formativo | `#Form:Centro_Formativo` | Form |

## How to extract (technique)

```js
// Run in browser_evaluate on the app runner page
() => {
  const links = [...document.querySelectorAll('nav a, [class*="nav"] a, [class*="menu"] a')];
  return links.map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }))
    .filter(l => l.text && l.href && !l.href.startsWith('javascript'));
}
```
