# Dokify Discovery — 2026-05-04T10-58-59

**Account**: `sicma21` (DOMO21 INGENIERIA E INSTALACIONES SL, CIF B64648546)
**Forma de Envío IDs**: `4790826000000845163` y `4790826000000845042` (2 cuentas idénticas en Zoho)
**Landing URL**: `http://www.dokify.net` → redirect → `https://www.dokify.net/` (marketing)
**App URL**: `https://app.dokify.net/app/company/119281`
**company_id Dokify**: `119281`
**License**: Premium - Mediana Empresa - exp 13/04/2027
**Conducted via**: Playwright MCP, no script CLI

---

## TL;DR

**Dokify es una app REST CRUD con URLs predecibles.** El adapter Dokify será **0% Playwright tras el login** — todo se hace con multipart POST puro. Drásticamente más simple que CTAIMA o e-coordina.

**Endpoint clave de upload**:
```
POST https://app.dokify.net/app/reqtype/{reqtype_id}/company/{company_id}/attach/upload-file
Content-Type: multipart/form-data
Field: file (binary)
```

**Filosofía Konvergia**: 1 file upload → multi-cliente assign. SICMA sube el doc UNA vez y Dokify lo replica a los 16 clientes que lo solicitan.

---

## Hallazgos críticos

### H1 — Dokify es Once For All / Almaglobal SLU
- Logo: "a ONCE FOR ALL company"
- Email contacto: `info.dokify@onceforall.com`
- Footer: "© Almaglobal SLU"
- Footer también enlaza a `nalandaglobal.com` — Nalanda (long-tail en nuestro inventario) es del MISMO grupo Once For All

**Implicación**: si SICMA tiene clientes en Nalanda (1 registro en nuestra Forma_de_Envio), probablemente la misma plataforma con branding distinto, o accesible vía la red de Dokify.

### H2 — UN account sicma21 cubre 17 clientes ⭐
A diferencia de CTAIMA (1 cuenta = 1 cliente) y e-coordina (1 subdominio = 1 cliente), **un único login en Dokify expone N clientes**. Visibles en dashboard:

| Cliente | client_id Dokify |
|---|---|
| Alcampo | 34801 |
| IKEA IBÉRICA | 102782 |
| IKEA DISTRIBUTION SERVICES SPAIN | 111595 |
| HERMANDAD FARMACEUTICA DEL MEDITERRANEO (Grupo Hefame) | 167642 |
| JUNCA GELATINES | 142187 |
| Clinical Nutrition (CN Labs) | 267133 |
| BRICOLAJE BRICOMAN (Obramat) | 116919 |
| MAKRO | 94287 |
| Kave Home - Julià Grup | 375563 |
| DIA RETAIL ESPAÑA | 245101 |
| LIDL SUPERMERCADOS | 94624 |
| BC NONWOVENS | 391740 |
| PROTEIN SA | 327187 |
| PROCTER & GAMBLE MATARO | 117673 |
| PURAC BIOQUIMICA (Corbion) | 102025 |
| ASEVI HOME BRANDS | 96873 |
| BIMBO IBERIA | (no client_id capturado en este pase) |

**Implicación schema Zoho**: Dokify NO escala 1:1 con `Forma_de_Envio`. **Una sola Forma_de_Envio cubre todos los clientes Dokify**. La info del cliente se guarda en `Plantilla.IdCliente_DOKIFY` (cuando es client-specific) o se autodetecta vía API (cuando es universal).

**Acción**: los 2 registros Dokify duplicados en Zoho (ID `4790826000000845163` y `4790826000000845042`) probablemente son redundantes. Verificar con SICMA y consolidar a uno solo.

### H3 — URLs REST predecibles ⭐⭐⭐
Sin necesidad de DevTools — todas las rutas se derivan del DOM:

| Recurso | URL |
|---|---|
| Dashboard | `/app/company/{company_id}` |
| Empresas | `/app/company/{company_id}/companies/` |
| Clientes | `/app/client?company={company_id}` |
| Empleados | `/app/employee?company={company_id}` |
| Máquinas | `/app/machine?company={company_id}` |
| Documentos (solicitudes) | `/app/company/{company_id}/documents` |
| Plantillas | `/app/company/{company_id}/templates` |
| Histórico (uploads) | `/app/company/{company_id}/uploads` |
| Asignaciones | `/app/company/{company_id}/assigns` |
| Archivos | `/app/file/company/{company_id}` |
| Detalle reqtype | `/app/company/{company_id}/reqtype/{reqtype_id}/` |
| **Form upload reqtype** | `/app/reqtype/{reqtype_id}/company/{company_id}/attach` (redirige a `/upload-file?action=attach`) |
| **POST upload** | `/app/reqtype/{reqtype_id}/company/{company_id}/attach/upload-file` (multipart) |
| Filter docs por cliente | `/app/company/{company_id}/documents?client={client_id}&mandatory={0|1}` |
| Descargar ZIP todos | `/app/company/{company_id}/documents/zip` |
| Logout | `/app/account/logout` |
| Profile | `/app/settings/profile` |

