# MostrarConfiguracion

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Configuracion.MostrarConfiguracion` |
| **functionId** | — |
| **Tipo** | HTML Page |
| **Página asociada** | `Configuracion_General` (componentId: `4790826000001029132`) |
| **Roles con acceso** | 5 roles admin (NO USUARIO TRABAJADOR) |

## Qué hace

Genera un panel HTML de configuración con 7 secciones (Caducidad Docs, Asignación Técnico-Cliente, Solicitudes EPI, Solicitudes Permisos, Mensajes RRHH, Bienvenida Trabajadores, Integración WhatsApp). Cada sección muestra badges verdes/rojos/grises según estado activo/inactivo/no configurado. Botón "Editar" abre directamente el formulario en modo edición.

## Parámetros

Sin parámetros.

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Configuraci_n_General` | `ID != 0` (singleton) | Múltiples campos de configuración de cada sección |

## Estructura HTML generada

```
Panel de configuración
├── 7 secciones con título + descripción
│   └── Badges por campo: verde (Activado), rojo (Desactivado), gris (No configurado)
└── Botón "Editar" → #Form:Configuraci_n_General?recLinkID={id}&viewLinkName=Configuraci_n_General_Report
```

**Botón editar**: Usa `recLinkID` + `viewLinkName` para abrir directamente en modo edición (no modo vista).

## Notas / Bugs conocidos

- `Configuraci_n_General` es un formulario singleton (1 solo registro).
- **Namespace diferente**: `Configuracion.MostrarConfiguracion` (no `Calendario52HTML`).
- Página duplicada de `Ficha_Empleado`.
