# Plataforma Upload Worker — Plan & Estado

> Subida automática de documentos vigentes a las plataformas CAE registradas en cada cliente, vía un worker externo Node + Playwright que opera en nombre de SICMA como contratista.

**Última actualización**: 2026-05-04
**Estado global**: 🟡 Discovery completa para CTAIMA; **Fase B (schema Zoho) completa**; scripts genéricos discovery preparados para Dokify/UCAE/e-coordina; implementación adapter en pausa pendiente Q1 (timeline Twind).

> Inventario re-verificado 2026-05-04 contra Zoho REST: e-coordina cubre **12 cuentas** (no 5), todas multi-tenant sobre `v5.e-coordina.com/<cliente>`. Convergencia CTAIMA+e-coordina+Twind alcanza ~70%+ del inventario real.

---

## ⚠️ Preguntas abiertas (bloqueantes)

> Estas preguntas no tienen respuesta a fecha de hoy. Hasta que se resuelvan, el proyecto queda en pausa en el punto indicado.

### Q1 — Timeline de migración a Twind
**Pregunta**: ¿Cuándo migran los 4 clientes que usan CTAIMA actualmente a la nueva plataforma Twind? ¿Y los 5 de e-coordina?

**Por qué bloquea**: el banner del login de CTAIMA anuncia explícitamente la convergencia CTAIMA + e-coordina → Twind. Si la migración es inminente (Q3-Q4 2026), invertir en un adapter CTAIMA legacy es trabajo perdido y conviene esperar a Twind. Si no hay timeline claro o es a largo plazo (>12 meses), implementamos CTAIMA ahora y migramos cuando toque.

**Quién puede responder**: SICMA (cuenta cae@sicma21.com / rrhh@sicma21.com tienen acceso al cliente CTAIMA), o contactar al grupo CTAIMA directamente.

**Estado**: ❓ pendiente — el usuario no tiene la respuesta a fecha 2026-05-03.

**Acciones bloqueadas hasta Q1**:
- Fase C — Implementación adapter CTAIMA
- Fase D — Wiring Zoho ↔ Worker (App Variables, pegar Deluge functions, botón cliente)
- Fase E — Validación end-to-end
- Decisión sobre prioridad de discovery: ¿CTAIMA, e-coordina o Twind primero?

**Acciones que SÍ podemos hacer mientras**:
- Fase B (parcial) — añadir campos a Zoho schema (`IdEmpPromotora_CTAIMA`, etc.) ya queda preparado independientemente
- Fase F.1/F.2 — Discovery e-coordina, Dokify, UCAE (plataformas que NO van a Twind)

---

## 1. Objetivo

Cuando una persona de RRHH pulsa "Enviar a plataformas" en la ficha de un cliente Zoho, el sistema debe:

1. Recolectar los documentos vigentes de SICMA que el cliente requiera (modelos asignados a Empresa / Trabajadores / Autónomos).
2. Enviarlos automáticamente a la plataforma CAE de ese cliente (CTAIMA, e-coordina, Twind, Dokify, etc.) usando las credenciales registradas en la Forma de Envío de Zoho.
3. Registrar el resultado por documento en `Envio_Plataforma_Log` (queued → ok|fail|skipped).
4. Tolerar fallos parciales: que un documento falle no debe bloquear los demás.

Con esto se elimina el trabajo manual de subir N documentos × M plataformas cada vez que algo expira.

---

## 2. Arquitectura

```
Zoho Creator                                Worker (Node + Playwright)
─────────────                               ──────────────────────────
[Botón "Enviar a plataformas"]
   │ EnviarDocumentosAPlataformas(cliId)
   │   • recoge 3 listas modelos (trabajador, empresa, autónomo)
   │   • TOP 1 Subir_Documento vigente por modelo
   │   • filtra Formas_de_Env_o == "Plataforma"
   │   • inserta seed Envio_Plataforma_Log {Estado:"queued", Job_ID}
   ▼
   invokeurl POST /jobs ─────────────►  enqueue(job) → 202 {job_id}
                                        │
                                        ▼
                                        Promise.allSettled(downloads ZohoFiles)
                                        │   • fail-per-doc tolera errores
                                        ▼
                                        for each forma → pickAdapter(url)
                                        │   ctaima | dokify | nalanda | ecoordina | twind | generic
                                        ▼
   Plataforma_Upload_Callback ◄──────  POST /custom/Plataforma_Upload_Callback
   (cierra seed + insert por result)     {job_id, cliente_id, status, results[]}
```

