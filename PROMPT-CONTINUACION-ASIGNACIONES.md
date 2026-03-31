## Prompt de Continuación — Panel de Asignaciones: Redirigir botón "Asignar Técnico"

### Contexto del problema

En la app Zoho Creator `human-resource-management` (owner: `formacion11`), hay un **Panel de Asignaciones** (página "Vista Detallada Asignacion") que tiene un botón "Asignar Técnico" que actualmente abre un formulario nuevo llamado **"Asignar Trabajador a Cliente"** que **no funciona**.

El flujo que **sí funciona** es el que existía antes del panel:
- Desde el reporte **"Listado de Clientes"** → clic derecho → acción "Asignar/Desasignar Técnico" → abre el formulario **"Asignar / Desasignar Trabajadores"**
- Desde el reporte **"Listado de Empleados"** → acción "Asignar Cliente" → mismo formulario

Ambos flujos usan el mismo formulario **"Asignar / Desasignar Trabajadores"** que carga los técnicos actualmente asignados al cliente (o los clientes asignados al empleado, según la vista).

### Objetivo

Hacer que el botón "Asignar Técnico" del panel "Vista Detallada Asignacion" abra el formulario **"Asignar / Desasignar Trabajadores"** (el que ya funciona) en lugar del formulario roto "Asignar Trabajador a Cliente".

### Lo que ya sabemos

**Formularios:**
- **"Asignar / Desasignar Trabajadores"** (link_name: `Asignar_Desasignar_Trabajadores`) — El que funciona. Workflows: Field Rules, On Send, Registrar Modificacion Asignaciones, Actualizar Pagina
- **"Asignar Trabajador a Cliente"** (link_name: `Asignar_Trabajador_a_Cliente`) — El nuevo/roto. Workflows similares: Field Rules, On Send, Registrar Modificacion Asignaciones, Actualizar Pagina

**Funciones Deluge relevantes:**
- `AbrirFormAsignarDesasignarEmpleado` — En la página **NuevoCliente**. Esta es la función que abre el formulario funcional desde el Listado de Clientes
- `AsignarCliente` — En la página **NuevoEmpleado**. Flujo desde Listado de Empleados
- `DesasignarCliente` — En la página **NuevoEmpleado**

**Página del panel:** "Vista Detallada Asignacion" (está en la sección Pages del IDE)

### Lo que falta investigar

1. **Leer el código Deluge de `AbrirFormAsignarDesasignarEmpleado`** para entender cómo abre el formulario (openUrl, openPopup, parámetros que pasa como cliente_id, etc.)
2. **Identificar qué acción/botón/script** en "Vista Detallada Asignacion" abre actualmente el formulario roto — puede ser un botón HTML en la página, un workflow, o una acción de reporte
3. **Modificar ese botón/acción** para que llame al mismo flujo que `AbrirFormAsignarDesasignarEmpleado`

### Herramientas disponibles

- **MCP Server Zoho Creator** (compilado en `dist/`): `list_forms`, `get_form_fields`, `get_records`, `invoke_function`, etc. Ejecutar con: `node -e 'import ... from "./dist/tools/..."'` (requiere `dotenv.config()`)
- **Playwright MCP** disponible como plugin para navegar al IDE de Zoho Creator
- **Auth de Playwright** guardada en `.playwright-auth/auth.json`
- **Credenciales** en `.env`: owner=formacion11, app=human-resource-management
- **Documentación del árbol IDE** en `.claude/worktrees/graceful-painting-hartmanis/app-ide-tree.md` (archivo grande, usar grep/offset)

### Plan de acción

1. Usar Playwright para navegar al IDE de Zoho Creator y leer el código Deluge de `AbrirFormAsignarDesasignarEmpleado`
2. Navegar a la página "Vista Detallada Asignacion" y ver cómo está configurado el botón de asignar
3. Modificar el botón/acción para redirigir al formulario correcto

**Nota sobre red:** El DNS puede ser intermitente. Si node/axios falla con EAI_AGAIN, usar `curl --retry 3` como alternativa para la API REST. Playwright debería funcionar porque usa Chromium con su propio resolver.
