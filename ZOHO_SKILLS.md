# Skills de Zoho — empaquetadas a nivel de proyecto

Este repo incluye, dentro de `.claude/`, las skills de Claude Code usadas para
desarrollar sobre esta app de Zoho Creator (`human-resource-management`). Antes
vivían solo en `~/.claude/commands/` y `~/.claude/skills/` (config global de un
único equipo/usuario); ahora están versionadas aquí para que cualquiera que
clone el repo tenga el mismo contexto de trabajo sin configurar nada a mano.

## No hay que "desempaquetar" nada

Claude Code descubre automáticamente dos carpetas dentro de la raíz de un
proyecto:

- `.claude/commands/*.md` → comandos slash (`/nombre-del-archivo`)
- `.claude/skills/<nombre>/SKILL.md` → skills invocables por nombre o por
  contexto (el propio Claude Code las sugiere cuando el tema encaja)

Con solo **clonar este repo y abrir Claude Code dentro de la carpeta**, estas
skills aparecen listas para usar — no hace falta copiar archivos, instalar
plugins ni tocar `settings.json`. Es exactamente el mismo mecanismo por el que
`.claude/memory/` ya viaja con el repo.

## Qué contiene cada una

| Comando / Skill | Tipo | Para qué sirve |
|---|---|---|
| `/zoho-creator-dev` | comando | Skill principal: leer/editar Deluge, explorar formularios, gestionar registros, navegar el IDE, generar el Manual de Usuario. Punto de entrada — las demás son módulos complementarios. |
| `/zoho-ide-flows` | comando | Flujos paso a paso del IDE: editar Deluge, ZML de páginas, HTML Snippets, crear workflows (Flujos A–I). |
| `/zoho-api-patterns` | comando | Patrones avanzados: KPIs filtrados, embeds ZML, permisos de portal, `exportScript`, menú builder, rename programático, conditional formatting (Flujos J–Q). |
| `/zoho-errors-ref` | comando | Tabla de errores comunes, limitaciones de la plataforma y su solución. Consultar al depurar. |
| `/zoho-nodejs-dev` | comando | Crear/editar funciones Node.js (o Java) en Zoho Creator — runtime real (v8.14.0), límites, deploy. |
| `/zoho-manual-gen` | comando | Cómo generar el Manual de Usuario de esta app: estructura por módulo/perfil, reglas de estilo. |
| `/zoho-review-session` | comando | Al cierre de sesión: revisa qué se aprendió (errores corregidos, selectores que fallaron, límites de plataforma nuevos) y lo vuelca a `.claude/memory/`. |
| `zoho-permisos-check` | skill | Verifica que los permisos de portal (TAB permissions) de páginas/formularios/reportes coincidan con la matriz de roles del proyecto. |

Todas menos `zoho-permisos-check` son **comandos slash** (`.claude/commands/`);
`zoho-permisos-check` es una **skill** completa (`.claude/skills/<nombre>/SKILL.md`).
La diferencia es solo de mecanismo de invocación — en contenido, todas cumplen
el mismo rol: contexto reutilizable sobre cómo trabajar con esta app.

## Si quieres tenerlas también a nivel global (todos tus proyectos)

Copia los archivos a tu carpeta de usuario:

```powershell
# Comandos
Copy-Item .claude\commands\zoho-*.md "$env:USERPROFILE\.claude\commands\" -Force

# Skill
Copy-Item .claude\skills\zoho-permisos-check "$env:USERPROFILE\.claude\skills\" -Recurse -Force
```

Ojo: si ya tienes versiones globales de estos comandos, esto las sobrescribe.
Compara antes con `diff` si te importa no perder ediciones locales.

## Mantenimiento

Estas skills están vivas — se actualizan con lo aprendido en cada sesión
(ver `/zoho-review-session`). Si editas la versión global en `~/.claude/commands/`
o `~/.claude/skills/`, recuerda propagar el cambio también aquí para que el
resto del equipo se beneficie:

```powershell
Copy-Item "$env:USERPROFILE\.claude\commands\zoho-*.md" .claude\commands\ -Force
Copy-Item "$env:USERPROFILE\.claude\skills\zoho-permisos-check\SKILL.md" .claude\skills\zoho-permisos-check\ -Force
```