**Por qué worker externo y no Deluge**:
- Las plataformas CAE no exponen API pública estable. La automatización requiere Playwright sobre la UI.
- El login de CTAIMA usa OpenID Connect — flow no portable a Deluge.
- Playwright necesita un binario Chromium y un sistema de archivos para descargar/subir documentos.

---

## 3. Estado actual por componente

### 3.1 Worker scaffold — ✅ funcional con stubs
- `worker/` con Express + axios + pino + playwright
- `worker/src/types.ts`: `PlatformAdapter`, `UploadJobInput`, `UploadResultItem`, `Job`
- `worker/src/queue.ts`: in-memory queue con `Promise.allSettled` por documento
- `worker/src/zoho.ts`: descarga de ficheros desde Zoho REST con OAuth refresh
- `worker/src/index.ts`: `POST /jobs`, `GET /jobs/:id`, `POST /custom/Plataforma_Upload_Callback`
- Typecheck OK, smoke test OK con creds dummy
- **Pendiente**: adapters reales (todos son stubs por ahora)

### 3.2 Drafts Deluge — ✅ listos para pegar
- `deluge-drafts/EnviarDocumentosAPlataformas.deluge` — orchestration desde Zoho
- `deluge-drafts/PlataformaUploadCallback.deluge` — REST endpoint que recibe resultados
- Ajustados a los link names finales del form `Envio_Plataforma_Log`:
  `Cliente`, `Forma_de_Envio`, `Modelo_de_Documento`, `Documento`, `Estado`, `Mensaje`, `Remote_ID`, `Job_ID`, `Fecha`, `Added_User`

### 3.3 Form `Envio_Plataforma_Log` en Zoho — ✅ creado
Campos creados con drag-drop manual por el usuario:
- `Cliente` lookup → `Nuevo_Cliente`
- `Forma_de_Envio` lookup → `Nueva_Plantilla_Env_o_de_Documentaci_n`
- `Modelo_de_Documento` lookup → `Plantilla` (Nuevo Modelo de Documento)
- `Documento` lookup → `Subir_Documento`
- `Estado` picklist (queued|ok|fail|skipped)
- `Mensaje` multiline
- `Remote_ID` single line
- `Job_ID` single line (unique → indexed)
- `Fecha` datetime
- `Added_User` system field (auto)

### 3.4 Discovery CTAIMA — ✅ completo
Sesión 2026-05-03T18-07-29, output en `worker/discovery/ctaima/2026-05-03T18-07-29/`:
- 10 screenshots fullpage de cada paso
- 4 archivos `.dom.json` con selectores estables y schema completo
- `report.md` ejecutivo con pseudocode del adapter listo para implementar

**Plataformas mapeadas en CTAIMA**:
- Login OIDC → IdentityServer (`login.ctaima.com`)
- Selector empresa cliente vía `selectize.js` accesible programáticamente
- Flow Empresa: `List.asp → Update.asp` con sync multi-empresa via checkboxes
- Flow Trabajador: `List.asp → expand → slot → Update.asp` (95% idéntico al de empresa)
- Logout: `/CTAIMA_CAE/Connections/Tancar.asp`

### 3.5 Discovery resto de plataformas
- ✅ **e-coordina** completo (2026-05-04). Output: `worker/discovery/ecoordina/2026-05-04T10-00-53/`. Vía Playwright MCP, no script CLI.
- ✅ **Dokify** completo (2026-05-04). Output: `worker/discovery/dokify/2026-05-04T10-58-59/`. Vía Playwright MCP.
- ✅ **UCAE** completo (2026-05-04). Output: `worker/discovery/ucae/2026-05-04T16-33-05/`. Vía Playwright MCP.
- ❌ Twind, long-tail no iniciado.