### H4 — reqtype_ids capturados (10 muestras)

| reqtype_id | Documento (Dokify) |
|---|---|
| 16269 | Acreditación recibí de Coordinación de Actividades Empresariales |
| 103241 | Acreditación recibí documentación PRL empresas contratistas |
| 103667 | Actuaciones en caso de emergencia para personal externo Junca |
| 134141 | Acuerdo de confidencialidad ASEVI |
| 16201 | Acuerdo de coordinación de actividades empresariales |
| 106089 | Anexo A - Documento acreditativo de petición y entrega |
| 29683 | Certificado de cumplimiento legal Bricomart |
| 802 | Certificado de estar al corriente de las obligaciones tributarias |
| 17 | Certificado de negatividad por descubiertos de la Tesorería |
| 11702 | Certificado de Pago de Salarios |

Total observado: **42 reqtypes** en SICMA Dokify (3 páginas, 10 por página + algunas extra).

**Algunos reqtypes son client-specific** (su nombre lleva el cliente — e.g. "Bricomart", "ASEVI", "Junca"). Otros son universales (Hacienda, SS).

**Implicación schema**: `Plantilla.IdReqType_DOKIFY` (single-line numérico, requerido) + `Plantilla.IdCliente_DOKIFY` (single-line numérico, opcional para client-specific).

### H5 — Form upload de 4 pasos
1. **Subir fichero** — drop zone + input file. Selector: `input#file[name=file]`. Form: `id=file-upload-form`, action=`POST /app/reqtype/{reqtype_id}/company/{company_id}/attach/upload-file`, multipart.
2. **Selección de solicitudes** — checkboxes per cliente (16 mostrados, todos los que solicitan ese reqtype). Aquí se aplica la magia Konvergia.
3. **Selección de fecha** — emisión / caducidad.
4. **Confirmar** — submit final.

**Implicación adapter**: el adapter solo necesita reproducir HTTP requests sin Playwright tras el login. Cada paso es probablemente un POST a una URL distinta del wizard. Para captura completa requiere **una subida real con permiso** (cuenta dummy o autorización SICMA).

### H6 — Konvergia es la red inter-plataforma de Dokify
Marketing pitch en login site:
> *"Konvergia, la red para la conectividad entre plataformas. Sube un documento una única vez y Konvergia se encarga de distribuirlo por el resto de aplicaciones."*

**Implicación estratégica enorme**: si Dokify expone Konvergia API, podría reemplazar partes del worker SICMA. En vez de adapters por plataforma, SICMA podría:
1. Subir docs a Dokify (1 endpoint REST)
2. Konvergia distribuye a CTAIMA / e-coordina / Twind / etc.

**Acción para SICMA**: investigar si Konvergia es accesible (API pública o premium add-on de Dokify) y qué plataformas integra. Footer apunta también a `/api`. Esta podría ser una ruta de menor riesgo que adapters propios.

### H7 — Sin captcha, sin OIDC, sin 2FA
Login form simple POST: user + pass. Selectors `#user_identifier` y `#password`. Botón submit `#login-id-button`. Sesión por cookie tras submit. Login HTTP-only viable trivialmente.

### H8 — UI moderna pero con quirks
- Stack: jQuery + custom CSS (no React/Vue). Server-side rendered con interactividad JS.
- 971 notificaciones acumuladas — el adapter podría leer la lista (`/app/notifications`) para reportar caducidades inminentes.
- License/expiración expuesta en `#license-options` — útil para warning si próxima a caducar.
- Búsqueda global en navbar — útil para localizar reqtype por nombre fuzzy.

---

## Steps captured

| # | Label | URL |
|---|---|---|
| 1 | 01-marketing-landing | dokify.net (marketing) |
| 2 | 02-after-iniciar-click | login modal abierto |
| 3 | 03-post-login | wizard "Homologación en dokify" (skip "Completar más tarde") |
| 4 | 04-dashboard | `/app/company/119281` con 17 clientes y KPIs |
| 5 | 05-documentos-grid | `/documents` — 42 docs en 3 tabs |
| 6 | 06-network-* | network logs (sin /api endpoints — todo SSR) |
| 7 | 07-reqtype-802-detail | detalle del reqtype 802 — 16 instancias |
| 8 | 08-upload-form | wizard 4 pasos del upload |
| 9 | 09-logged-out | redirect a marketing site tras /logout |

---

## Pseudocode adapter DOKIFY (preliminar)

