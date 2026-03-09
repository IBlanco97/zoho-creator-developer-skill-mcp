# Últimas tareas (2026-03-07/08)

## 1. Exploración del IDE Zoho Creator con Playwright
- Mapeamos URLs directas del constructor (form editor, workflow editor, workflow list)
- Descubrimos que el Constructor usa iframe interno (`creatorapp.zoho.com`)
- Documentamos los tipos de workflow y módulos de la app `human-resource-management`
- Aprendimos que hay que usar `browser_evaluate` + `.click()` para superar el overlay

## 2. Añadir campos al formulario `Nuevo_Requisitos_Doc`
- Añadimos 3 campos nuevos: `Caducidad_Especifica`, `Tipo_Caducidad_Especifica`, `Tolerancia_Especifica`
- `Tipo_Caducidad_Especifica` es un dropdown con opciones: No Caduca, Puntual, Mensual, Trimestral, Semestral, Anual, Bianual, Trianual, Quinquenal
- Problema resuelto: link names con tildes se auto-encodan (é→`_f`) — corregir vía JS value assignment

## 3. Crear workflow de Field Rules (`Mostrar_Caducidad_Espec_f`)
- Tipo: `Creado o editado` → `Reglas de campos`
- 2 acciones en orden:
  1. Sin condición → **Ocultar** `Caducidad_Especifica`, `Tipo_Caducidad_Especifica`, `Tolerancia_Especifica`
  2. Si `Tipo_Caducidad` contains `SI` → **Mostrar** los mismos campos
- Selector de campos usa Select2 (`#s2id_showHideField`) — interactuar vía JS
- Guardar: botón "Listo" (NO Ctrl+S)

## 4. Exportar código fuente Deluge (2026-03-09)
- Descubierta URL directa de exportación: `.../exportScript`
- Archivo `.ds` con todo el código fuente (~2.2MB), guardado en `.playwright-mcp/Gestión-de-Recursos-Humanos.ds`
- Método: `fetch('/appbuilder/.../exportScript', {credentials:'include'})` desde el browser autenticado
- Documentado en `memory/zoho-ide.md` → sección "Exportar código fuente de la app"

## Pendiente / próximas tareas
- (sin definir — consultar con el usuario)
