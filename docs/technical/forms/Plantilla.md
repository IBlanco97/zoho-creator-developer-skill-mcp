# Plantilla (Tipo de Documento)

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Plantilla` |
| **Display Name** | Plantilla |
| **Módulo** | PRL / CAE |
| **Registros aprox.** | Decenas (catálogo de tipos de documento) |

## Campos principales

| # | Campo | Link Name | Tipo | Notas |
|---|-------|-----------|------|-------|
| 1 | Nombre de la Plantilla | `Nombre_de_la_plantilla` | Single Line | |
| 2 | Tipo Caducidad | `TIPO_CADUCIDAD` | Picklist | Anual, Semestral, Trimestral, etc. Usado por workflows de cálculo de caducidad |

## Notas

- Formulario de catálogo — define los tipos de documentos que se pueden subir.
- `TIPO_CADUCIDAD` es el valor por defecto para calcular la fecha de caducidad de un documento. Puede ser overrideado por `Fecha_de_Caducidad_Modelo` (tabla de excepciones por cliente).
- Bug corregido: el picklist tenía "Trimensual" en vez de "Trimestral" — esto causaba que los workflows de cálculo no matchearan.
