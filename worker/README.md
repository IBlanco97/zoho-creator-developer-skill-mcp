# Worker — Subida automática a plataformas CAE

Servicio Node externo que recibe trabajos desde Zoho Creator y sube documentos a las plataformas CAE registradas en cada cliente (`Nuevo_Cliente.Formas_de_Env_o`).

## Arquitectura

```
Zoho Creator (Deluge)                   Worker (Node + Playwright)
─────────────────────                   ──────────────────────────
[ Botón "Enviar a plataformas" ]
   │ build payload (cliente,
   │  formasEnvio[], documentos[])
   ▼
   invokeurl POST /jobs ───────────►  enqueue(jobId)
                                       │
                                       ▼
                                       descarga ficheros (Zoho REST)
                                       │
                                       ▼
                                       pickAdapter(url) → Playwright login + upload
                                       │
                                       ▼
   Custom Function callback ◄────────  POST /custom/Plataforma_Upload_Callback
   (escribe Envio_Plataforma_Log)        { job_id, cliente_id, status, results[] }
```

## Setup

```bash
cd worker
cp .env.example .env   # rellenar credenciales Zoho + WORKER_SHARED_SECRET
npm install
npx playwright install chromium
npm run dev
```

## Endpoints

- `GET  /health` → `{ ok: true }`
- `POST /jobs`   (header `x-worker-secret`) → `202 { job_id, status: "queued" }`
- `GET  /jobs/:id` → estado + resultados

### Ejemplo payload

```json
{
  "clienteId": "4790826000000123456",
  "clienteNombre": "ACME S.L.",
  "formasEnvio": [
    {
      "formaEnvioId": "4790826000000234567",
      "url": "https://www.ctaimacae.com/login",
      "usuario": "user@acme",
      "password": "***",
      "mailEnvio": "cae@acme.com"
    }
  ],
  "documentos": [
    {
      "plantillaId": "4790826000000345678",
      "plantillaNombre": "Certificado APT",
      "scope": "trabajador",
      "trabajadorId": "4790826000000456789",
      "subirDocumentoId": "4790826000000567890",
      "fileFieldName": "Documento",
      "fileReportName": "All_Subir_Documento",
      "fechaCaducidad": "2027-04-30"
    }
  ]
}
```

## Adaptadores

| Adapter   | Match (regex sobre URL)   | Estado |
|-----------|---------------------------|--------|
| ctaima    | `ctaima\|ctaimacae`       | Stub Playwright (selectores TODO) |
| dokify    | `dokify`                  | Skipped |
| nalanda   | `nalanda`                 | Skipped |
| generic   | fallback                  | Marca skipped y deja para envío manual |

Para implementar uno nuevo: copiar `src/adapters/dokify.ts`, ajustar `match()` y `upload()`, registrar en `src/adapters/index.ts`.

## Lado Zoho — Custom Function de callback

Crear `Plataforma_Upload_Callback(map payload)` como REST endpoint. Cuerpo sugerido:

```
for each r in payload.get("results")
{
    create_record_log = insert into Envio_Plataforma_Log
    [
        Cliente              = payload.get("cliente_id").toLong()
        Forma_de_Envio       = r.get("formaEnvioId").toLong()
        Subir_Documento      = r.get("subirDocumentoId").toLong()
        Plantilla            = r.get("plantillaId").toLong()
        Status               = r.get("status")
        Mensaje              = r.get("message")
        Job_ID               = payload.get("job_id")
    ];
}
return Map();
```

> Necesita un form `Envio_Plataforma_Log` (a crear). Campos sugeridos: `Cliente` (lookup), `Forma_de_Envio` (lookup `Nueva_Plantilla_Env_o_de_Documentaci_n`), `Subir_Documento` (lookup), `Plantilla` (lookup), `Status` (text), `Mensaje` (text), `Job_ID` (text), `Fecha` (datetime auto).

## Seguridad

- `WORKER_SHARED_SECRET` validado en header `x-worker-secret` para `/jobs` y `/jobs/:id`.
- Credenciales de plataforma viajan dentro del payload — desplegar el worker tras VPN o en la red interna (mismo SFTP host `192.168.70.15` es buen candidato).
- Migrar `Nueva_Plantilla_Env_o_de_Documentaci_n.Contrase_a` de Single Line → **Password field** antes de uso real.

## Pendiente

- [ ] Selectores reales por plataforma (CTAIMA, Dokify, Nalanda, e-coordina).
- [ ] Reintentos con backoff por fallo de adapter.
- [ ] Persistencia del queue (SQLite o Postgres) — ahora es in-memory, se pierde al reiniciar.
- [ ] Form `Envio_Plataforma_Log` + custom function `Plataforma_Upload_Callback` en Zoho.
- [ ] Botón Deluge "Enviar a plataformas" en ficha cliente que arme el payload y llame `invokeurl`.
