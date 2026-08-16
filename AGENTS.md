# Repository Guidelines

## Project Structure & Module Organization
This repository is a Zoho Creator MCP server plus exported app assets and documentation.
- `src/`: TypeScript source for the MCP server (`index.ts`, `auth.ts`, `config.ts`, `tools/`).
- `scripts/`: helper scripts for login, field inspection, and API experiments.
- `zoho-app/`: Zoho app source exports, including `forms/`, `pages/`, `functions/`, and `workflows/`.
- `deluge-drafts/`: working Deluge drafts and backups; keep names descriptive and stable.
- `docs/`: technical docs, manuals, and generated artifacts.
- Root `.json`, `.xml`, `.md`, and `.png` files are often generated evidence or exports; do not delete them casually.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: run the MCP server locally with `tsx`.
- `npm run build`: compile TypeScript into `dist/`.
- `npm start`: run the compiled server from `dist/index.js`.
- For quick checks, use targeted scripts such as `node scripts/get-fields.ts` or `npx tsx scripts/test-api-temp.ts` when applicable.

## Coding Style & Naming Conventions
Use TypeScript with ESM modules and keep formatting consistent with the existing codebase.
- Prefer 2-space indentation and single-purpose functions.
- Use `camelCase` for variables/functions, `PascalCase` only for types/classes, and `kebab-case` or descriptive names for docs and exports.
- Name Zoho artifacts by business purpose, e.g. `DevolverHTMLMisPermisos.deluge`, `W1-RespuestaEI-OnLoad.deluge`.
- No formatter or linter is configured in `package.json`; match the surrounding style before introducing new tooling.

## Testing Guidelines
There is no formal test runner yet.
- Verify changes by running `npm run build` and any relevant helper script.
- For Zoho-facing changes, confirm behavior with the existing screenshots, exports, or manual inspection in Zoho Creator.
- Keep temporary validation files out of version control unless they are useful artifacts.

## Commit & Pull Request Guidelines
History uses short, conventional prefixes such as `feat:`, `fix:`, `docs:`, and `chore:`.
- Keep commit messages imperative and scoped, e.g. `fix: adjust permissions export`.
- PRs should summarize the change, mention verification steps, and include screenshots or exported files when UI or Zoho behavior changes.

## Security & Configuration Tips
Do not commit secrets. Keep credentials in local `.env` files and update `.env.example` when configuration changes.
When working with Zoho exports or permissions, prefer additive updates and preserve prior backups unless the user explicitly asks to replace them.
