# Prompt de continuación — Workflow Gestión de Baja

## Contexto

Estamos trabajando en el proyecto `zoho-mcp`, un servidor MCP (Model Context Protocol) en TypeScript que conecta con la API REST v2.1 de Zoho Creator. La app es `human-resource-management` del workspace `formacion11`.

Ya exploramos y documentamos el workflow de **Gestión de Baja de Empleado**. La documentación está guardada en memoria en:
`/root/.claude/projects/-root-Sicma21-zoho-mcp/memory/workflow-gestion-baja.md`

## Estado actual del workflow de baja

### 5 Formularios principales:
- **Dar de Baja** — Form principal, SIN workflows propios (lógica en Deluge). Reporte: "Gestión de Bajas"
- **Nota sobre Baja Trabajador** — Con Reglas de Campos + Envío de Formulario
- **Requisito de Baja** — Con Reglas de Campos + Envío de Formulario
- **Dar de Alta / Baja a Activos de Empleados** — Con Reglas de Campos + Envío
- **Alta / Baja EPI - Herramientas** — Con Reglas de Campos + Envío + RevertirAccion

### 4 Funciones Deluge (módulo GestionDeBajaEmpleado):
- **CrearBaja** — Crea el registro de baja
- **AbrirEditorNotaBaja** — Abre editor de notas
- **CrearEtiquetaParaRequisitoBaja** — Categoriza requisitos de baja
- **ContabilizarBajaUnidad** — Contabiliza devolución de activos/EPIs (en módulo EPI)

### 1 Página dashboard:
- **"Gestión de Baja de Trabajador"**

## Siguiente paso pendiente

Necesitamos obtener:
1. **Campos del formulario "Dar de Baja"** — usando `get_form_fields("Dar_de_Baja")` o navegando al IDE
2. **Código fuente Deluge** de las 4 funciones del módulo GestionDeBajaEmpleado
3. **Relación con el estado del trabajador** en el form maestro "Nuevo Empleado"

Para esto necesitamos acceso a Zoho. Opciones:
- **Playwright MCP** con sesión autenticada en Zoho Creator (usuario: ecama@sicma21.com)
- **OAuth credentials** en `.env` para usar el MCP server directamente (aún no configurado)

## Instrucción

Continúa el trabajo de exploración del workflow de gestión de baja. Asegúrate de tener Playwright MCP conectado o las credenciales OAuth configuradas. El objetivo es:
1. Obtener los campos exactos del formulario "Dar de Baja"
2. Extraer el código Deluge de CrearBaja, AbrirEditorNotaBaja, CrearEtiquetaParaRequisitoBaja y ContabilizarBajaUnidad
3. Documentar el flujo completo con campos y lógica real
4. Con esa base, proponer mejoras al workflow

Revisa la memoria en `/root/.claude/projects/-root-Sicma21-zoho-mcp/memory/` para el contexto completo.
