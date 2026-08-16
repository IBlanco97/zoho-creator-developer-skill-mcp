# UCAE Discovery — 2026-05-04T16-33-05

**Account**: `4xf7.cae` (CAE SICMA / DOMO21 INGENIERÍA E INSTALACIONES SL, CIF B64648546)
**Forma de Envío IDs**: `4790826000000845669`, `4790826000000845345` (`4xf7.cae` ×2), `4790826000000833342` (`sicma21.rrhh`)
**Landing URL**: `https://www.ucae.es/UCAE` → redirect → `https://u5.ucae.es/login`
**App URL**: `https://u5.ucae.es/empresa/gestion`
**Conducted via**: Playwright MCP, no script CLI

---

## TL;DR

**UCAE es plataforma gubernamental** (Generalitat Valenciana + IVACE + EU funded), modelo distinto a CTAIMA/e-coordina/Dokify (todas privadas). REST CRUD con URLs predecibles. Adapter UCAE será **100% HTTP tras login** — multipart POST puro.

**Endpoints upload clave**:
```
# Upload bulk SS docs (auto-clasifica ITA/RNT/IDC)
POST /empresa/contrata/documentacion/upload
Field: fichero (file)

# Upload per-doc específico  
POST /empresa/documentacion/docpendiente/carga?clave={clave}
Fields: clave (hidden), fdoc (date dd/mm/yyyy), fichero (file)
```

**Como Dokify**, una cuenta UCAE cubre múltiples empresas vinculadas (1:N). 3 cuentas en Zoho probablemente consolidables a 1.

---

## Hallazgos críticos

### H1 — UCAE es gubernamental valenciano + EU funded
Footer y logos: GENERALITAT VALENCIANA + IVACE (Institut Valencià de Competitivitat Empresarial) + Financiado por la Unión Europea + Fondos Europeos + "© UCAE 2024".

**Implicación estratégica**: UCAE NO va a ser absorbido por Twind, Once For All, o ningún consolidador privado. **Adapter UCAE no tiene riesgo de "trabajo perdido"** como CTAIMA/e-coordina (Q1 bloqueante no aplica). Es una de las plataformas más seguras de implementar primero.

### H2 — UN account → N empresas vinculadas
Cuenta `4xf7.cae` cubre 6+ empresas (con `Nuevo Cliente` botón implícito):
- AC MARCA — Doc Pendiente: 1
- BEBIDAS GASEOSAS DEL NORO... — sin permisos
- COMP. LEVANTINA BEBIDA GAS... — sin permisos
- CORPORACIÓN ALIMENTARIA G... — Permisos: 4
- EUROPEAN PARTNERS (Planta B...) — sin permisos
- LUCTA S.A* — Permisos: 7 ⭐ inspeccionado

**Implicación schema Zoho**: como Dokify, los 3 registros UCAE son redundantes para el adapter (probablemente acceden a empresas distintas pero el endpoint es el mismo). **Consolidar a 1 Forma_de_Envio** y mover el mapping cliente→empresa-UCAE a `Plantilla` o a una tabla aparte.

### H3 — App estructura jerárquica clara
```
Cuenta SICMA
└── 6 Empresas vinculadas (idprincipal=22852, ...)
    └── N Permisos por empresa (idpermiso=1546886, ...)  
        └── 34 Documentos por permiso (clave="48313--1151", ...)
```

`idprincipal` = ID empresa cliente UCAE. `idpermiso` = ID del permiso de acceso (1 trabajador × 1 empresa). `clave` = composite key del slot de doc.

**Captura de identifiers**:
- LUCTA S.A*: idprincipal=22852, numpermisos=7
- Permiso DELGADO ORELLANA en LUCTA: idpermiso=1546886, 34 docs
- Slot RLC en ese permiso: clave="48313--1151", id-carga=4309587, ámbito=Empresa, tipo=Laboral

