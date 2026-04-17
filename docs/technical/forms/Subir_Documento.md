# Subir Documento

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Subir_Documento` |
| **Display Name** | Subir Documento |
| **Módulo** | PRL / CAE |
| **Registros aprox.** | Miles (documentos de empresa y trabajadores) |

## Campos principales

| # | Campo | Link Name | Tipo | Notas |
|---|-------|-----------|------|-------|
| 1 | Documento | `Documento` | File Upload | El documento subido (lookup devuelve bigint, no string) |
| 2 | Trabajador | `Trabajador` | Lookup → `Nuevo_Empleado` | null si es doc de empresa |
| 3 | Empresa | — | Lookup → empresa | null si es doc de trabajador |
| 4 | Plantilla | `Plantilla` | Lookup → `Plantilla` | Tipo de documento. Guard: `d.Plantilla != null` antes de `.Nombre_de_la_plantilla` |
| 5 | Caducidad/Tolerancia | `Caducidad_Tolerancia` | Date | Guard: `!= null` antes de `.toString()` |
| 6 | Estado | `Estado` | Picklist | Valores: Caducado, Actualizado, Pendiente subir, Enviado no aprobado, etc. |
| 7 | Con Empresa o Con Trabajador | `Con_Empresa_o_Con_Trabajador` | Picklist | "Requisitos de Trabajador" / "Requisitos de Empresa" |

## Workflows asociados

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| `Backup_de_documentos_PRL` | Scheduled | Sube documentos al SFTP (backup diario) |
| Workflows de caducidad | On edit | Recalculan estado cuando cambia la fecha |

## Notas

- Campo `Documento` es de tipo file — `d.Documento != null` se evalúa como int (bigint), no como string.
- `d.Plantilla != null` es obligatorio antes de acceder a `.Nombre_de_la_plantilla` — sin guard lanza excepción.
- `d.Caducidad_Tolerancia != null` es obligatorio antes de `.toString()`.
- Formulario central del módulo PRL — alimenta las funciones de semáforo, tablero PRL, y documentación del cliente.
