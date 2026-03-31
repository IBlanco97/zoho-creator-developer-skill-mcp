---
name: Hacer copia antes y después de cambios
description: Siempre exportar/guardar el código fuente antes de aplicar un cambio, y verificar el estado después
type: feedback
---

Antes de aplicar cualquier cambio a Zoho Creator (condicionales, workflows, ZML, permisos, etc.), hacer una copia del estado actual del código/configuración. Verificar también el estado final después del cambio.

**Why:** En la sesión de rediseño de formato condicional, enviar `criteriaOption=all` en 416 reglas borró todos los criterios originales, dejando todo amarillo. Si hubiéramos tenido una copia previa, la restauración habría sido inmediata.

**How to apply:**
- Para `exportScript` (código Deluge + configuración): `fetch('/appbuilder/formacion11/{app}/exportScript', {credentials:'include'})` → guardar `.ds` en `.playwright-mcp/` con timestamp o nombre descriptivo antes del cambio.
- Para formato condicional: capturar todos los rules vía `showNewConditionalFormatting` y guardar JSON antes de modificar.
- Tras el cambio: re-exportar y confirmar el diff esperado.