### 3.5a Hallazgos clave e-coordina (2026-05-04)
- **API JSON-ExtJS expone los grids**: `POST /api/public/store.php?form_element=contratacion_singular.grid&store=documentacion_solicitud` lista los slots de documentos sin necesidad de Playwright. Adapter ECOORDINA será 90% HTTP + 10% Playwright (solo upload).
- **Login HTTP-only viable**: `POST /api/public/ajax.php?ajax=login_init` con form-data — captura de cookie + reuso en HTTP requests posteriores.
- **Banner Twind activo en login**: e-coordina vende migración a Twind desde su propio login (UTM `login-ecoordina`). Refuerza Q1 con peso adicional.
- **Slots por coordinación, no por empresa**: e-coordina organiza docs por `coordinacion_id` (no por cliente global como CTAIMA). Schema Zoho podría requerir `IdCoordinacion_ECOORDINA` en `Forma_de_Envio` (opcional, single-line).
- **Menú contextual dinámico por estado del slot** — selectores semánticos estables capturados:
  - `Sin presentar` → `contratacion_singular_grid_submenu_cargar_archivo`
  - `Caducado`/`Validado` (renovación) → `contratacion_singular_grid_submenu_actualizar_archivo` (preserva histórico)
  - `Rechazado` → `contratacion_singular_grid_submenu_corregir_archivo`
- **17 slots vistos en 1 coordinación** del cliente walstead — ejemplos: APTO MÉDICO, EPIS, FORMACIÓN/INFORMACIÓN art.18/19, RLC TC1, Certificado MUTUA, Plan preventivo. Mapping a `Plantilla.Nombre_ECOORDINA` queda como tarea Fase B' (futuro).
- **UI ExtJS 3.x sobre tablas anidadas**: stack obsoleto desde 2012, selectors muy estables (`.x-menu-floating .x-menu-item.<class>`). Sin captcha ni 2FA detectado.
- **Pendientes para producción**: capturar POST exacto del file upload y los campos del modal de upload (no cubierto en read-only).

### 3.5b Hallazgos clave Dokify (2026-05-04)
- **Owner**: Almaglobal SLU / Once For All Group. Email contacto `info.dokify@onceforall.com`. Footer apunta a Nalanda — Once For All ecosystem incluye Dokify + Nalanda.
- **App REST**: URLs predecibles. Adapter Dokify será **0% Playwright tras login** — multipart POST puro a `/app/reqtype/{reqtype_id}/company/{company_id}/attach/upload-file`.
- **1:N cliente** ⭐: una cuenta `sicma21` cubre **17 clientes Dokify** (Alcampo, IKEA ×2, Junca, Bricoman/Obramat, Makro, DIA, Lidl, P&G, etc.). Vs CTAIMA/e-coordina donde 1 cuenta = 1 cliente. Schema Zoho debe consolidar 2 registros Dokify duplicados a 1.
- **42 reqtypes** (modelos de doc). reqtype_id es numérico (e.g. 802=Cert Hacienda, 17=Cert SS, 11702=Pago Salarios). Algunos universales, otros client-specific (e.g. 134141=Acuerdo confidencialidad ASEVI).
- **Wizard upload 4 pasos**: Subir fichero → Selección de solicitudes (multi-cliente checkboxes — Konvergia magic) → Selección de fecha → Confirmar.
- **Konvergia**: red inter-plataforma de Dokify ("sube 1 doc, distribuyamos a N apps"). Si SICMA contrata Konvergia, podría reemplazar adapters CTAIMA/e-coordina/Twind. Investigar antes de invertir en adapters.
- **Schema Zoho recomendado**: añadir `Plantilla.IdReqType_DOKIFY` (numérico, requerido) + `Plantilla.IdCliente_DOKIFY` (numérico, opcional para client-specific).
- Sin captcha, sin OIDC, sin 2FA. Login HTTP-only viable. License Premium expira 13/04/2027.
- **Pendientes producción**: capturar POSTs exactos pasos 2-4 del wizard (requiere subida real con permiso); listar 42 reqtypes completos; investigar API pública `/api`.

