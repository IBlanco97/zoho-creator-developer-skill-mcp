---
name: Deluge int+string concat bug
description: In Deluge, int + "-mm-dd" may do arithmetic instead of string concat — always call anio.toString() first
type: feedback
---

When a Deluge function parameter is `int anio`, expressions like `toDate(anio + "-01-31")` may perform arithmetic (`2026 - 01 - 31 = 1994`) rather than string concatenation.

**Why:** Deluge's `+` operator is context-sensitive. With an `int` on the left, it may resolve to numeric addition even if the right side looks like a string. The `-` characters in `"-01-31"` are parsed as subtraction.

**How to apply:** Always add `anioStr = anio.toString();` (or `anioStr = "" + anio;`) at the start of any function that takes `int anio` and uses it in `toDate()` calls. Replace all inline `toDate(anio + "...")` with `toDate(anioStr + "...")`. This applies to all Deluge functions using int year parameters for date construction.