### H4 — URLs REST predecibles ⭐⭐⭐
| Recurso | URL |
|---|---|
| Login form | `/login` |
| Login submit | `POST /dologin` (campos `username`, `password`) |
| Dashboard | `/empresa/gestion` |
| Trabajadores | `/empresa/trabajador/list` |
| Vehículos | `/empresa/vehiculo/list` |
| Crear permiso | `/empresa/solicitud/new` o `/empresa/solicitud/new?idprincipal={id}` |
| Listado permisos por cliente | `/empresa/consulta/permiso/list?q={idprincipal}` |
| Detalle permiso | `/empresa/consulta/permiso/view?id={idpermiso}` |
| Listado doc pendiente por cliente | `/empresa/contrata/documentacion/pendiente?q={idprincipal}` |
| Detalle "carga" tipo | `/empresa/documentacion/carga/view?id={id_carga}` |
| Ver adjunto subido | `/empresa/documentacion/cargap/veradjunto?id={id_documento}` |
| **Form upload per-doc** | `GET/POST /empresa/documentacion/docpendiente/carga?clave={clave}` |
| **Form upload bulk SS** | `POST /empresa/contrata/documentacion/upload` |
| Logout | `/logout` |

### H5 — Form upload per-doc (3 campos) ⭐
```html
<form id="fupload" action="/empresa/documentacion/docpendiente/carga?clave=48313--1151" enctype="multipart/form-data">
  <input type="hidden" name="clave" value="48313--1151">
  <input type="text" name="fdoc">     <!-- fecha documento dd/mm/yyyy -->
  <input type="file" name="fichero">
</form>
```

