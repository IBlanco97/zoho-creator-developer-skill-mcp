# Backup de Documentos PRL

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Backup_de_documentos_PRL` |
| **Formulario** | — (Programa scheduled) |
| **Trigger** | Scheduled (diario) |
| **Condición** | Sin condición |
| **Estado** | Habilitado |
| **Módulo** | PRL / CAE |

## Qué hace

Función `SubirDocumento.BackupDiarioDocumentos`. Sube al SFTP `192.168.70.15` (user: `sftpzoho`, conexión: `backup_sftp`) los documentos del formulario `Subir_Documento` que fueron creados/modificados en las últimas 48h (`zoho.currentdate.subDay(2)`).

## Acciones

### Acción 1: Deluge Script — Backup SFTP
- **Tipo**: Deluge script
- **Lookback**: 48h (`subDay(2)`)
- **3 carpetas destino**:
  - `/respaldo/documentos/trabajadores/` — si documento tiene Trabajador
  - `/respaldo/documentos/empresa/` — si documento es de empresa
  - `/respaldo/documentos/sin_clasificar/` — fallback

## Campos que lee

| Campo | Formulario | Tipo |
|-------|-----------|------|
| `Documento` | `Subir_Documento` | File Upload |
| `Trabajador` | `Subir_Documento` | Lookup (comparar con `0`, no `""`) |
| `Added_Time` / `Modified_Time` | `Subir_Documento` | Datetime |

## Notas / Bugs conocidos

- **Pendiente manual**: Crear las 3 carpetas en el servidor SFTP antes de la primera ejecución.
- Campos lookup se comparan con `0` (no `""`) — son numéricos.
