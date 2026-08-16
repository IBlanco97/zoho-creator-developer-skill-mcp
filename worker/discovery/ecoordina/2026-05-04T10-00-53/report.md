# e-coordina Discovery — 2026-05-04T10-00-53

**Account**: `B64648546` (DOMO 21 INGENIERIA E INSTALACIONES, S.L.)
**Forma de Envío ID**: `4790826000000845377` (cuenta walstead, índice 0)
**Landing URL**: `https://v5.e-coordina.com/walstead`
**Cliente plataforma**: WALSTEAD (ROTOCOBRHI & EUROHUECO)
**Conducted via**: Playwright MCP (browser tools), no script CLI

---

## Hallazgos críticos

### H1 — e-coordina vende activamente Twind desde su login
El panel derecho del login es un ad de Twind: *"La gestión CAE está cambiando — CTAIMA y e-coordina nos unimos para ofrecerte Twind"* + botón "Descubre más sobre la actualización" + link `https://twind.io/es/preguntas-actualizacion-twind/?utm_medium=referral&utm_source=login-ecoordina`.

**Implicación Q1**: convergencia ya está en marketing activo. Refuerza dramáticamente el bloqueante — invertir en adapter e-coordina legacy puede ser trabajo perdido si Twind absorbe en Q3-Q4 2026.

### H2 — UI ExtJS clásico (3.x) sobre tablas anidadas
Stack: ExtJS 3.x (selectors `x-grid3-row`, `x-menu-floating`, `x-tab-strip`). Biblioteca obsoleta desde 2012. Tables anidadas hasta 5 niveles. Todo el dashboard real corre en `<iframe src="api/public/content.php?content=resumen">`.

**Implicación**: el adapter usa selectors `.x-menu-floating .x-menu-item.<class_semantica>` que son extremadamente estables porque ExtJS no se ha tocado en años.

### H3 — API JSON-ExtJS expone los grids como stores ⭐⭐⭐
e-coordina tiene una API REST-ish documentable:

| Endpoint | Función |
|---|---|
| `POST /api/public/ajax.php?ajax=login_init` | Login (form-data) |
| `POST /api/public/store.php?form_element=contratacion_plural.grid&store=contratacion` | Lista de coordinaciones |
| `POST /api/public/store.php?form_element=contratacion_singular.grid&store=documentacion_solicitud` | **Lista de slots de una coordinación** |
| `POST /api/public/store.php?form_element=contratacion_singular.grid_acceso&store=acceso_gestion` | Grid de accesos |
| `POST /api/public/store.php?form_element=contratacion_singular.grid_biblioteca&store=biblioteca_centro` | Biblioteca de docs |
| `POST /api/public/treestore.php?store=organizacion&order=estructura&expand=centro,empresa` | Árbol organizacional |
| `POST /api/public/form_load.php` | Definición de forms |
| `POST /api/public/event_load.php` | Eventos (heartbeat / refresh / async loads) |

**Implicación**: el adapter puede leer slots vía HTTP puro. Solo el upload requiere Playwright. Cambia la arquitectura del adapter ECOORDINA radicalmente vs CTAIMA: 90% HTTP + 10% Playwright. Reducción de tiempo de ejecución 5-10x estimado.

### H4 — Slots por coordinación, no por empresa global
A diferencia de CTAIMA (que organiza docs por empresa-cliente), e-coordina los organiza **por coordinación**. Cada cliente subdominio (`/walstead`, `/borges`, ...) puede tener N coordinaciones, cada una con su propio set de slots.

**Implicación Zoho schema**: hay que añadir/considerar `IdCoordinacion_ECOORDINA` además de `IdCliente_ECOORDINA` si en el futuro un cliente activa varias coordinaciones simultáneas. Por ahora todos los clientes tienen 1 coordinación activa, así que el campo `Forma_de_Envio.IdCoordinacion_ECOORDINA` puede empezar como single-line opcional.

### H5 — Menú contextual dinámico según estado del slot
Menu items varían según el estado:
- `Sin presentar` (gris) → muestra `Ver` / `Descargar formato` / `Cargar archivo`
- `Validado`, `Caducado`, `Validación pendiente` → muestra menú completo (9 items)

Selectors estables capturados:

| Acción | Class | Aplicable a |
|---|---|---|
| Ver | `contratacion_singular_grid_submenu_view` | siempre |
| Descargar formato | `..._descargar_formato` | siempre |
| Descargar archivo | `..._descargar_archivo` | con archivo |
| Cumplimentar digitalmente | `..._cumplimentar` | slots formulario |
| Actualizar coordinación | `..._cumplimentar_actualizar` | slots formulario con datos |
| **Cargar archivo** | `..._cargar_archivo` | ⭐ Sin presentar (primer upload) |
| Corregir archivo | `..._corregir_archivo` | rechazado |
| **Actualizar archivo (Traspaso a histórico)** | `..._actualizar_archivo` | ⭐ Caducado / Validado (renovación con histórico) |
| Añadir archivo | `..._anadir_archivo` | adjunto adicional |

