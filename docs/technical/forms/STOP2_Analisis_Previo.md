# STOP2 Análisis Previo

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `STOP2_Analisis_Previo` |
| **Display Name** | STOP2 Análisis Previo |
| **Módulo** | STOP2 — Checklist seguridad pre-tarea |
| **Registros aprox.** | En crecimiento (1 por visita a cliente) |

## Campos

| # | Campo | Link Name | Tipo | Obligatorio | Notas |
|---|-------|-----------|------|-------------|-------|
| 1 | Empleado | `Empleado` | Lookup (→ `Nuevo_Empleado`) | Sí | fieldtype=12 |
| 2 | Cliente | `Cliente` | Lookup (→ `Nuevo_Cliente`) | Sí | fieldtype=12, dot notation: `.Nombre_de_Cuenta` |
| 3 | Orden de Trabajo | `Orden_de_Trabajo` | Texto | No | |
| 4 | Observaciones | `Observaciones` | Multilínea | No | |
| 5 | Fecha Checklist | `Fecha_Checklist` | Datetime | Sí | Auto-filled on submit |
| — | **ACCESO (7 campos)** | | | | Sección visible |
| 6 | A1 Control Accesos | `A1_Control_Accesos` | Decision Box | No | |
| 7 | A2 Permiso Trabajo | `A2_Permiso_Trabajo` | Decision Box | No | |
| 8 | A3 Trabajos en Caliente | `A3_Trabajos_Caliente` | Decision Box | No | |
| 9 | A4 Trab. Eléctricos (*) | `A4_Trab_Electricos` | Decision Box | No | Crítico (*) |
| 10 | A5 ATEX (*) | `A5_ATEX` | Decision Box | No | Crítico (*) |
| 11 | A6 Alturas (*/**) | `A6_Alturas` | Decision Box | No | Crítico (*/**) |
| 12 | A7 Espacios Confinados (*/**) | `A7_Espacios_Confinados` | Decision Box | No | Crítico (*/**) |
| — | **ENTORNO (4 campos)** | | | | |
| 13 | E1 Zona Obra | `E1_Zona_Obra` | Decision Box | No | |
| 14 | E2 Zona Vehículos | `E2_Zona_Vehiculos` | Decision Box | No | |
| 15 | E3 Señalización | `E3_Senalizacion` | Decision Box | No | |
| 16 | E4 Intemperie | `E4_Intemperie` | Decision Box | No | |
| — | **PERSONAL (4 campos)** | | | | |
| 17 | P1 EPIs | `P1_EPIs` | Decision Box | No | |
| 18 | P2 Trabajo Solitario | `P2_Trabajo_Solitario` | Decision Box | No | |
| 19 | P3 Herramientas | `P3_Herramientas` | Decision Box | No | |
| 20 | P4 Medios Auxiliares | `P4_Medios_Auxiliares` | Decision Box | No | |
| — | **MATERIALES (4 campos)** | | | | |
| 21 | M1 Acceso Seguro | `M1_Acceso_Seguro` | Decision Box | No | |
| 22 | M2 Limpieza | `M2_Limpieza` | Decision Box | No | |
| 23 | M3 Material Riesgos | `M3_Material_Riesgos` | Decision Box | No | |
| 24 | M4 Consignar | `M4_Consignar` | Decision Box | No | |
| — | **FINAL (3 campos)** | | | | |
| 25 | F1 Protecciones | `F1_Protecciones` | Decision Box | No | |
| 26 | F2 Candado Amarillo | `F2_Candado_Amarillo` | Decision Box | No | |
| 27 | F3 Salida Accesos | `F3_Salida_Accesos1` | Decision Box | No | Recreado (sufijo `1` en link name) |

**Total: 5 campos datos + 22 Decision Box = 27 campos**

## Lookups (campos de referencia)

| Campo | Apunta a | Campo mostrado |
|-------|---------|----------------|
| `Empleado` | `Nuevo_Empleado` | Nombre (first_name + last_name) |
| `Cliente` | `Nuevo_Cliente` | `Nombre_de_Cuenta` |

## Subformularios

Ninguno.

## Workflows asociados

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| `Enviar_Reporte_STOP2_Sema` | Scheduled (lunes 09:00) | Envía resumen semanal por email a contactos del cliente |

## Reportes

| Reporte | Link Name | Tipo | Filtro |
|---------|-----------|------|--------|
| — | — | — | No se han creado reportes dedicados; los datos se consultan desde la función HTML |

## Notas

- Los campos A4, A5, A6, A7 son **críticos** (marcados con `*` o `**` en el Excel STOP2 original). Si están en `false`, se contabilizan como alertas críticas en la función HTML y en el reporte semanal.
- A8 fue eliminado del formulario (era una leyenda, no una pregunta) — quedan 22 Decision Box.
- F3 se recreó como `F3_Salida_Accesos1` (Zoho añade sufijo numérico al recrear campos).
- Labels renombrados via Playwright (no via API) con texto descriptivo del Excel STOP2.
- Sección "ACCESO" es visible; las demás secciones se pueden inferir por el prefijo del campo (E, P, M, F).
