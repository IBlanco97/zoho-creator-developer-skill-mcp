# CTAIMA — Discovery Report

**Sesión**: 2026-05-03T18-07-29
**Cuenta usada**: `cae@sicma21.com` (Forma de Envío Zoho ID 4790826000000845588)
**Cliente investigado**: UQUIFA QUÍMICO FARMACÉUTICA, S.A.U. (IdEmpPromotora=1922)
**Cobertura**: flow login → empresa-cliente → upload empresa-doc + flow trabajador-doc

---

## Hallazgos clave

### 1. Migración a Twind en curso
Banner visible en login: **"CTAIMA y e-coordina nos unimos para ofrecerte Twind"**.
3 plataformas top-tier de nuestro inventario (CTAIMA + e-coordina + Twind = 13 clientes / 22 = ~60% del volumen) están convergiendo. Antes de invertir en CTAIMA legacy conviene confirmar timeline migración con el cliente CTAIMA o con SICMA.

### 2. Auth = OpenID Connect
- Identity Provider: `login.ctaima.com` (IdentityServer)
- Client ID: `loginctaimacae`
- response_type: `id_token token`, response_mode: `form_post`, scope: `openid profile email`
- **Implicación**: el flow de login está pegado a Playwright. No portable a Deluge `invokeurl`.
- Tras submit valido, redirect a callback `/CTAIMA_CAE/connections/valida_IDS.asp` (form_post), que setea sesión y rebota a `/Programas_Admin/SeleccionaEmpresa.asp`.

### 3. Selector de empresa cliente — Selectize.js dataset accesible
Tras login se llega a un dropdown con N empresas cliente. **No hay que abrir el dropdown** — el dataset completo está en `window.jQuery('#listaempresas')[0].selectize.options`:

```ts
{
  name: "DOMO 21 INGENIERIA E INSTALACIONES,S.L.",  // contratista (variante por cliente)
  of: "en UQUIFA QUÍMICO FARMACÉUTICA, S.A.U.",     // empresa cliente
  url: "/CTAIMA_CAE/Programas_Admin/Programas.asp?cae=...",  // endpoint directo
  IdEmpPromotora: "1922",  // ID estable cliente
  IdEmpContrata: "29",     // ID contratista
  IdLogin: "2646946",
  st: 20,                  // 20=activo, 0=inactivo
  mantenimiento: "False"
}
```

**Para el adapter**: skip el dropdown UI, navegar directo al `url` cuyo `IdEmpPromotora` matchee al cliente.

### 4. Cliente dashboard — solo Coordinación activo
5 módulos (Coordinación, Expertise, Gestión Usuarios, Documenta, Tienda) — solo "Coordinación" suele estar habilitado. La gestión documental NO es módulo separado, está dentro de Coordinación.

### 5. Taxonomía de documentos = 5 categorías
- Documentos de Información (recibidos del cliente, read-only para nosotros)
- Documentos de Empresa (CIF de DOMO21)
- Documentos de Trabajadores (1 por trabajador)
- Documentos de Vehículos (no aplica para SICMA actualmente)
- Documentos de Equipos Trabajo (idem)

URLs:
- `/Documentos/Empresas/List.asp?cae=...`
- `/Documentos/Trabajadores/List.asp?cae=...`
- `/Documentos/Vehiculos/List.asp?cae=...`
- `/Documentos/Maquinaria/List.asp?cae=...`

### 6. Documentos = slots pre-definidos (no se crean, se actualizan)
Cada cliente CTAIMA define qué modelos de documentos requiere. Ejemplo UQUIFA Empresa: Certificado Hacienda, Seg. Social, Mutua, Evaluación de Riesgos, Modalidad Preventiva, Planificación Actividad Preventiva, Póliza RC, RLC/TC1, RNT/TC2 — 9 slots.

**Para el adapter**: matching `Plantilla.Nombre_de_la_plantilla` (Zoho) contra el texto del slot CTAIMA. Si no hay match → fail explícito.

### 7. Sincronización multi-empresa (Empresa) ⭐
La pantalla de upload empresa expone un **listado de checkboxes con TODAS las empresas que requieren ese mismo modelo** (21 empresas para Cert. Hacienda).

```html
<input type="checkbox" name="chkSubidaEmpresa_886" value="4|#|2254|#|199|#|0">
<!-- 886 = IdEmpPromotora de Chupa Chups -->
```

**Implicación enorme**: 1 upload con N checkboxes = N empresas sincronizadas en la misma operación. El adapter puede pasar de N uploads → 1 para docs comunes (Hacienda, Seg. Social).

### 8. Sincronización multi-empresa (Trabajador) — limitada
Para docs trabajador, el listado de empresas aparece pero todas dicen **"No se podrá realizar la actualización del documento"** si el modelo es cliente-específico. Sí se sincroniza para modelos genéricos (DNI, certificado médico). Verificar caso por caso.