**Implicación adapter**: NO hardcodear "Cargar archivo" siempre. Leer DOM del menú abierto y elegir action class según estado del slot leído del grid:
- `Sin presentar` → `..._cargar_archivo`
- `Caducado` → `..._actualizar_archivo` (preserva histórico)
- `Validado` próximo a caducar → `..._actualizar_archivo`
- Estado inesperado → abortar y reportar `status=skipped, reason=action_not_available`

### H6 — Slots no son uniformes en tipo (file upload vs forma)
Algunos slots tienen icono de clip 📎 (file attachment) y aceptan upload tipo binario. Otros son formularios estructurados (e.g. "Listado de trabajadores, maquinaria, vehículos y subcontratas que acceden al trabajo") que se rellenan via `Cumplimentar digitalmente` / `Actualizar coordinación` — NO acepta file upload directo.

**Implicación**: adapter debe detectar tipo de slot. Si el menu no expone `..._cargar_archivo` o `..._actualizar_archivo` para ese slot, skip + report. No intentar uploads en formularios estructurados.

### H7 — Coordinación tiene atajos bulk
Botones bottom de la grid Solicitudes:
- `Cargar RNT/Alta SS` — upload bulk para "RLC (TC1) + recibo bancario / Vida laboral de empresa"
- `Cargar ITA` — upload bulk relacionado con ITA
- `Exportar` — descarga listado

**Implicación**: para esos modelos específicos, el adapter podría usar el atajo bulk en lugar del flow per-slot. Optimización futura.

---

## Steps captured

| # | Label | URL |
|---|---|---|
| 1 | 01-landing | login form |
| 2 | 02-post-login | dashboard con KPIs (834 notif, 3 solicitudes incidentadas) |
| 3 | 03-after-coordinaciones-click | grid Listado de coordinaciones |
| 4 | 04-context-menu-coordinacion | right-click sobre coordinación → menu (Ver / Asistente) |
| 5 | 05-coordinacion-detail | tab General de la coordinación |
| 6 | 06-solicitudes-tab | (transición — no cambió aún) |
| 7 | 07-solicitudes-documentos | grid de 17 slots con estados |
| 8 | 08-context-menu-documento | right-click sobre slot Sin presentar → 3 opciones visibles |
| 11 | 11-post-logout | confirm dialog logout |
| 12 | 12-logged-out | login form (clean state) |

---

## Coordinación inspeccionada

```
Trabajo:        2022/10 - 0117 - DOMO21 INGENIERIA E INSTALACIONES
Estado:         En ejecución
Centro:         Rotocobrhi
Empresa contratante: A28352656 - ROTOCOBRHI
Empresa contratada:  DOMO 21 INGENIERIA E INSTALACIONES, S.L. - B64648546
Tipo participación:  Empresa contratista
Fecha inicio:   17/10/2022
Coordinador:    Rosa Bellver Benet
```

## Slots observados (17 docs)

| # | Documento | Estado | Trabajador | Puesto |
|---|---|---|---|---|
| 1 | APTO MÉDICO - Certificado médico | 🟢 Validado | JUAN ANTONIO TORRES, GUTIERREZ | TÉCNICO MANTENIMIENTO |
| 2 | Certificado de estar al corriente de pagos con la Tesorería SS | 🔵 Validación pendiente | — | — |
| 3 | Certificado de la modalidad organizativa de prevención | 🟢 Validado | — | — |
| 4 | Certificado de PAGO DE RECIBOS de los trabajadores AUTÓNOMOS | 🔴 Caducado | JUAN ANTONIO TORRES, GUTIERREZ | TÉCNICO MANTENIMIENTO |
| 5 | Certificado de posesión de Póliza de seguros de Resp. Civil | 🟢 Validado | — | — |
| 6 | Documento de asociación a MUTUA | 🟢 Validado | — | — |
| 7 | EPIS - Registro de entrega de EPI | 🟢 Validado | JUAN ANTONIO TORRES, GUTIERREZ | TÉCNICO MANTENIMIENTO |
| 8 | Evaluación de riesgos de los trabajos | 🟢 Validado | — | — |
| 9 | FORMACIÓN en riesgos laborales del puesto (art. 19) | 🟢 Validado | JUAN ANTONIO TORRES, GUTIERREZ | TÉCNICO MA |
| 10 | INFORMACIÓN en riesgos laborales del puesto (art. 18) | 🟢 Validado | JUAN ANTONIO TORRES, GUTIERREZ | TÉCNICO MA |
| 11 | Listado de trabajadores, maquinaria, vehículos y subcontratas | 🟢 Validado | — | — |
| 12 | Parte de incidente o accidente. Inspecciones | ⚪ Sin presentar | — | — |
| 13 | Planificación preventiva | 🟢 Validado | — | — |
| 14 | RLC (TC1) + recibo bancario / Vida laboral de empresa | 🟢 Validado | — | — |
| ... | ... | ... | ... | ... |

