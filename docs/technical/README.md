# Wiki Técnica — Gestión de Recursos Humanos

Documentación técnica de la aplicación Zoho Creator `human-resource-management` (propietario: `formacion11`).

## Estructura

```
docs/technical/
├── README.md                ← Este archivo (índice general)
├── forms/                   ← Formularios: campos, lookups, validaciones
│   └── README.md            ← Tabla resumen de todos los formularios
├── workflows/               ← Workflows: triggers, scripts, dependencias
│   └── README.md            ← Tabla resumen de todos los workflows
├── functions/               ← Funciones Deluge: HTML pages, helpers, REST
│   └── README.md            ← Tabla resumen de todas las funciones
└── pages/                   ← Páginas del portal: snippets, variables, roles
    └── README.md            ← Tabla resumen de todas las páginas
```

## Módulos de la aplicación

| Módulo | Formularios | Funciones | Workflows | Páginas |
|--------|-------------|-----------|-----------|---------|
| RRHH (gestión empleados) | Nuevo_Empleado, Solicitud, Mensaje, Conversaci_n | ~5 HTML | ~10 | Tablero RRHH, Chat, Permisos, etc. |
| PRL / CAE (documentación) | Subir_Documento, Nuevo_Cliente, Plantilla | ~4 HTML | ~8 | Tablero PRL, Clientes_Doc, etc. |
| EPI / Herramientas | Solicitud_de_EPIs_Herramientas, Unidades_EPI | ~3 HTML | ~5 | Semáforo, Inventario, etc. |
| Asignaciones | Asignacion_T_cnico_Cliente, Turno | ~2 HTML | ~4 | Panel Asignaciones, Semanas |
| Formaciones | Formaci_n, Centro_Formativo | 2 HTML | ~3 | Tablero Formaciones, Mis Formaciones |
| Flota | Veh_culo | 1 HTML | ~2 | Tablero Flota |
| Encuestas | Encuesta_Interna, Pregunta_Encuesta, Respuesta_EI | 3 HTML | 3 | Tablero Encuestas, Mis Encuestas, Resultados |
| STOP2 | STOP2_Analisis_Previo | 1 HTML | 1 (scheduled) | Mis_STOP2 |
| Portal Empleado | — (usa forms de otros módulos) | ~6 HTML | ~3 | Mis EPIs, Mis Permisos, Mis Activos, etc. |
| Configuración | Configuraci_n_General | 1 HTML | — | Configuracion_General |

## Roles del portal

| Rol | profileId | Acceso |
|-----|-----------|--------|
| USUARIO TRABAJADOR | 4790826000000171117 | Portal empleado |
| RESPONSABLE CAE | 4790826000000171968 | PRL + CAE |
| Gestor RRHH | 4790826000000945001 | RRHH completo |
| SUPER ADMINISTRADOR | 4790826000000945003 | Todo |
| SUPERVISOR | 4790826000001016001 | RRHH + PRL lectura |
| OPERARIO CAE | 4790826000001016003 | PRL operativo |

## Convenciones

- **Link names**: Zoho usa `_` para espacios y codifica acentos (`é` → `_`). Ej: `Técnico` → `T_cnico`
- **IDs**: Enteros de 19 dígitos (bigint). Ej: `4790826000001053747`
- **Campos lookup**: Acceso via dot notation: `record.LookupField.CampoDelFormReferenciado`
- **Decision Box**: Tipo 9. Valores: `true`/`false`. En queries Deluge: `== true` / `== false`
- **Funciones HTML**: Namespace `Calendario52HTML.*`. Retornan string HTML+CSS. Se renderizan en HTML Snippets de páginas
- **Workflows scheduled**: Se crean en la sección "Programas" del workflow editor. Frecuencia via select2 dropdown