### 9. CAE tokens dinámicos
Cada navegación regenera el `cae=` en URL. **No se pueden cachear entre sesiones**. El adapter debe extraer el cae de cada paso desde el DOM o headers de la respuesta previa.

---

## Schema completo del form Update.asp

Idéntico para Empresa y Trabajador (con pequeñas diferencias):

| Campo Zoho | Selector CTAIMA | Tipo | Notas |
|---|---|---|---|
| `Fecha_creaci_n_documento` | `#campo_fecha` (name=Fechai) | text | `dd/MM/yyyy` |
| `Fecha_caducidad_documento` | `#campo_fecha2` (name=Fechaf) | text/hidden | hidden=`31/12/2099` si "No aplica" |
| comentario opcional | `textarea[name=Comentario]` | textarea | |
| (binario) | `#uploadBtn[name=file]` | file | XHR async upload |
| flag adjunto | `#AdjuntoSI / #AdjuntoNO` | radio | name=Adjunto |
| motivo no adjunto | `#Otros` | text | si AdjuntoNO |
| sync por empresa | `#chkSubidaEmpresa_{IdEmpPromotora}` | checkbox | solo en empresa, opcional en trabajador |
| validación express | `#chkExpress` | checkbox | opcional |
| submit | `#Acept` | input[submit] | value="Aceptar" |
| cancelar | `input[name=Submit2]` | input[button] | |

Form principal: `<form id="altamod" method="post" enctype="application/x-www-form-urlencoded">`
File upload: `<form id="UploadForm">` — pero la subida real es **XHR async** (no submit del form). Tras seleccionar archivo se popula `#fichero`, `#filesize`, `#extension` (hidden) automáticamente.

---

## Cambios requeridos en Zoho

### Forma de Envío — añadir campos
| Campo nuevo | Tipo | Propósito |
|---|---|---|
| `IdEmpPromotora_CTAIMA` | Single Line | ID estable del cliente en CTAIMA (ej. "1922") |
| `Empresa_Cliente_CTAIMA_Nombre` | Single Line | Display name (ej. "UQUIFA QUÍMICO FARMACÉUTICA, S.A.U.") |
| `URL_Programas_CTAIMA` | URL (opcional) | Cache del primer cae token — se invalida fácilmente, mejor regenerar |

### Forma de Envío — campos ya existentes (reutilizar)
- `Usuario` ✓
- `Contrase_a` ✓
- `Link_de_la_plataforma` ✓
- `Forma_de_env_o1` = "Plataforma online" ✓

### Plantilla (modelo de documento) — añadir mapping opcional
Para cada modelo Zoho, opcionalmente almacenar el **texto exacto** del slot CTAIMA correspondiente:
- `Nombre_CTAIMA_Empresa` (Single Line) — ej. "Certificado de estar al corriente de pagos con Hacienda"
- `Nombre_CTAIMA_Trabajador` (Single Line) — ej. "Certificado de aptitud médica vigente"

Sin esto el adapter dependería de fuzzy matching ortográfico, lo cual es frágil.

---

## Pseudocode del adapter CTAIMA (alto nivel)