```typescript
async function adaptDokify(args: {
  user: string;          // 'sicma21'
  password: string;      // 'Sicma21*com'
  companyId: number;     // 119281 (constante para SICMA)
  reqtypeId: number;     // 802 (de Plantilla.IdReqType_DOKIFY)
  clientIds?: number[];  // [34801, 102782, ...] de Plantilla.IdsClientes_DOKIFY (multi)
  filePath: string;
  fechaEmision: Date;
  fechaCaducidad: Date;
}) {
  // 1. Login HTTP-only
  const session = await axios.post('https://app.dokify.net/app/account/login', {
    user_identifier: args.user,
    password: args.password,
    'Checkbox-session': 'on'
  }, { withCredentials: true, maxRedirects: 0 });
  // session cookie en `set-cookie` header → reusar en requests posteriores

  // 2. POST file (paso 1 del wizard)
  const form = new FormData();
  form.append('file', fs.createReadStream(args.filePath));
  const upload = await axios.post(
    `https://app.dokify.net/app/reqtype/${args.reqtypeId}/company/${args.companyId}/attach/upload-file`,
    form,
    { headers: { ...form.getHeaders(), Cookie: session.cookie } }
  );
  // probable response: { file_id, next_step_url }

  // 3. POST selección solicitudes (paso 2)
  // — TODO capturar en sesión real con permiso

  // 4. POST fechas (paso 3)
  // — TODO capturar en sesión real

  // 5. POST confirm (paso 4)
  // — TODO capturar en sesión real

  return { status: 'ok', file_id, clients_attached: args.clientIds.length };
}
```

---

## Schema Zoho recomendado para Dokify

### `Forma_de_Envio` (campos nuevos)
- `IdEmpresa_DOKIFY` (Single Line numérico) — `119281` para SICMA. Quizás constante app-wide, no field en Forma_de_Envio.
- Consolidar 2 registros duplicados a 1.

### `Plantilla` (campos nuevos)
- `IdReqType_DOKIFY` (Single Line numérico, requerido si Plantilla aplica a Dokify) — e.g. `802`, `17`, `11702`.
- `IdCliente_DOKIFY` (Single Line numérico, opcional) — para reqtypes client-specific (e.g. `116919` para "Cert cumplimiento Bricomart"). Si NULL, el adapter selecciona automáticamente todos los clientes que solicitan ese reqtype.

---

## Pendiente para producción (no cubierto en read-only)

- ❌ Capturar POSTs exactos de pasos 2/3/4 del wizard (solo paso 1 inferido por DOM). Requiere subida real con permiso.
- ❌ Capturar response exacta del upload (URL del archivo subido, file_id, etc.).
- ❌ Verificar login HTTP-only end-to-end (interceptar set-cookie y reusarlo).
- ❌ Mapear los 42 reqtypes a `Plantilla` Zoho — fase B'' Dokify.
- ❌ Documentar lista completa de clientes Dokify (17 visibles, ¿hay más en otras páginas?).
- ❌ Investigar si Dokify expone API pública `/api` (mencionada en marketing) — podría reemplazar el approach REST scraping.
- ❌ Investigar Konvergia — ¿es API addon premium? ¿Reemplaza nuestro worker?

## Read-only guard log

- Blocked clicks: 0 — no se intentaron acciones write
- Blocked file inputs: 0 — no se llegó al setInputFiles
- Write requests observed: solo navegación (GET) y heartbeats (`/app/live`). No POSTs destructivos.

---

## Comparativa rápida tras 2 discoveries

| Dimensión | CTAIMA | e-coordina | Dokify |
|---|---|---|---|
| Stack UI | Classic ASP + selectize.js | ExtJS 3.x | jQuery + SSR moderno |
| Login | OIDC complejo | Form simple | Form simple |
| API JSON expuesta | No | Sí (`store.php`) | Parcial (URLs REST sin /api) |
| Cuenta → clientes | 1:1 | 1:1 (subdominios) | **1:N (17 clientes/cuenta)** |
| Upload | Playwright requerido | Playwright requerido | **HTTP multipart puro** |
| Multi-empresa sync | Checkboxes en upload | No (per coordinación) | **Wizard paso 2 (Konvergia)** |
| Caché tokens | No (cae rotativos) | Sí (cookie) | Sí (cookie) |
| Convergencia futura | → Twind | → Twind | Once For All ecosystem |

**Dokify es la plataforma técnicamente más amigable** para automatizar. Ironía: es la que MENOS clientes cubre en nuestro inventario (2 cuentas → 17 clientes Dokify, pero ninguno es de los clientes principales SICMA-CAE como UQUIFA).

---

## Recomendación estratégica revisada

1. **Q1 (timeline Twind)** sigue bloqueando CTAIMA y e-coordina (~70% inventario). 
2. **Dokify NO está bloqueado por Q1** — Once For All es ecosistema independiente. Implementación adapter podría ser de bajo costo si capturamos los 4 POSTs del wizard.
3. **Konvergia** — investigar si Dokify ofrece distribución cross-platform. Si sí, podría reemplazar adapters CTAIMA/e-coordina/Twind. Esto cambiaría TODO el plan.
4. Antes de invertir en adapter Dokify, confirmar con SICMA:
   - ¿Los 16 clientes Dokify están todos asignados a SICMA o son legacy?
   - ¿Hay un campo `Plantilla.IdReqType_DOKIFY` viable de poblar para sus modelos? (mapping ~42 reqtypes ↔ Plantillas Zoho)
   - ¿Konvergia es un add-on contratado?