### 3.5c Hallazgos clave UCAE (2026-05-04)
- **Plataforma gubernamental**: Generalitat Valenciana + IVACE + EU funded. **NO va a ser absorbida por Twind/Once For All** — Q1 NO bloquea adapter UCAE. Es la plataforma más segura para implementar primero junto con Dokify.
- **App REST**: URLs predecibles (`/empresa/gestion`, `/empresa/consulta/permiso/list?q={idprincipal}`, `/empresa/documentacion/docpendiente/carga?clave={clave}`). Adapter UCAE será **100% HTTP tras login**.
- **1:N empresas vinculadas**: 1 cuenta cubre 6+ empresas (AC Marca, Bebidas Gaseosas, Levantina, Corp Alimentaria, European Partners, Lucta). Las 3 cuentas Zoho UCAE probablemente consolidables a 1.
- **Endpoint upload per-doc**: `POST /empresa/documentacion/docpendiente/carga?clave={clave}` con `clave` (hidden), `fdoc` (date), `fichero` (file). Form ultra-simple (3 campos).
- **Endpoint upload bulk SS** ⭐: `POST /empresa/contrata/documentacion/upload` — UCAE auto-clasifica ITA/RNT/IDC y distribuye a empresas. Mucho más simple que per-doc para SS docs.
- **34 docs por permiso** (1 trabajador × 1 cliente). Codes Dokify-style: `RLC`, `ITA`, `AG TRIBUT`, `F.ALT.5`, `F19MANTENIM`, `EPI`, etc. Schema Zoho: `Plantilla.Codigo_UCAE` (single-line) + `Plantilla.Ambito_UCAE` (Empresa/Trabajador) + `Plantilla.Tipo_UCAE` (Laboral/PRL/Otros) + `Plantilla.Bulk_SS_UCAE` (checkbox).
- Estructura jerárquica: Cuenta → 6 empresas (idprincipal) → N permisos por empresa (idpermiso) → 34 docs por permiso (clave). El adapter descubre `clave` parseando el detalle del permiso (no se guarda en Zoho).
- Sin captcha, sin OIDC, sin 2FA. Login HTTP-only viable.
- **Pendientes producción**: capturar response exacta del POST upload, mapear 34+ codes UCAE a Plantilla, verificar consolidación 3 cuentas Zoho a 1, investigar API JSON `/api`.

### 3.5d Comparativa final 4 discoveries
| Dim | CTAIMA | e-coordina | Dokify | UCAE |
|---|---|---|---|---|
| Stack | Classic ASP + selectize.js | ExtJS 3.x | jQuery + SSR moderno | Bootstrap + jQuery |
| Login | OIDC complejo | Form simple | Form simple | Form simple |
| API expuesta | No | Sí (`store.php`) | Parcial (URLs REST) | Parcial (URLs REST) |
| Cuenta→clientes | 1:1 | 1:1 | **1:N (17)** | **1:N (6+)** |
| Upload | Playwright | Playwright | **HTTP multipart** | **HTTP multipart** |
| Bulk SS auto-clasif | No | No | No | **Sí ⭐** |
| Convergencia futura | → Twind | → Twind | Once For All ecosystem | **Independiente (gov)** |
| Q1 bloquea | Sí | Sí | No | **No** |
| Recomendación POC | esperar Q1 | esperar Q1 | sí (si SICMA contrata Konvergia, podría reemplazar todo) | **sí (más simple, sin riesgo)** |

### 3.5b Schema Zoho Fase B — ✅ B.1 + B.3 completados (2026-05-04)
Campos añadidos vía Playwright + Form Builder Creator 6 (auto-guarda por XHR):

**`Nueva_Plantilla_Env_o_de_Documentaci_n` (Forma de Envío)**:
- `IdEmpPromotora_CTAIMA` (Single Line, type=1) — ID estable cliente CTAIMA
- `Empresa_Cliente_CTAIMA_Nombre` (Single Line, type=1) — display name CTAIMA

