# DevolverHTMLMisPermisos

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLMisPermisos` |
| **functionId** | `4790826000001026049` |
| **Tipo** | HTML Page |
| **Página asociada** | `Mis_Permisos` |
| **Roles con acceso** | USUARIO TRABAJADOR |
| **Backup local** | No disponible (inyectado directamente) |

## Qué hace

Genera la página "Mis Permisos" para el empleado logueado. Muestra una tabla con todas las solicitudes de permiso del empleado, con badge de estado (SI=verde, NO=rojo, Sin Respuesta=gris). Incluye botón para nueva solicitud.

## Parámetros

Sin parámetros (usa `zoho.loginuserid`).

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Nuevo_Empleado` | `Official_Email == uid \|\| Mail_Portal_Empleado == uid \|\| Correo_Electr_nico == uid` | `ID`, `Nombre` |
| `Solicitud` | Filtrado por empleado | Tipo permiso, Fecha, Estado (SI/NO/Sin Respuesta), Observaciones |

## Formularios que modifica

Ninguno.

## Estructura HTML generada

```
Header gradiente #1C3A5E con avatar + nombre empleado
├── Tabla de solicitudes de permiso
│   └── Badges estado: SI (verde), NO (rojo), Sin Respuesta (gris)
└── Botón "+ Nueva Solicitud" → #Form:Solicitud
```

## Notas / Bugs conocidos

- Usa patrón `cnt_` counter en vez de `.size()`.
- Campo `Observaciones` no existe en el form `Solicitud` (descubierto durante implementación de notificaciones N8).
