# Plataforma Upload — Schema Zoho fase B''

Campos que hay que **añadir manualmente en el IDE** para que el adapter UCAE
(y futuros) funcione sin parchear código por cliente. Sin esto, el matching
solo es por nombre (frágil).

## 1. `Plantilla` — añadir 2 campos

URL form: `https://creator.zoho.com/appbuilder/formacion11/human-resource-management/form/Plantilla/edit`

| Field link name | Display name | Tipo | Notas |
|---|---|---|---|
| `Codigo_UCAE` | Código UCAE | Single Line | Código tal como aparece en la columna izquierda del listado UCAE: `AG TRIBUT`, `ITA`, `RLC`, `EPI`, `F.ALT.5`, `F19MANTENIM`, `LCT.42`, etc. **Debe coincidir literalmente** con el `data-codigo` (o primera celda) de la fila UCAE — el adapter compara case-insensitive pero exact match tras `trim()`. |
| `Bulk_SS_UCAE` | UCAE: usar bulk SS | Decision Box (checkbox) | Marcar solo en plantillas que UCAE clasifica auto desde un único PDF de Seguridad Social (típicos: ITA, RNT/TC2, IDC, RLC). El adapter detecta la marca y enruta a `POST /empresa/contrata/documentacion/upload` (un solo POST → todas las empresas vinculadas). |

**Población inicial sugerida** (basada en discovery del 2026-05-04):

| Plantilla actual probable | `Codigo_UCAE` | `Bulk_SS_UCAE` |
|---|---|---|
| Cert Agencia Tributaria | `AG TRIBUT` | ☐ |
| Cert SS estar al corriente | `CERT SS MENSUAL` | ☐ |
| Cert concierto PRL | `CERT GBL CONC` | ☐ |
| Recibo Liquidación Cotizaciones | `RLC` | ☑ |
| Informe Trabajadores en Activo | `ITA` | ☑ |
| Relación Nominal Trab. (RNT/TC2) | `TC2T-ACT` | ☑ |
| Doc Alta SS (TA2/IDC) | `ESCANTA2` | ☑ |
| Apto médico | `L01` | ☐ |
| Formación PRL altura | `F.ALT.5` | ☐ |
| Formación art.19 mantenimiento | `F19MANTENIM` | ☐ |
| EPI entrega | `EPI` | ☐ |

Lista completa de 26 códigos observados: ver `worker/discovery/ucae/2026-05-04T16-33-05/11-form-structure.json` → `data_observed.doc_codes_observed`.

## 2. `Nueva_Plantilla_Env_o_de_Documentaci_n` (Forma de Envío) — añadir 1 campo

URL form: `https://creator.zoho.com/appbuilder/formacion11/human-resource-management/form/Nueva_Plantilla_Env_o_de_Documentaci_n/edit`

| Field link name | Display name | Tipo | Notas |
|---|---|---|---|
| `IdPrincipal_UCAE` | UCAE — IdPrincipal | Single Line | ID numérico del cliente en UCAE (lo ves en la URL `/empresa/consulta/permiso/list?q={idprincipal}`). Ej.: LUCTA = `22852`. Solo aplica cuando `Forma_de_env_o1 == "Plataforma"` y la URL contiene `ucae.es`. Dejar vacío en el resto. |

> Nota: este campo debería volverse multi-plataforma a medida que añadamos adapters
> (Dokify usaría `IdCliente_DOKIFY`, etc.). Se mantiene un campo por plataforma —
> es más explícito que un mapa JSON y permite filtrar reports.

## 3. Verificación post-schema

Tras añadir los campos, ejecutar el dry-run del worker:

```powershell
cd worker
$env:UCAE_USER="4xf7.cae"; $env:UCAE_PASS="..."; $env:UCAE_IDPRINCIPAL="22852"
npx tsx scripts/ucae-dry-run.mts
```

Salida esperada: `[parser] data-clave rows>0`. Si rows=0 con cliente real con
permisos abiertos → revisar selector del parser (UCAE pudo cambiar markup).

## 4. Pendiente posterior (no bloqueante para POC)

- Para Dokify (siguiente adapter): añadir `Plantilla.IdReqType_DOKIFY` (Number) +
  `Nueva_Plantilla_Env_o_de_Documentaci_n.IdCliente_DOKIFY` (Single Line).
- Para CTAIMA: depende de Q1 (Twind). Posponer schema hasta resolución.