**`Plantilla` (Modelo de Documento)**:
- `Nombre_CTAIMA_Empresa` (Single Line, type=1) — texto exacto del slot CTAIMA Empresa
- `Nombre_CTAIMA_Trabajador` (Single Line, type=1) — texto exacto del slot CTAIMA Trabajador

**Pendiente B.2**: capturar `IdEmpPromotora` numérico para los 4 registros CTAIMA actuales — requiere login interactivo en cada cuenta para leer dropdown selectize. Script base disponible en `worker/scripts/discover-platform.mts ctaima` (ver §6 abajo).

### 3.5c Discovery genérico Dokify/UCAE/e-coordina — ✅ scripts listos (2026-05-04)
Generalización del workflow CTAIMA:
- `worker/scripts/fetch-platform-creds.mts <pattern>` — fetcher genérico (pattern regex contra dominio + value de URL field)
- `worker/scripts/discover-platform.mts <platform> [accountIndex]` — discovery genérico, output en `worker/discovery/<platform>/<timestamp>/`
- Read-only guards reutilizados de CTAIMA (`installReadonlyGuards`)
- Login + logout siempre manuales (operator-driven) — evita bloqueos por captcha/2FA

**Credenciales detectadas en Forma_de_Envio** (re-verificado 2026-05-04):
- Dokify: 2 registros (mismo user `sicma21`, URL `http://www.dokify.net`)
- UCAE: 3 registros (2 users distintos: `4xf7.cae` ×2, `sicma21.rrhh` ×1, URL `https://www.ucae.es/UCAE`)
- e-coordina: **12 registros** (no 5 como decía inventario inicial). Todas user `B64648546` (3 con trailing space — limpiados 2026-05-04). Multi-tenant: cada cliente es un subdominio (`/walstead`, `/borges`, `/audensfood`, `/hartmann`, `/dester`, `/geseme`, `/laboratoriossalvat`, `/intermasgroup`, `/fredvic`, `/enplater`, `/freudenbergnw`, `/audensfood`). Excepción: `freudenbergnw` está en `app.e-coordina.com` (no `v5.`) con password distinta.

**Para ejecutar (operador humano)**:
```bash
npx tsx worker/scripts/discover-platform.mts dokify
npx tsx worker/scripts/discover-platform.mts ucae
```
Bloqueante: login manual ante prompt en consola.

### 3.6 Connection / App Variables Zoho — ❌ pendiente
Cambio de plan: usar **App Variables** (`WORKER_URL`, `WORKER_SECRET`) en vez de Custom Connection. La nueva UI de Zoho Creator no expone Custom Service connectors.

UUID worker-secret generado para producción: `724f716a-bc21-4dd9-808b-eb2e9d8fa5f4` (también irá en `worker/.env` real).

### 3.7 Botón "Enviar a plataformas" en ficha cliente — ❌ pendiente
Espera a que el adapter CTAIMA esté implementado y validado.

---

## 4. Hallazgos críticos del discovery CTAIMA

### 4.1 CTAIMA, e-coordina y Twind están convergiendo
Banner en login confirma: "CTAIMA y e-coordina nos unimos para ofrecerte **Twind**, la plataforma más innovadora de gestión de contratistas."

**Implicación**: 3 plataformas top-tier de nuestro inventario (5+4+4 = 13 clientes / 22 reales = ~60%) podrían unificarse en una sola en los próximos meses. Antes de invertir en CTAIMA legacy:
- Confirmar timeline de migración con SICMA o con el grupo CTAIMA
- Si Twind tiene API REST documentada, sería un adapter mucho más simple

### 4.2 Documentos = slots pre-definidos por cliente, no documentos creados
Cada cliente CTAIMA define qué modelos de documentos requiere de su contratista. El adapter NO crea documentos nuevos — encuentra el slot correcto y lo actualiza.