**Adapter UCAE per-doc**:
```typescript
const form = new FormData();
form.append('clave', slotKey);
form.append('fdoc', formatDate(fechaEmision, 'dd/MM/yyyy'));
form.append('fichero', fileStream);
await axios.post(`https://u5.ucae.es/empresa/documentacion/docpendiente/carga?clave=${slotKey}`, form, { headers: { ...form.getHeaders(), Cookie: sessionCookie } });
```

### H6 — Bulk upload con auto-clasificación ⭐
```
POST /empresa/contrata/documentacion/upload
Field: fichero (file)
```

UCAE acepta archivos originales de la Seguridad Social (formatos `.msg` o `.pdf`) y **auto-detecta** si es ITA/RNT(TC2)/IDC. Los procesa y distribuye automáticamente a las empresas vinculadas que los requieren.

**Implicación adapter**: si SICMA tiene ITA/RNT/IDC PDF originales, basta con un POST único y UCAE hace todo el resto. **Mucho más simple que per-doc upload**.

### H7 — 34 docs por permiso (vista DELGADO ORELLANA en LUCTA)
Ejemplos de docs requeridos por UCAE para un permiso típico (mantenimiento general con trabajo en altura):

| Code | Documento | Ámbito | Tipo |
|---|---|---|---|
| AG TRIBUT | Certificado Agencia Tributaria | Empresa | Laboral |
| CERT SS MENSUAL | Cert SS estar al corriente pagos | Empresa | Laboral |
| CERT GBL CONC | Cert concierto prevención riesgos laborales | Empresa | PRL |
| LCT.42 | Código de conducta proveedores | Empresa | Otros |
| LCT.40 | Decl responsable restricciones temperaturas extremas | Empresa | PRL |
| RIESGOS-NORMAS | Eval riesgos y normas (×4 centros) | Empresa | PRL |
| EVL.LUCT | Evaluación puesto trabajo (LUCTA) | Empresa | PRL |
| N.SEG Y SALUD | Normas seguridad subcontratadas | Empresa | PRL |
| P.RC.LUCTA | Pago seg responsabilidad civil LUCTA | Empresa | Otros |
| LCT.37 | Pago seg RC límite 1.000.000 | Empresa | Otros |
| plan.lucta | Plan emergencia (×4 centros) | Empresa | PRL |
| RLC | Recibo Liquidación Cotizaciones | Empresa | Laboral |
| ARD11 | Recurso preventivo + formación | Empresa | PRL |
| anexo IV | Acceso trabajadores | Trabajador | PRL |
| L01 | Apto médico Lucta | Trabajador | PRL |
| ESCANTA2 | Doc Alta SS (TA2) / IDC | Trabajador | Laboral |
| EPI | Equipos protección individual | Trabajador | PRL |
| F.ALT.5 | Formación PRL específica altura | Trabajador | PRL |
| F19MANTENIM | Formación art.19 mantenimiento | Trabajador | PRL |
| ITA | Informe trabajadores en activo | Trabajador | Laboral |
| L02 | Listado equipos trabajo | Trabajador | Otros |
| LCT.31.1 | Normas seg alimentaria externos | Trabajador | PRL |
| TC2T-ACT | Relación nominal trabajadores (RNT) | Trabajador | Laboral |
| ... | (+10 más) | | |

**Implicación schema Zoho**: `Plantilla.Codigo_UCAE` (single-line, e.g. "RLC", "ITA", "AG TRIBUT") + `Plantilla.Ambito_UCAE` (picklist Empresa/Trabajador) + `Plantilla.Tipo_UCAE` (picklist Laboral/PRL/Otros).

### H8 — Cards "fallos=N" detectables
Cada card de empresa tiene atributos: `idprincipal`, `numpermisos`, y dentro de cada permiso `fallos="0"`. El adapter puede consultar el listado de permisos antes de subir y reportar "0 fallos" como verificación.

### H9 — Sin captcha, sin OIDC, sin 2FA
Login form simple POST. Cookie de sesión tras submit. Login HTTP-only viable trivialmente.

### H10 — Sidebar Informes con vista cross-cliente
- Solicitudes (los permisos creados)
- Permisos (vista global)
- **Próximas Caducidades** ⭐ — el adapter podría consultar esto y reportar a Zoho qué docs están próximos a caducar
- Ver documentos descargados
- Libros de subcontratación
- Ver empresas vinculadas
- Histórico a fecha

---

## Steps captured

| # | Label | URL |
|---|---|---|
| 1 | 01-landing | `/login` (login form) |
| 2 | 02-post-login | `/empresa/gestion` (dashboard 6 empresas vinculadas) |
| 3 | 03-doc-pendiente-lucta | `/empresa/contrata/documentacion/pendiente?q=22852` (1 doc pendiente RLC en LUCTA) |
| 4 | 04-upload-form | `/empresa/contrata/documentacion/upload` (bulk SS auto-clasifica) |
| 5 | 05-crear-solicitud | `/empresa/solicitud/new` (form crear permiso) |
| 6 | 06-permisos-lucta | `/empresa/consulta/permiso/list?q=22852` (7 permisos LUCTA) |
| 7 | 07-permiso-detail | (no nav — click en row sin handler obvio) |
| 8 | 08-permiso-view | `/empresa/consulta/permiso/view?id=1546886` (DELGADO ORELLANA, 34 docs) |
| 9 | 09-carga-view | `/empresa/documentacion/carga/view?id=4309587` (detalle slot RLC + histórico mensual) |
| 10 | 10-upload-form-perdoc | `/empresa/documentacion/docpendiente/carga?clave=48313--1151` (form 3 campos) |

---

## Pseudocode adapter UCAE

```typescript
async function adaptUcae(args: {
  user: string;          // '4xf7.cae'
  password: string;      // (desde Forma_de_Envio / .env — no hardcodear)
  filePath: string;
  fechaEmision: Date;
  // Variant A: per-doc
  clave?: string;        // '48313--1151' (de Plantilla.Clave_UCAE o discovery)
  // Variant B: bulk SS
  bulkSS?: boolean;      // true if file is ITA/RNT/TC2/IDC PDF/MSG original
}) {
  // 1. Login HTTP-only
  const loginForm = new URLSearchParams();
  loginForm.append('username', args.user);
  loginForm.append('password', args.password);
  const loginResp = await axios.post('https://u5.ucae.es/dologin', loginForm, { maxRedirects: 0 });
  const cookie = loginResp.headers['set-cookie']?.join('; ') || '';

  // 2. Variant A: per-doc upload
  if (args.clave) {
    const form = new FormData();
    form.append('clave', args.clave);
    form.append('fdoc', formatDate(args.fechaEmision, 'dd/MM/yyyy'));
    form.append('fichero', fs.createReadStream(args.filePath));
    const r = await axios.post(
      `https://u5.ucae.es/empresa/documentacion/docpendiente/carga?clave=${args.clave}`,
      form,
      { headers: { ...form.getHeaders(), Cookie: cookie } }
    );
    return parseResponse(r);
  }

  // 3. Variant B: bulk SS auto-clasificación
  if (args.bulkSS) {
    const form = new FormData();
    form.append('fichero', fs.createReadStream(args.filePath));
    const r = await axios.post(
      'https://u5.ucae.es/empresa/contrata/documentacion/upload',
      form,
      { headers: { ...form.getHeaders(), Cookie: cookie } }
    );
    return parseResponse(r);
  }

  throw new Error('Either clave or bulkSS must be set');
}
```

---

## Schema Zoho recomendado para UCAE

### `Forma_de_Envio` — consolidar
- 3 registros UCAE (`4xf7.cae` ×2 + `sicma21.rrhh`) probablemente redundantes. Verificar con SICMA y consolidar a 1.

### `Plantilla` — campos nuevos
- `Codigo_UCAE` (Single Line, e.g. "RLC", "ITA", "AG TRIBUT", "F.ALT.5")
- `Ambito_UCAE` (Picklist: Empresa, Trabajador)
- `Tipo_UCAE` (Picklist: Laboral, PRL, Otros)
- `Bulk_SS_UCAE` (Checkbox) — true si es ITA/RNT/TC2/IDC subible vía bulk auto-clasificado

### Strategy: discovery automático de claves
La `clave` ("48313--1151") cambia por permiso. El adapter NO la guarda en Zoho; la descubre vía:
1. `GET /empresa/consulta/permiso/view?id={idpermiso}` → parsear tabla de docs → encontrar el código (RLC, etc.)
2. `GET /empresa/documentacion/carga/view?id={id_carga}` → leer link "Carga de nuevo Documento" → extraer `clave` del query string

Alternativa más limpia: explorar si hay una API JSON `/empresa/api/...` que devuelva slots estructurado. (No exploré en este pase.)

---

## Pendiente para producción (no cubierto en read-only)

- ❌ Capturar response exacta del POST upload (success/error JSON, file_id retornado)
- ❌ Verificar comportamiento de bulk upload con ITA/RNT/IDC originales reales
- ❌ Mapear los 34+ codigos UCAE a Plantilla — fase B''' UCAE
- ❌ Verificar 3 cuentas Zoho UCAE: ¿son distintas empresas vinculadas o redundantes? (probable consolidar)
- ❌ Investigar si UCAE tiene API JSON `/api/...`
- ❌ Validación end-to-end con cuenta dummy o autorización SICMA

## Read-only guard log

- Blocked clicks: 0
- Blocked file inputs: 0
- Write requests observed: solo navegación (GET) y heartbeats. No POSTs destructivos.

---

## Comparativa final 4 plataformas

| Dim | CTAIMA | e-coordina | Dokify | UCAE |
|---|---|---|---|---|
| Stack UI | Classic ASP + selectize.js | ExtJS 3.x | jQuery + SSR | Bootstrap + jQuery |
| Login | OIDC complejo | Form simple | Form simple | Form simple |
| API JSON expuesta | No | Sí (`store.php`) | Parcial (URLs REST) | Parcial (URLs REST) |
| Cuenta → clientes | 1:1 | 1:1 (subdominios) | **1:N (17)** | **1:N (6+)** |
| Upload | Playwright | Playwright | **HTTP multipart** | **HTTP multipart** |
| Bulk SS auto-clasif | No | No | No | **Sí ⭐** |
| Multi-empresa sync | Checkboxes en upload | No | Wizard paso 2 (Konvergia) | Auto via bulk SS |
| Tokens dinámicos | `cae=` rotativo | Cookie | Cookie | Cookie |
| Convergencia futura | → Twind | → Twind | Once For All ecosystem | **Independiente (gov)** |
| Q1 bloquea | Sí | Sí | No | **No** |

**Recomendación de implementación**: UCAE y Dokify son los más simples + sin Q1. Empezar por uno de los dos como POC para validar la arquitectura del worker antes de tocar CTAIMA/e-coordina.
