# Nuevo Empleado

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Nuevo_Empleado` |
| **Display Name** | Nuevo Empleado |
| **Módulo** | RRHH Core |
| **Registros aprox.** | Cientos (todos los empleados de la empresa) |

## Campos principales

| # | Campo | Link Name | Tipo | Notas |
|---|-------|-----------|------|-------|
| 1 | Nombre | `Nombre` | Name (first_name + last_name) | Campo compuesto — acceso via `.first_name`, `.last_name` |
| 2 | Official Email | `Official_Email` | Email | Email corporativo principal |
| 3 | Correo Electrónico | `Correo_Electr_nico` | Email | Email alternativo |
| 4 | Mail Portal Empleado | `Mail_Portal_Empleado` | Email | Email de acceso al portal |
| 5 | Área Profesional | `Area_Profesional` | Picklist/Single Line | Categoría laboral |
| 6 | Empresa | `Empresa` | Lookup / Picklist | Empresa a la que pertenece |

**Nota**: Este formulario tiene muchos más campos (datos personales, bancarios, contractuales, etc.) — solo se listan los campos usados frecuentemente por las funciones HTML y workflows documentados.

## Lookups (campos de referencia)

Este formulario es **destino de lookups** desde muchos otros formularios:
- `STOP2_Analisis_Previo.Empleado` → `Nuevo_Empleado`
- `Mensaje.Tecnico` → `Nuevo_Empleado`
- `Conversaci_n.T_cnico` → `Nuevo_Empleado`
- `Solicitud.Trabajador_Solicitante` → `Nuevo_Empleado`
- `Asignacion_T_cnico_Cliente.Tecnico` → `Nuevo_Empleado`
- Y muchos más

## Subformularios

Ninguno directo (pero es referenciado por subforms de otros formularios).

## Patrón de identificación de empleado

Casi todas las funciones HTML del portal usan este patrón para identificar al empleado logueado:

```deluge
uid = zoho.loginuserid;
empFound = 0;
empRec = null;
for each e in Nuevo_Empleado[Official_Email == uid || Mail_Portal_Empleado == uid || Correo_Electr_nico == uid]
{
    empRec = e;
    empFound = 1;
    break;
}
if(empFound == 0) { return "<error HTML>"; }
empId = empRec.ID;
```

**Triple OR** porque diferentes empleados pueden tener el email de portal en diferentes campos.

## Notas

- Formulario central de la aplicación — casi todos los módulos lo referencian.
- Los 3 campos de email (`Official_Email`, `Correo_Electr_nico`, `Mail_Portal_Empleado`) se usan para deduplicación en notificaciones (workflow N8 y similares).
- `Nombre` es un campo compuesto (`Name` type) — en Deluge se accede como `empRec.Nombre.first_name` y `empRec.Nombre.last_name`.