**Implicación de schema Zoho**: cada Plantilla (modelo) Zoho debería tener un mapping textual al nombre del slot CTAIMA (`Nombre_CTAIMA_Empresa`, `Nombre_CTAIMA_Trabajador`). Sin esto el adapter dependería de fuzzy matching ortográfico, frágil entre versiones.

### 4.3 Sincronización multi-empresa (Empresa) ⭐
La pantalla de upload empresa expone checkboxes con TODAS las empresas que requieren ese mismo modelo. **1 upload con N checkboxes = N empresas sincronizadas.**

**Implicación**: para docs comunes (Certificado Hacienda, Seguridad Social, RNT/TC2) el adapter pasa de N uploads → 1. Reducción drástica de tiempo de ejecución.

### 4.4 Identificadores estables CTAIMA
- `IdEmpPromotora` — ID del cliente (estable, ej. 1922 = UQUIFA)
- `IdEmpContrata` — ID del contratista (DOMO21/SICMA)
- `IdLogin` — token de sesión (rota)

**Implicación**: añadir `IdEmpPromotora_CTAIMA` como campo nuevo en `Forma_de_Envio` para mapear `Cliente Zoho → CTAIMA`.

### 4.5 CAE tokens dinámicos
Cada navegación regenera el `cae=` en URL. **No se pueden cachear entre sesiones**. El adapter debe extraer el cae del DOM en cada paso y propagarlo al siguiente.

### 4.6 Schema completo del form Update.asp
Ver `worker/discovery/ctaima/2026-05-03T18-07-29/07-update-form.dom.json` para detalle. Selectores clave:
- `#campo_fecha` (Fechai), `#campo_fecha2` (Fechaf) — fechas
- `#uploadBtn[name=file]` — file input (XHR async upload)
- `textarea[name=Comentario]` — nota opcional
- `#chkSubidaEmpresa_{IdEmpPromotora}` — sync por empresa
- `#chkExpress` — Validación Express
- `#Acept` — submit

---

## 5. Decisiones de diseño tomadas

### 5.1 Modo exploración read-only estricto
Las pruebas de discovery NO deben afectar la documentación en plataformas reales. Convenciones aplicadas:
- NO `setInputFiles` en sesiones de discovery
- NO click en botones submit/Aceptar/Subir/Enviar
- Sí login + navegación + lectura DOM
- Sí logout limpio al final

Implementado en `worker/scripts/readonly-guards.ts` (helpers para futuras sesiones).

### 5.2 Adapter cambia 90% código entre Empresa y Trabajador
Ambos flows convergen en el mismo `Update.asp` con campos casi idénticos. El adapter debe estructurarse como:
```
adaptCtaima(args)
├── login(creds)
├── selectEmpresa(IdEmpPromotora)
├── enterCoordinacion()
├── if (scope === 'empresa') gotoEmpresaList()
│   else: gotoTrabajadorList() + searchByDni() + expand()
├── findSlotByName(documentoModeloNombre) → href Update.asp
├── fillForm(fechas, comentario)
├── uploadFile(filePath)
├── markSyncCheckboxes(empresasIdsSync)
└── submit() + verifySuccess()
```

Pseudocode TypeScript completo en `worker/discovery/ctaima/2026-05-03T18-07-29/report.md`.

### 5.3 Contraseñas — NO migrar a tipo Password
Ver memory `plataforma-upload-worker.md`: Zoho Creator no tiene tipo Password nativo. El campo Single Line con `Encrypt this field` activado ES el equivalente. Cifrado at-rest funciona; los clientes autorizados leen plaintext (necesario para el worker).

### 5.4 Connection vs App Variables
- ❌ Custom Connection — la UI nueva de Zoho no expone Custom Service connector genérico
- ✅ App Variables — `WORKER_URL` (texto) + `WORKER_SECRET` (encriptada)
- En Deluge: `invokeurl [url: WORKER_URL+"/jobs"; headers: {"x-worker-secret": WORKER_SECRET}]`

### 5.5 Login pegado a Playwright
CTAIMA usa OIDC con `response_type=id_token token` y `response_mode=form_post`. Reproducirlo en Deluge requiere implementar el OIDC dance entero, lo cual no compensa el ahorro. Mantener todo el flow en Playwright.

