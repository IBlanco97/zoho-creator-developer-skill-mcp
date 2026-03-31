---
name: Portal permissions tab requires real browser click
description: The Permisos tab in Portal del Cliente settings won't load via JS programmatic clicks — only real Playwright browser_click with a valid ref works
type: feedback
---

El tab "Permisos" del Portal del Cliente en Configuración NO responde a clicks programáticos via JS (`.click()`, `jQuery.trigger('click')`, `dispatchEvent`). El handler está en event delegation en el contenedor padre, no en el `<a>` directamente.

**Why:** Zoho usa delegación de eventos jQuery montada en el contenedor, no en el elemento `<a>` del tab. Las llamadas JS directas no alcanzan el handler.

**How to apply:**
1. Navegar a `settings/edit` (sin hash)
2. Esperar 10s para que cargue completamente con snapshot accesible
3. Click con `browser_click` usando el `ref` del snapshot en el link "Portal del cliente" (sidebar)
4. Esperar carga → aparece sección portal con tabs visibles en snapshot
5. `browser_click` con `ref` en "Permisos" tab → tabla de roles aparece
6. `browser_click` con `ref` en el rol → editor de permisos con 1176 checkboxes
7. Desde aquí, JS funciona para marcar checkboxes y click Actualizar

⚠️ El problema raíz: al navegar con `#portal` en la URL, el portal se carga pero la sección right-panel queda fuera del accessibility tree (snapshot vacío). Sin ref válido, `browser_click` no puede actuar. Solución: navegar sin hash, esperar 10s, entonces el snapshot muestra todo.
