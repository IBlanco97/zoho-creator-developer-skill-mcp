---
name: Recruit — Workflow Candidatos Cercanos
description: Custom function deployed in Zoho Recruit — button on Job Openings detail page that finds candidates near a Job Opening by Zip Code and sends email with results
type: project
---

## Estado: DESPLEGADO Y VERIFICADO ✅

### Objetivo
Botón manual en Job Opening de Zoho Recruit que busca candidatos cercanos por CP y envía email al recruiter con los resultados.

### Flujo
1. Usuario clicka botón "Buscar Candidatos Cercanos" en un Job Opening
2. Función lee el `Zip Code` del Job Opening
3. Sanitiza CP (quita espacios, reemplaza `o/O` → `0` — datos reales tienen errores OCR)
4. Extrae prefijo 2 dígitos → lookup en mapa de 52 provincias españolas (lat/lng capital)
5. Itera TODOS los candidatos con paginación de 200 (sin límite de requests en Recruit nativo)
6. Para cada candidato: sanitiza su CP → lookup provincia → calcula distancia (fórmula plana con factores 111 km/° lat, 85 km/° lng)
7. Filtra por radio (80 km default), compara distancia² vs radio² para evitar sqrt
8. Envía email HTML con tabla de resultados (10 columnas: nombre, especialidad, profesión, exp, ciudad, CP, distancia, teléfono, email, estado)

### Despliegue (completado 2026-03-27)
- **Función**: `BuscarCandidatosCercanos1` (String return type, inline button function)
- **Argumento**: `jobId` (String) → mapeado a "Ofertas de empleo - ID de Oferta de empleo" via merge field `#`
- **Botón**: "Buscar Candidatos Cercanos" en Job Openings → Página de detalles → perfiles Administrator + Standard
- **Test**: ejecutado en oferta "TECNICO ELECTROMECÁNICO MANTENIMIENTO INDUSTRIAL" (CP 08760, Martorell) → "acción ejecutada correctamente"

### Adaptaciones Recruit Deluge (vs Creator Deluge)
Recruit Deluge es un **subconjunto** de Creator Deluge con limitaciones importantes:
1. **No `while` loops** → `for each pg in {1,2,...,20}` con flag `keepGoing`
2. **No `break`/`continue`** → nested `if/else` blocks
3. **No `pow()`** → lookup table de 8 rangos para sqrt aproximada
4. **No `zoho.loginuser.email`** → `zoho.loginuserid`
5. **String return type**: `return;` → `return "";` + `return "";` al final del script
6. **Funciones standalone vs button**: las funciones creadas en Setup → Automation → Functions NO aparecen en el picker de acciones de botón. Hay que usar "Escribiendo función personalizada" al crear el botón.

### API Names confirmados (Zoho Recruit — módulo Candidates)
Los API names usan **espacios**, no snake_case:
- `"Zip Code"` (no `Zip_Code`)
- `"First Name"`, `"Last Name"`
- `"Email"`, `"Mobile"`, `"Phone"`
- `"City"`, `"State"`, `"Country"`
- `"Candidate Status"` — valores: Nuevo, Contactado, Entrevistado telefónicamente, Entrevista final, Convertido - Empleado
- `"ESPECIALIDAD"` — ELECTROMECANICO, AUTOMATISTA, ELECTRÓNICO, FRIGORISTA, ROBOTICO, MONTADOR, MANTENIMIENTO INDUSTRIAL
- `"PROFESION"` — ELECTRICO, MECÁNICO, PROGRAMADOR DE PLC
- `"DELEGACIÓN"` — ej: MONTCADA I REIXAC
- `"Experience in Years"` (Decimal)
- `"Skill Set"` (string, comma-separated)
- `"CANDIDATEID"` — ID interno
- `"Candidate ID"` — ID visible (ej: ZR_1558_CAND)
- `"Associated Tags"` — ej: ";HEADHUNTING;BBDD SICMA 21 ACTIVA;"
- `"EMPRESA QUE CONTRATA"` — ej: DOMO21
- `"ESTA TRABAJANDO"` — "true"/"false" (string)
- `"Carnet de Conducir"` — "true"/"false" (string)
- `"Vehiculo propio"` — "true"/"false" (string)

**Campos Latitud/Longitud**: existen en el módulo (tipo Decimal) pero NINGÚN candidato los tiene rellenados. Se usa mapa de provincias como método principal (no fallback).

### Calidad de datos CP
- Muchos candidatos SIN CP (se excluyen con contador `skipped`)
- CPs con errores OCR: `"08 o35"`, `"082o6"`, `"05 01"` — función sanitiza automáticamente

### Código local
- Backup: `deluge-drafts/BuscarCandidatosCercanos-Recruit-adapted.deluge` (271 líneas, con fixes `return ""`)
- Original Creator: `deluge-drafts/BuscarCandidatosCercanos-Recruit.deluge` (300 líneas, NO compatible con Recruit)

### URL Recruit Setup
`https://recruit.zoho.com/recruit/org861495771/ShowSetup.do?tab=automate&subTab=wfdeluge&step=showAllWFDeluge`

### Lecciones
- **CodeMirror injection UTF-8**: `atob()` no maneja multibyte → usar `TextDecoder`: `new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)))` → `new TextDecoder('utf-8').decode(bytes)`
- **Overlays Zoho Recruit**: `FreezeLayer` y `newRelatedListPopUpDiv` bloquean clicks Playwright → ocultar via JS antes de clickar
- **Merge field mapping en botón**: escribir `#` en el contenteditable `valueName_1` → seleccionar módulo → seleccionar campo → click "Fin"