---

## 6. Inventario de plataformas reales (filtrado)

Total registros `Forma_de_env_o1 == "Plataforma online"`: 43
Con URL válida y credenciales: ~22

| Plataforma | Clientes | URL ejemplo | Status discovery |
|---|---|---|---|
| **e-coordina** | 12 | v5.e-coordina.com/<cliente> (multi-tenant) | ✅ completo (2026-05-04) |
| **CTAIMA** | 4 | ctaimacae.net | ✅ completo |
| **Twind** | 4 | welcometotwind.io | ❌ no iniciado (futuro convergente) |
| **UCAE** | 3 cuentas, 6+ empresas vinculadas (1:N) | u5.ucae.es | ✅ completo (2026-05-04) |
| **Dokify** | 2 cuentas, **17 clientes Dokify** (1:N) | app.dokify.net | ✅ completo (2026-05-04) |
| **Etegma/Prevengos** | 2 | etegma.prevengos.com | ❌ no iniciado |
| **B2C Azure** | 2 | b2cqcorppro.b2clogin.com | ❌ no iniciado |
| Quioo, Nalanda, Asemwebservices, SGRed, Coordina+, Validate, Freudenberg | 1 c/u | varios | ❌ long tail |

**12 registros adicionales** tienen el campo URL con sólo el nombre del cliente (no URL real) — datos sucios. Tarea separada de limpieza.

---

## 7. Plan adelante (prioritizado)

### Fase A — Decisión estratégica (bloqueante)
**A.1.** Confirmar con SICMA o con grupo CTAIMA el timeline de migración a Twind.
- Si Q3-Q4 2026 → invertir en Twind, no en CTAIMA legacy
- Si > 12 meses → implementar CTAIMA ahora y migrar a Twind cuando esté disponible

### Fase B — Schema Zoho final
**B.1.** ✅ (2026-05-04) Campos añadidos a `Forma_de_Envio`:
  - `IdEmpPromotora_CTAIMA` (Single Line, type=1)
  - `Empresa_Cliente_CTAIMA_Nombre` (Single Line, type=1)

**B.2.** ❌ Pendiente — capturar `IdEmpPromotora` para los 4 registros CTAIMA actuales (requiere login interactivo).

**B.3.** ✅ (2026-05-04) Campos añadidos a `Plantilla`:
  - `Nombre_CTAIMA_Empresa` (Single Line, type=1)
  - `Nombre_CTAIMA_Trabajador` (Single Line, type=1)

### Fase C — Implementación adapter (depende de A.1)
**C.1.** Implementar `worker/src/adapters/ctaima.ts` siguiendo el pseudocode del report.md

**C.2.** Tests con DOM snapshots capturados — usar los HTML guardados como fixtures Playwright para tests offline

**C.3.** Capturar el endpoint XHR exacto del file upload (con DevTools network filter en una sesión real con permiso de subida)

**C.4.** Mode dry-run: ejecuta el flow completo pero NO clicka submit final — útil para validar selectores en producción sin riesgo

### Fase D — Wiring Zoho ↔ Worker
**D.1.** Crear App Variables `WORKER_URL` + `WORKER_SECRET` en Zoho Settings → Variables

**D.2.** Pegar `EnviarDocumentosAPlataformas.deluge` como function en `Calendario52HTML`

**D.3.** Pegar `PlataformaUploadCallback.deluge` como function en `Calendario52HTML` y publicarla como REST endpoint

**D.4.** Añadir botón "Enviar a plataformas" en form `Nuevo_Cliente`

### Fase E — Validación end-to-end
**E.1.** Desplegar worker en host LAN (`192.168.70.15:8787` provisional)

**E.2.** Test con un cliente CTAIMA real, 1 documento, dry-run — verificar que el flow completa sin errores

**E.3.** Test real con 1 documento → 1 plataforma → 1 cliente

**E.4.** Test masivo: 1 documento → sync a N empresas en 1 upload

