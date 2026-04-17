# Nuevo Cliente

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Nuevo_Cliente` |
| **Display Name** | Nuevo Cliente |
| **Módulo** | PRL / CAE |
| **Registros aprox.** | Cientos |

## Campos principales

| # | Campo | Link Name | Tipo | Notas |
|---|-------|-----------|------|-------|
| 1 | Nombre de Cuenta | `Nombre_de_Cuenta` | Single Line | Nombre del cliente |
| 2 | CIF | `CIF` | Single Line | |
| 3 | Teléfono | `Tel_fono` | Phone | |
| 4 | Contadores | `ContadorTotal`, `ContadorCaducados`, `ContadorPendietesSubir`, `ContadorNoEnviados`, `ContadorEnviadosNoAprobados`, `ContadorEnviadosAprobados`, `ContadorActualizados`, `ContadorCercaCaducar` | Number | Campos desnormalizados — 8 KPIs por cliente |

## Subformularios

| Subform | Link Name | Campos |
|---------|-----------|--------|
| Personas Contacto en Planta | `Personas_Contacto_en_Planta` | `Email` (y otros campos de contacto) |

## Workflows asociados

Múltiples workflows de caducidad actualizan los contadores.

## Notas

- Los 8 campos `Contador*` son desnormalizados — se actualizan por workflows cuando cambian documentos en `Subir_Documento` o `Nuevo_Requisitos_Doc`.
- `Personas_Contacto_en_Planta` es el subform usado por `Enviar_Reporte_STOP2_Semanal` para enviar emails a los contactos del cliente.
- Campos lookup se comparan con `0` (no `""`) — son numéricos.
- Usado en `DevolverHTMLClientesDoc` y `DevolverHTMLDocCliente`.