```ts
async function uploadCtaima(page: Page, args: {
  creds: { url: string; usuario: string; password: string };
  IdEmpPromotora: string;          // ID cliente CTAIMA
  scope: "empresa" | "trabajador";
  documentoModeloNombre: string;   // matchea texto slot CTAIMA
  trabajadorDni?: string;          // requerido si scope=trabajador
  filePath: string;
  fechaExpedicion: string;         // dd/MM/yyyy
  fechaCaducidad?: string;         // dd/MM/yyyy o null si no aplica
  comentario?: string;
  empresasIdsSync?: string[];      // IdEmpPromotora de empresas adicionales
  validacionExpress?: boolean;
}): Promise<{ remoteId?: string; status: "ok"|"fail"; message?: string }> {
  // 1. Login (OIDC redirects)
  await page.goto(creds.url);
  await page.fill('input#Username', creds.usuario);
  await page.click('button[type=submit]');
  await page.click('button.btn-primary:has-text("Aceptar")');  // cookie consent
  await page.fill('input#Password', creds.password);
  await page.click('form#loginForm button[type=submit]');

  // 2. Wait for SeleccionaEmpresa, extract dataset
  await page.waitForURL(/SeleccionaEmpresa\.asp/);
  await page.waitForFunction(() =>
    window.jQuery?.('#listaempresas')[0]?.selectize?.options &&
    Object.keys(window.jQuery('#listaempresas')[0].selectize.options).length > 0
  );
  const empresaOpt = await page.evaluate((id) => {
    const opts = Object.values(window.jQuery('#listaempresas')[0].selectize.options);
    return opts.find(o => String(o.IdEmpPromotora) === String(id));
  }, args.IdEmpPromotora);
  if (!empresaOpt) throw new Error(`Cliente CTAIMA con IdEmpPromotora=${args.IdEmpPromotora} no encontrado`);

  // 3. Navigate to client context
  await page.goto(new URL(empresaOpt.url, page.url()).toString());

  // 4. Click "Coordinación" → server redirects to /Admin_promotora/dashboard
  await page.click('div.imagenModulo:has-text("Coordinación")');
  await page.waitForURL(/dashboard\.asp/);

  // 5. Navigate to Documentos List
  if (args.scope === "empresa") {
    await page.click('a:has-text("Documentos Empresa")');
    await page.waitForURL(/Empresas\/List\.asp/);
  } else {
    await page.click('a:has-text("Documentos Trabajador")');
    await page.waitForURL(/Trabajadores\/List\.asp/);

    // 5b. Buscar trabajador por DNI
    await page.fill('input.search', args.trabajadorDni!);
    await page.click('button.search');
    await page.waitForLoadState('networkidle');

    // 5c. Expandir trabajador
    await page.click(`button[name="Expandir0"]`);  // primero/único tras filtrar
    await page.waitForLoadState('networkidle');
  }

  // 6. Encontrar fila del slot por texto del documento
  const updateLink = await page.evaluate((nombreModelo) => {
    const row = [...document.querySelectorAll('tr')].find(r =>
      r.textContent?.includes(nombreModelo) && r.querySelector('a:has(i.fa-cloud-upload)')
    );
    return row?.querySelector('a:has(i.fa-cloud-upload)')?.getAttribute('href') || null;
  }, args.documentoModeloNombre);
  if (!updateLink) throw new Error(`Slot "${args.documentoModeloNombre}" no encontrado`);
  await page.goto(new URL(updateLink, page.url()).toString());

  // 7. Llenar form
  await page.fill('#campo_fecha', args.fechaExpedicion);
  if (args.fechaCaducidad) await page.fill('#campo_fecha2', args.fechaCaducidad);
  if (args.comentario) await page.fill('textarea[name=Comentario]', args.comentario);
  await page.check('#AdjuntoSI');

  // 8. Subir archivo (dispara XHR upload)
  await page.setInputFiles('#uploadBtn', args.filePath);
  await page.waitForFunction(() =>
    document.querySelector<HTMLInputElement>('#fichero')?.value?.includes('Fichero')
  );

  // 9. Marcar checkboxes de sync (si aplican)
  for (const id of (args.empresasIdsSync || [])) {
    const sel = `#chkSubidaEmpresa_${id}`;
    if (await page.locator(sel).count() > 0) {
      await page.check(sel);
    }
  }

  if (args.validacionExpress) await page.check('#chkExpress');

  // 10. Submit
  await page.click('#Acept');
  await page.waitForURL(/List\.asp/, { timeout: 60_000 });

  // 11. Validar éxito (página List, fichero subido aparece en la fila)
  return { status: "ok" };
}
```

---

## Files de evidencia

| Step | Archivo | Contenido |
|---|---|---|
| 01 | `01-landing.{png,dom.json}` | Login page |
| 02 | `02-login-step2.{png,dom.json}` | OIDC IdentityServer password |
| 03 | `03-empresa-selector.{png,dom.json}` | Selectize.js dataset |
| 04 | `04-programas-uquifa.png` | Cliente dashboard 5 módulos |
| 05 | `05-dashboard-coordinacion.png` | KPIs por categoría doc |
| 06 | `06-docs-empresa-list.png` | List con 9 slots empresa |
| 07 | `07-update-form.{png,dom.json}` | **Schema completo upload empresa** |
| 08 | `08-docs-trabajador-list.png` | List con 9 trabajadores |
| 09 | `09-trabajador-expanded.png` | Trabajador expandido con 11 slots |
| 10 | `10-trabajador-update-form.{png,dom.json}` | Schema upload trabajador |

---

## Próximos pasos sugeridos

1. **Confirmar con cliente CTAIMA o SICMA** la roadmap de migración a Twind. Si es Q3-Q4 2026 → invertir en Twind, no en CTAIMA legacy.
2. **Añadir campos a Zoho Forma de Envío**: `IdEmpPromotora_CTAIMA` + `Empresa_Cliente_CTAIMA_Nombre`. Capturar valores manualmente para los 4 registros CTAIMA actuales (verificar el dropdown al loguearse en cada cuenta).
3. **Discovery e-coordina** — segunda más usada (5 clientes). Si UI similar a CTAIMA (mismos vendors), reutilizar pattern.
4. **Discovery Twind** — la versión de futuro. Si tiene API REST documentada → adapter mucho más simple.
5. **Implementar adapter CTAIMA** siguiendo el pseudocode + mocking en tests con DOM snapshots capturados aquí.
