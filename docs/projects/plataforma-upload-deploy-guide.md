# Plataforma Upload — Guía de despliegue (pasos 8-11)

Esta guía consolida lo que falta hacer **en el IDE de Zoho Creator** para activar
el adapter UCAE end-to-end. Tiempo estimado: 15-20 min.

Pre-requisitos ya cumplidos:
- ✅ Worker (Node + UCAE adapter) implementado en `worker/` — typecheck OK.
- ✅ Schema fase B'' aplicado: `Plantilla.Codigo_UCAE`, `Plantilla.Bulk_SS_UCAE`,
  `Nueva_Plantilla_Env_o_de_Documentaci_n.IdPrincipal_UCAE`.
- ✅ 17 plantillas pobladas con `Codigo_UCAE` (5 marcadas `Bulk_SS_UCAE=true`).
- ✅ 3 Formas Envío UCAE pobladas con `IdPrincipal_UCAE` (LUCTA=22852,
  CORPORACIÓ GUISSONA=30834, AC MARCA=26974).
- ✅ Form `Envio_Plataforma_Log` existe con sus 9 campos.

---

## Paso 8 · Crear `Plataforma_Upload_Callback` como REST endpoint

**URL IDE**: `https://creator.zoho.com/appbuilder/formacion11/human-resource-management/workflow/edit#Functions`

1. Click "+ Nueva función" → "Custom function".
2. Namespace: `Calendario52HTML` (mismo que las otras funciones de plataforma).
3. Nombre: `Plataforma_Upload_Callback`.
4. Argumento: `payload` (tipo Map).
5. Tipo retorno: Map.
6. Pegar el código de `deluge-drafts/PlataformaUploadCallback.deluge` (líneas 28-87).
7. Click **Guardar**.
8. Una vez guardado, click el botón "···" → **"REST API"** (o icono enchufe).
9. En el panel REST API:
   - Activar "Habilitar como REST endpoint" (ámbito: **OAuth** o "Authenticated").
   - **NO necesitas copiar la publickey** — el worker usa OAuth (refresh-token ya
     configurado) para invocar la función vía
     `POST /creator/v2.1/data/{owner}/{app}/custom/Plataforma_Upload_Callback`.
   - Verificar en `worker/.env` que `ZOHO_CALLBACK_FUNCTION=Plataforma_Upload_Callback`
     (ya es el default en `worker/src/config.ts`).

---

## Paso 9 · Crear `EnviarDocumentosAPlataformas`

1. Misma URL IDE, **+ Nueva función** → Custom function.
2. Namespace: `Calendario52HTML`.
3. Nombre: `EnviarDocumentosAPlataformas`.
4. Argumento: `clienteId` (Number / int).
5. Tipo retorno: String.
6. Pegar el código completo de `deluge-drafts/EnviarDocumentosAPlataformas.deluge`.
7. **Importante** — asegurar que la línea `connection: "platform_worker"` apunta
   a la connection que se crea en Paso 11.
8. Click **Guardar**. Si Deluge IDE muestra error sobre `Plantilla.Codigo_UCAE` o
   `forma.IdPrincipal_UCAE`, refrescar el IDE (los campos nuevos pueden tardar
   unos segundos en aparecer en autocompletado).

---

## Paso 10 · Botón "Enviar a Plataformas" en `Nuevo_Cliente`

**URL IDE form**:
`https://creator.zoho.com/appbuilder/formacion11/human-resource-management/form/Nuevo_Cliente/edit`

1. En Form Builder, ubicar la sección de "Botones" o crear nueva sección.
2. Click "+ Botón".
3. Display Name: `Enviar a Plataformas`.
4. Tipo: **Form Button**.
5. Visibilidad: solo formulario detalle / vista (no edit, no add).
6. Posición: top toolbar (preferible al lado de "Editar") o footer.
7. Permisos: Roles `Gestor RRHH`, `RESPONSABLE CAE`, `SUPER ADMINISTRADOR`,
   `SUPERVISOR`, `OPERARIO CAE`. **NO** `USUARIO TRABAJADOR`.
8. En la pestaña "On Click" → script Deluge:

   ```deluge
   resp = thisapp.Calendario52HTML.EnviarDocumentosAPlataformas(input.ID);
   alert resp;
   ```

   (Esto es exactamente el contenido de `deluge-drafts/Boton-EnviarAPlataformas.deluge`.)

9. Click **Listo** (toolbar) para guardar.

