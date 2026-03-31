---
name: multi-popup-pattern
description: Patrón de popups encadenados en Zoho Creator (on user input + openUrl popup window), documentado desde el flujo "Asignar Técnico a Cliente"
type: project
---

# Patrón Multi-Popup Encadenado en Zoho Creator

**Why:** El usuario quiere replicar este patrón en otro caso de uso. Documentado en sesión 2026-03-14.
**How to apply:** Usar como plantilla cuando se pida implementar un flujo de 2 formularios popup.

## Cómo funciona

El patrón usa **`on user input`** (no `on add`) para interceptar cambios en un multiselect/checkboxes MIENTRAS el usuario edita, antes de que el formulario se envíe. Cuando detecta un ítem nuevo, abre un segundo popup con contexto via URL params.

## Los 4 ingredientes

1. **Botón en reporte** (`type = functions`, `on click`) → abre Popup 1 con IDs actuales en URL
2. **Popup 1** (formulario de selección, multiselect/checkboxes) → `on user input` detecta diff
3. **`openUrl("#Form:Popup2?campo=val", "popup window")` + `break`** → abre Popup 2 con contexto; `break` limita a 1 por vez
4. **Popup 2** (formulario de detalle) → `on load` deshabilita campos pre-rellenados; `on success` ejecuta lógica de negocio

## Implementación real: Asignar Técnico a Cliente

### Flujo A — desde el reporte de Clientes
```
Botón "Asignar - Desasignar Trabajador" (workflow report Nuevo_Cliente)
  └─ openUrl("#Form:Elegir_Trabajador?Cliente=X&Trabajadores=Y", "Popup window")

Popup 1 — Elegir_Trabajador
  Campos: Cliente (picklist, pre-rellenado) + Trabajadores (checkboxes)
  on user input de Trabajadores:
    → si se ELIMINA: desasigna directamente (Deluge, sin popup)
    → si se AÑADE:
      openUrl("#Form:Asignacion_T_cnico_Cliente?Tecnico=" + t + "&Cliente=" + cliente.ID, "popup window");
      break;

Popup 2 — Asignacion_T_cnico_Cliente
  on load:  disable Cliente; disable Tecnico;  (campos pre-rellenados)
  on validate (on add): AsignarCliente(empleado, cliente, esClienteHabitual)
  on success (on add): crea Lista_de_Requisitos + genera jornadas calendario 52 semanas + notifica
  on success (on edit): navega via campo private Enlace_de_regreso (NO/Semanas52Page/PageRefresh)
```

### Flujo B — desde el reporte de Empleados
```
Botón "Asignar trabajador a cliente" (workflow report Nuevo_Empleado)
  └─ openUrl("#Form:Asignar_Trabajador_a_Cliente?Trabajador=X&Clientes=Y", "Popup window")

Popup 1 — Asignar_Trabajador_a_Cliente
  Campos: Trabajador (picklist) + Clientes (list multi-select)
  on user input de Clientes: mismo patrón → openUrl Popup 2 con ?Tecnico=X&Cliente=Y

Popup 2 — Asignacion_T_cnico_Cliente (mismo que Flujo A)
```

## Formularios involucrados

| Link Name | Display Name | Propósito |
|-----------|-------------|-----------|
| `Elegir_Trabajador` | Elegir Trabajador | Popup 1 desde perspectiva cliente |
| `Asignar_Trabajador_a_Cliente` | Asignar Trabajador a Cliente | Popup 1 desde perspectiva empleado |
| `Asignacion_T_cnico_Cliente` | Asignacion Técnico Cliente | Popup 2 (detalles) — compartido por ambos flujos |
| `Asignacion_Tecnico_Cliente_Anio` | Asignacion Técnico Cliente Año | Registro en calendario 52 semanas (creado por función, no popup) |

## Detectar diff en on user input (Deluge)

```deluge
clientesListaPrevia = thisapp.NuevoEmpleado.getClientesAll(trabajador);
for each c in input.Clientes
{
    found = false;
    for each c2 in clientesListaPrevia
    {
        if(c == c2) { found = true; break; }
    }
    if(!found)
    {
        openUrl("#Form:Asignacion_T_cnico_Cliente?Tecnico=" + input.Trabajador + "&Cliente=" + c, "popup window");
        break;  // solo procesar un ítem nuevo por vez
    }
}
```

## Campo "puerta trasera" para navegación post-submit

`Asignacion_T_cnico_Cliente` usa un campo `Enlace_de_regreso` (picklist, private, valores: NO/Semanas52Page/PageRefresh) para controlar a dónde navega el popup 2 tras guardar. Patrón útil cuando el mismo formulario se usa desde distintos contextos.
