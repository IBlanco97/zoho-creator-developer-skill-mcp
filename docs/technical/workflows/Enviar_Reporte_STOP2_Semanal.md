# Enviar Reporte STOP2 Semanal

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Enviar_Reporte_STOP2_Sema` |
| **Formulario** | — (Programa scheduled, no vinculado a form) |
| **Trigger** | Scheduled: cada lunes 09:00 Europe/Madrid |
| **Condición** | Sin condición (se ejecuta siempre) |
| **Estado** | Deshabilitado (pendiente de activación) |
| **Módulo** | STOP2 |
| **Backup local** | `deluge-drafts/Enviar_Reporte_STOP2_Semanal.deluge` |

## Qué hace

Cada lunes a las 09:00, recopila todos los checklists STOP2 realizados durante la semana anterior (lunes a domingo), los agrupa por cliente, genera un email HTML con tabla resumen por cada cliente, y lo envía a los contactos de planta (`Personas_Contacto_en_Planta`) de cada cliente.

## Acciones

### Acción 1: Deluge Script
- **Tipo**: Deluge script
- **Descripción**: Genera y envía emails HTML agrupados por cliente

**Flujo del script:**

1. **Calcular rango de fechas**: `hoy.addDay(-7)` (lunes pasado) a `hoy.addDay(-1)` (domingo pasado)
2. **Agrupar por cliente**: Itera `STOP2_Analisis_Previo[Fecha_Checklist >= lunesPas && Fecha_Checklist <= domPas]`, acumula filas HTML en `cliMap` (Map keyed by clienteId)
3. **Por cada cliente**: Construye email HTML con header `#1C3A5E`, tabla 5 columnas, footer, y envía via `sendmail` a cada contacto

**Estructura del email:**

```
┌─ Header (#1C3A5E): "Informe Semanal STOP2 — {Cliente}" ─┐
│ Texto intro: remitimos resumen semanal...                 │
│ ┌─ Tabla ─────────────────────────────────────────┐       │
│ │ Fecha │ Técnico │ OT │ Cumplimiento │ Estado    │       │
│ │ dd/MM │ Nombre  │ OT │    15/22     │ OK/alerta │       │
│ └─────────────────────────────────────────────────┘       │
│ Nota: (*) alertas críticas...                             │
├─ Footer: "Este informe se genera automáticamente..."      ─┤
└───────────────────────────────────────────────────────────┘
```

## Campos que lee

| Campo | Formulario | Tipo |
|-------|-----------|------|
| `Fecha_Checklist` | `STOP2_Analisis_Previo` | Datetime |
| `Cliente` | `STOP2_Analisis_Previo` | Lookup → `Nuevo_Cliente` |
| `Empleado` | `STOP2_Analisis_Previo` | Lookup → `Nuevo_Empleado` |
| `Orden_de_Trabajo` | `STOP2_Analisis_Previo` | Texto |
| 22 Decision Box (A1–F3) | `STOP2_Analisis_Previo` | Decision Box |
| `Nombre_de_Cuenta` | `Nuevo_Cliente` | Texto (via dot notation) |
| `Nombre.first_name`, `Nombre.last_name` | `Nuevo_Empleado` | Name (via dot notation) |
| `Personas_Contacto_en_Planta` | `Nuevo_Cliente` | Subform |
| `Email` | Subform `Personas_Contacto_en_Planta` | Email |

## Campos que escribe

Ninguno (solo envía emails).

## Dependencias

- **Lookups**: `STOP2_Analisis_Previo.Cliente` → `Nuevo_Cliente`, `STOP2_Analisis_Previo.Empleado` → `Nuevo_Empleado`
- **Funciones**: Ninguna (HTML generado inline)
- **Otros workflows**: Ninguno
- **Subform**: `Nuevo_Cliente.Personas_Contacto_en_Planta` (contactos de planta del cliente)

## Notas / Bugs conocidos

- **Deshabilitado**: Requiere activación manual tras verificar que la frecuencia es semanal (no diaria).
- Usa `Map()` para agrupar filas HTML por cliente — `cliMap.containKey(ck)` para append.
- El conteo de cumplimiento es sobre 22 (no 23, porque A8 fue eliminado).
- Los campos críticos (A4, A5, A6, A7) se evalúan como `== false` para contar alertas — mismo criterio que la función HTML.
- `sendmail` se ejecuta desde `zoho.adminuserid` (el propietario de la app).
- Si un cliente no tiene contactos en `Personas_Contacto_en_Planta`, no se envía email (no hay fallback).
- Counter guard pattern: `cliFound` + `for each` + `break` para obtener registro de cliente por ID.
