---
name: Zoho bloquea eventos no-trusted para operaciones destructivas
description: Zoho IDE rechaza clicks programáticos (isTrusted:false) para eliminar componentes; solo funciona con clicks reales del usuario
type: feedback
---

Las operaciones destructivas en el App IDE de Zoho Creator (eliminar páginas, formularios, workflows) requieren eventos con `isTrusted: true` — solo los generados por acciones reales del usuario.

**Why:** Zoho comprueba `event.isTrusted` en los handlers de delete para prevenir eliminaciones accidentales/automatizadas. Ninguna técnica JS puede bypass esto: `.click()`, `dispatchEvent(new MouseEvent(...))`, `elementFromPoint().click()` — todas producen `isTrusted: false` y el handler se ejecuta silenciosamente sin hacer nada.

**How to apply:**
- Para **eliminar páginas/componentes**: NO intentar vía JS. El usuario debe hacer el click real en el navegador.
- Flujo para el usuario: App IDE → seleccionar la página en el árbol → click en "Más" → click en "Eliminar" → confirmar.
- Mismo patrón aplica a: borrar workflows, formularios, reportes desde el App IDE toolbar.
- ⚠️ Distinto del tab "Permisos" del portal — ese problema era event delegation jQuery que requería `browser_click` con ref real, no `isTrusted`.