(17 total, verificado en grid)

## Columnas del grid Solicitudes

`Documento` · `Estado` · `Empresa` · `Centro` · `Trabajador` · `Puesto` · `Proyecto` · `Trabajo` · `Coordinación` · `Maquinaria` · `Vehículo` · `Producto Químico` · `Incidentado` · `Tipo doc.` · `F.solicitado` · `F.limite` · `F.cumplimentado` · `F.verificado` · `F.emisión` · `F.caducidad` · `Activo` · ... (+ token IDs hash en últimas columnas, no visible en UI pero presente en DOM)

---

## Pseudocode adapter ECOORDINA (preliminar)

```typescript
async function adaptEcoordina(args: {
  url: string;        // 'https://v5.e-coordina.com/<cliente>'
  user: string;       // 'B64648546'
  password: string;
  documentName: string;  // matches Plantilla.Nombre_ECOORDINA
  filePath: string;
  fechaEmision: Date;
  fechaCaducidad?: Date;
}) {
  // 1. Login HTTP-only (no Playwright needed)
  const session = await loginHttp(args.url, args.user, args.password);

  // 2. Fetch coordinations via store API
  const coordinaciones = await fetchStore(session, 'contratacion_plural.grid', 'contratacion');
  const coord = pickActiveCoordinacion(coordinaciones);  // Estado=='En ejecución'

  // 3. Fetch slots
  const slots = await fetchStore(session, 'contratacion_singular.grid', 'documentacion_solicitud', { coordinacion_id: coord.id });
  const slot = slots.find(s => s.documento_nombre === args.documentName);
  if (!slot) return { status: 'skipped', reason: `slot not found: ${args.documentName}` };

  // 4. Decide action by state
  let actionClass: string;
  if (slot.estado === 'Sin presentar') actionClass = 'contratacion_singular_grid_submenu_cargar_archivo';
  else if (slot.estado === 'Caducado' || slot.estado === 'Validado') actionClass = 'contratacion_singular_grid_submenu_actualizar_archivo';
  else if (slot.estado === 'Rechazado' || slot.estado === 'Anulado') actionClass = 'contratacion_singular_grid_submenu_corregir_archivo';
  else return { status: 'skipped', reason: `unexpected state: ${slot.estado}` };

  // 5. Open Playwright ONLY for upload
  const page = await loadPage(args.url, session.cookie);  // reuse cookies
  await navigateToCoordSolicitudes(page, coord.id);
  await rightClickSlot(page, slot.id);
  await waitForMenu(page);
  await clickMenuItem(page, actionClass);

  // 6. Wait for upload form, fill metadata, setInputFiles
  await page.waitForSelector('input[type=file]');
  await page.locator('input[type=file]').setInputFiles(args.filePath);
  await fillMetadata(page, args.fechaEmision, args.fechaCaducidad);
  await page.click('button:has-text("Subir")');  // TODO confirm exact button label

  // 7. Verify success
  const result = await waitForUploadResult(page);
  return result;
}
```

---

## Pendiente para producción (no cubierto en read-only)

- ❌ Capturar `POST` exacto del file upload (necesita upload real con permiso de subida — o fixture en cuenta dummy)
- ❌ Form fields del modal "Cargar archivo" (Fecha emisión, Fecha caducidad, Comentario, ...) — discovery NO abrió el form para no disparar file picker
- ❌ Mapping `documentName Zoho ↔ slot e-coordina` — requiere fase B'.x: añadir `Plantilla.Nombre_ECOORDINA` y poblar para los ~17 modelos vistos
- ❌ Verificar que login HTTP-only funciona (interceptar POST `ajax=login_init` con DevTools en sesión real)

## Read-only guard log

- Blocked clicks: 0 (no se intentaron clicks en submit/Aceptar/Subir)
- Blocked file inputs: 0 (no se llegó al form de upload)
- Write requests observed: solo `event_load.php` (heartbeat) y `store.php` (reads) — todos seguros

## Convergencia Twind detectada

- Banner activo en login derecha
- UTM tag en link: `?utm_medium=referral&utm_source=login-ecoordina`
- Logo Twind con tagline "Más intuitiva, más ágil, más segura"

Q1 sigue siendo crítico. **Recomendación**: antes de implementar adapter ECOORDINA, contactar grupo CTAIMA/e-coordina para timeline migración Twind. Si Q3-Q4 2026, esperar y atacar Twind directamente.
