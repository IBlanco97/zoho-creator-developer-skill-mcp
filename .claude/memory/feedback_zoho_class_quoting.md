---
name: Zoho Deluge class attribute quoting bug
description: Never use backslash-escaped single quotes in Deluge HTML strings — Zoho renders class='x' as class="'x'" in the DOM, breaking all CSS selectors
type: feedback
---

When Zoho saves a Deluge function via the App IDE's CodeMirror editor and the code contains `class=\'pa\'` (backslash-escaped single quotes in string literals), Zoho renders the HTML in the portal as `class="'pa'"` — with literal single-quote characters as part of the class value. This causes ALL CSS selectors like `.pa { ... }` to fail to match.

**Why:** The backslash escaping happens when Zoho auto-escapes single-quoted HTML attributes inside Deluge string concatenations. The browser DOM then sees `'pa'` (with quotes) as the class name, not `pa`.

**How to apply:** Always write Deluge HTML string attributes with plain single quotes: `class='pa'`, not `class=\'pa\'`. When a page's CSS suddenly stops working even though the code looks correct, check the DOM element's actual className — if it shows `'pa'` with literal quote chars, the deployed function source has backslash-escaped quotes. Fix by re-injecting the correct source via `cm.setValue()` in App IDE (use chunked window._fc injection if content is large).

Reference case: `DevolverHTMLPanelAsignaciones` — local backup had correct `class='pa'`, deployed version had `class=\'pa\'`, causing the entire Panel de Asignaciones page to render unstyled.