### Fase F — Resto de plataformas
**F.1.** Discovery e-coordina (mismo proceso que CTAIMA, ~30 min)

**F.2.** Discovery Dokify, UCAE

**F.3.** Discovery Twind (si va a ser la convergente, prioridad alta)

**F.4.** Long tail (Quioo, Nalanda, etc.) — fallback genérico que sólo notifica al operador humano

---

## 8. Files de referencia

| Path | Contenido |
|---|---|
| `worker/` | Worker Node + Playwright (scaffold + adapters stub) |
| `worker/discovery/ctaima/2026-05-03T18-07-29/` | Discovery CTAIMA completo |
| `worker/discovery/ctaima/2026-05-03T18-07-29/report.md` | Pseudocode del adapter listo |
| `worker/scripts/readonly-guards.ts` | Helpers para futuras sesiones discovery |
| `worker/scripts/discover-ctaima.mts` | Script automatizado de discovery (con pausas humanas) |
| `worker/scripts/fetch-ctaima-creds.mts` | Extrae credenciales CTAIMA de Zoho |
| `deluge-drafts/EnviarDocumentosAPlataformas.deluge` | Function Zoho — orchestrator |
| `deluge-drafts/PlataformaUploadCallback.deluge` | Function Zoho — callback REST |
| `check_plataformas_dominios.mts` | Inventario plataformas por dominio |
| `memory/plataforma-upload-worker.md` | Memoria persistente — apuntadores a este doc |

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Twind reemplaza CTAIMA antes de que terminemos adapter CTAIMA | Media | Alto (trabajo perdido) | Confirmar timeline antes de fase C |
| Cambio de UI en CTAIMA rompe selectores | Baja-Media | Medio | DOM snapshots en tests + monitor en producción |
| Captcha o 2FA aparece en CTAIMA | Baja | Alto (bloqueo total) | Manual login fallback documentado en script discovery |
| Plataforma rate-limita uploads | Media | Medio | Sequential execution + backoff por plataforma |
| Documento subido con metadata incorrecta (fecha mal) | Media | Alto (cliente rechaza) | Dry-run mode + revisión humana en primeras N ejecuciones |
| Login con cuenta SICMA queda bloqueada por intentos fallidos | Baja | Alto | Tests con cuenta dedicada, no la de producción |
| Discovery accidentalmente sube doc real | Muy baja | Crítico | Read-only guards estructurales + hábito de logout-after |

---

## 10. Sesión actual (2026-05-03)

### Hecho
- Form `Envio_Plataforma_Log` creado en Zoho con 10 campos
- Drafts Deluge ajustados a link names finales
- Inventario plataformas reales: 22 plataformas con URL válida
- Discovery CTAIMA completo (10 screenshots + 4 dom.json + report.md + pseudocode adapter)
- Hallazgo crítico: convergencia CTAIMA + e-coordina + Twind
- Hallazgo crítico: sincronización multi-empresa via checkboxes
- Read-only guards documentados para futuras sesiones

### Decisiones tomadas
- Cancelado: Custom Connection en Zoho (UI nueva no la soporta)
- Adoptado: App Variables `WORKER_URL` + `WORKER_SECRET`
- Confirmado: link names finales del form Zoho (Estado, Modelo_de_Documento, Documento, etc.)
- Pivote: NO subir nada en pruebas — solo descubrir flows

### En pausa hasta nueva decisión
- Implementación adapter CTAIMA (espera confirmación timeline Twind)
- Connection/Variables Zoho (depende de adapter listo)
- Discovery resto de plataformas (depende de prioridad: Twind primero o e-coordina primero)

### Próxima sesión, primer paso sugerido
Revisar **§ Preguntas abiertas (Q1)** al inicio de este documento. Mientras Q1 siga sin respuesta:
- Avanzar en lo NO bloqueado: añadir campos Zoho de Fase B, o iniciar discovery de plataformas que NO migran a Twind (Dokify, UCAE).
- Si el usuario ya tiene la respuesta de Q1, marcarla en este documento y desbloquear Fase C en adelante.