---

## Paso 11 · Connection `platform_worker`

**URL IDE**: `https://creator.zoho.com/appbuilder/formacion11/human-resource-management/setup/connections`
(o "Configuración" → "Connections")

1. Click "+ Crear Connection".
2. Tipo: **"Connection personalizada"** (Custom Service).
3. Nombre del servicio: `Plataforma Worker`.
4. Link Name: `platform_worker` (debe coincidir con el `connection: "platform_worker"`
   en `EnviarDocumentosAPlataformas`).
5. Authentication Type: **API Key Authentication**.
6. Header name: `x-worker-secret`.
7. Header value: el valor que pongas en `WORKER_SHARED_SECRET` del worker `.env`
   (genera uno con `openssl rand -hex 32` o similar).
8. **Authorize this connection in current app**: ☑ Sí.
9. Guardar.

---

## Paso 12 (post-deploy) · Verificación end-to-end

Una vez completados pasos 8-11:

### A. Levantar el worker

En el host destino (sugerido: SFTP `192.168.70.15`, mismo donde corre el backup):

```bash
cd /opt/zoho-platform-worker   # o ruta equivalente
git pull
cd worker
cp .env.example .env             # rellenar con creds
# WORKER_SHARED_SECRET = mismo que en connection
# ZOHO_CALLBACK_URL = la del Paso 8
# ZOHO_OWNER_ID, ZOHO_APP_LINK_NAME = ya presentes
# ZOHO_CLIENT_ID/SECRET/REFRESH_TOKEN = ya presentes
npm install
npx playwright install chromium  # solo si se usan adapters Playwright
npm run dev                      # o pm2 start dist/index.js
```

Verificar `curl http://192.168.70.15:8787/health` → `{"ok":true}`.

### B. Lanzar primer envío real (recomendado: cliente LUCTA)

1. Portal Zoho → Mantenimiento → Clientes → LUCTA, S.A.
2. Click "Enviar a Plataformas".
3. Esperar alert `OK: job <uuid> encolado (N docs)`.
4. Confirmar en form `Envio_Plataforma_Log` (o reporte `All_Envio_Plataforma_Logs`)
   que aparezca un registro con `Estado=queued` y luego se actualice a `done`/`failed`.
5. Confirmar en UCAE (login `4xf7.cae`) → LUCTA → Permisos → Documentación que los
   docs aprobados ya estén subidos.

### C. Troubleshooting típico

| Síntoma | Causa probable |
|---|---|
| Alert `ERROR: cliente X no existe` | clienteId no coincide o cliente borrado. |
| Alert `AVISO: cliente no tiene Formas de Envío de tipo Plataforma` | Cliente no referencia ninguna forma con `Forma_de_env_o1 == "Plataforma"`. |
| Alert `AVISO: no hay documentos vigentes` | No hay `Subir_Documento` con `Estado != Caducado` y `Archivado == false` para las plantillas requeridas. |
| Alert `ERROR worker: ...connection refused` | Worker no está corriendo o connection apunta a URL/puerto erróneo. |
| Alert `ERROR worker: 401 unauthorized` | `WORKER_SHARED_SECRET` no coincide entre worker `.env` y connection. |
| Log `fail` con `missing remoteClientId` | Forma de Envío UCAE no tiene `IdPrincipal_UCAE` poblado. |
| Log `skipped` con `no pending UCAE doc matches` | Plantilla no tiene `Codigo_UCAE` poblado, o el doc ya está validado en UCAE. |

---

## Resumen de archivos en el repo

- `worker/src/adapters/ucae.ts` — adapter UCAE (HTTP puro, login + per-doc + bulk SS).
- `worker/scripts/ucae-dry-run.mts` — verifica login + parser sin subir nada.
- `worker/scripts/populate-codigo-ucae.mts` — script aplicado, repetible.
- `worker/scripts/populate-idprincipal-ucae.mts` — script aplicado, repetible.
- `worker/scripts/count-cliente-by-formaenvio.mts` — diagnostic.
- `deluge-drafts/PlataformaUploadCallback.deluge` — código del Paso 8.
- `deluge-drafts/EnviarDocumentosAPlataformas.deluge` — código del Paso 9.
- `deluge-drafts/Boton-EnviarAPlataformas.deluge` — código del Paso 10.
- `docs/projects/plataforma-upload-schema-fase-B.md` — spec schema (ya aplicado).
