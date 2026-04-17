# Abrir Historial de Conversación

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Abrir_Historial_de_Conver` |
| **Formulario** | `Conversaci_n` |
| **Trigger** | Acción de usuario en reporte `Conversaci_n_Report` |
| **Condición** | Sin condición |
| **Estado** | Habilitado |
| **Módulo** | RRHH — Mensajería |

## Qué hace

Dos scripts:
1. **Script 1**: Navega a la página Chat RRHH con el ID del técnico: `url = "#Page:Chat_RRHH?TecnicoNo=" + input.T_cnico`
2. **Script 2**: Marca mensajes como leídos (complementario al mark-as-read de `DevolverHTMLChatRRHH`)

## Acciones

### Acción 1: Deluge Script — Navegación
- **Tipo**: Deluge script
- **Navegación**: `openUrl(url, "same window")`

### Acción 2: Deluge Script — Mark as read
- **Tipo**: Deluge script (no modificado)

## Campos que lee

| Campo | Formulario | Tipo |
|-------|-----------|------|
| `T_cnico` | `Conversaci_n` (input) | Lookup → `Nuevo_Empleado` |

## Notas / Bugs conocidos

- Script 1 fue actualizado: antes navegaba a `#Report:Mensajes_de_Empleados?Tecnico={nombre}` (reporte legacy) → ahora va a `#Page:Chat_RRHH?TecnicoNo={id}` (página HTML moderna).
