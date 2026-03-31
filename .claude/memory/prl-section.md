---
name: prl-section
description: Sección PRL (Prevención de Riesgos Laborales) — dashboard, formularios, reportes y workflows
type: project
---

# Sección PRL — human-resource-management

## Página principal: `Tablero_PRL`
**Parámetros**: `int Cliente`, `string verde1` (inicializada a `#07C900` en script)

### Fila 1 — KPIs de documentos individuales (fuente: `thisapp.Nuevo_Requisitos_Doc.ID.count`)

**Columna 1 (40%) — Panel 2 — Estado Caducidad** → link a `Clientes_Requisitos`
| Color | Valor | Criteria | Filtro URL |
|-------|-------|----------|------------|
| `#FF2424` | Pendiente de subir | `Estado == "Pendiente Subir"` | `?Estado=Pendiente Subir` |
| `#C90000` | Caducados | `Estado == "Caducado"` | `?Estado=Caducado` |
| `#FCC019` | Próximos a Caducar | `Estado == "Cerca de Caducar"` | `?Estado=Cerca de Caducar` |
| `#07C900` | Actualizados | `Estado == "Actualizado"` | `?Estado=Actualizado` |

**Columna 2 (40%) — Panel — Estado Envío/Validación** → link a `Clientes_Requisitos`
| Color | Valor | Criteria |
|-------|-------|----------|
| `#FF2424` | No Enviados | `Enviado == "NO"` |
| `#BA2800` | Enviados (sin respuesta) | `Enviado == "SI" && Aprobado_Cliente != "SI"` |
| `#309FFF` | Validados | `Enviado == "SI" && Aprobado_Cliente == "SI"` |

**Columna 3 (20%) — Panel 5 — Totales globales**
- Clientes → `thisapp.Nuevo_Cliente.ID.count` → `Ver_Clientes`
- Empleados → `thisapp.Nuevo_Empleado.ID.count` → `Employee_Details`

### Fila 2 — KPIs por Cliente (fuente: `thisapp.Nuevo_Cliente.ID.count`)
Usan contadores desnormalizados almacenados en `Nuevo_Cliente` (mantenidos por workflows):
- **Panel 3 (26%)** — "Clientes con Documentos Pendientes de Publicar o Caducados" → `ContadorPendietesSubir > 0 || ContadorCaducados > 0`
- **Panel 4 (21%)** — "Clientes con Documentos Pendientes Enviar" → `ContadorNoEnviados > 0`
- **Panel 6 (26%)** — ⚠️ título incorrecto "Clientes con Todos los Documentos Validados" → criteria real: `ContadorEnviadosAprobados > 0 && ContadorNoEnviados == 0 && ContadorEnviadosNoAprobados > 0` (hay NoAprobados > 0 — semántica real = "enviados, pendiente validación completa")
- **Panel 7 (27%)** — "Clientes con Todos los Documentos Validados" → `ContadorEnviadosAprobados > 0 && ContadorNoEnviados == 0 && ContadorNoEnviados == 0` (criteria redundante — mismo campo comparado dos veces)

### Fila 3
- `Ver_Clientes` embebido, height=700px

---

## Formularios PRL

### `Nueva_Lista_de_Requisitos` — "Nueva Lista de Requisitos"
Agrupa un conjunto de requisitos doc para un Cliente/Trabajador/Empresa.
**Campos clave:**
- `N_Orden` (number), `Nombre` (text)
- `Trabajador` → `Nuevo_Empleado.ID` (bidirectional: `Lista_de_Requisitos`)
- `Empresa1` → `Empresa1.ID` (bidirectional: `Listas_de_Requisitos`)
- `Cliente1` → `Nuevo_Cliente.ID` (bidirectional: `Lista_de_Requisitos`)
- `Estado` — `{Pendiente Subir, Pendiente Aprobación, Caducado, Cerca de Caducar, Actualizado}`
- `Estado_Cliente` — `{Enviada y Aprobada, Enviada, No Enviada}` (inicial: "No Enviada")
- `Campo_Etiqueta_Coloreada`, `Campo_Etiqueta_Coloreada_para_Cliente`, `Campo_Etiqueta_Coloreada_Empresa` (richtext — visualización semáforo)

**Workflows clave:**
- `Rellenar_Requisitos` — genera automáticamente registros `Nuevo_Requisitos_Doc` al crear la lista
- `Autocrear_Nombre`, `N_Orden_Autoincrementado2` — autorrelleno
- `Autorrellenar_Campo_Etiqu/1/2` — etiquetas coloreadas por estado
- `Actualizar_Estado_Documen` — recalcula estado de la lista cuando cambia un doc
- `Aprobado_por_Cliente` — flujo de aprobación
- `Enviar_Documentos_trabaja` — envío de documentación al cliente
- `Subir_Documento_Cliente_T` — subir documento trabajador-cliente
- `Vista_Detallada_Requisito` — vista detallada
- `On_Delete2` — limpieza al borrar

### `Nuevo_Requisitos_Doc` — "Nuevo Requisito Doc"
Registro individual de un documento requerido dentro de una lista.
**Campos clave:**
- `Plantilla` → `Plantilla.ID` (qué tipo de doc se requiere)
- `Trabajador` → `Nuevo_Empleado.ID`
- `Empresa1` → `Empresa1.ID`
- `Cliente1` → `Nuevo_Cliente.ID`
- `Documento` → `Subir_Documento[Estado != "Pendiente Subir" && CLIENTE.ID == input.Cliente1 || ...]` (doc que satisface el requisito; bidirectional: `Requisitos_enlazados`)
- `Estado` — "Estado Caducidad": `{Pendiente Subir, Pendiente Aprobación, Caducado, Cerca de Caducar, Actualizado}`
- `Enviado` — radiobutton `{SI, NO}` (inicial: NO)
- `Estado1` — "Estado" combinado: `{Pendiente Subir, Pendiente Aprobación, Caducado, Pendiente Enviar - Cerca de Caducar, Validado - Cerca de Caducar, Actualizado - Pendiente Enviar, Enviado - Pendiente Validar, Validado}`
- `Aprobado_Cliente` — `{SI, NO, Sin respuesta}` (inicial: "Sin respuesta")
- `N_Orden` (unique), `Nombre`, `Lista_Requisitos_Pertenece` → `Nueva_Lista_de_Requisitos`

**Workflows clave:**
- `Checar_Estado_Requisito` (x3) — calcula `Estado` según caducidad del documento
- `Checar_Documento_seg_n_pl` — valida que el doc subido corresponde a la plantilla
- `Checar_y_actualizar_estad` — recalcula `Estado1` (campo compuesto)
- `ActualizarEstado` — propaga cambios hacia arriba (Lista → Cliente)
- `Doc_Aceptado_por_Cliente` — marca `Aprobado_Cliente = SI`
- `On_Delete1` — recalcula contadores al borrar
- `Autorrellenar_Nombre_con_` — nombre con semáforo coloreado
- `Acci_n_Enviar_Documento_R` — acción de envío desde reporte
- `Subir_Documentos_Pendient` — acción para subir desde reporte
- `Descargar_Plantilla_PDF_D` — descarga la plantilla del documento

### `Subir_Documento` — formulario de subida de documentos
Central en el flujo. Workflows clave:
- `Mostrar_campos_seg_n_Plan` — muestra campos según plantilla seleccionada
- `Calcular_Fecha_caducidad_` / `Calcular_fecha_de_caducid` / `Calcular_fecha_de_caducid1` / `Calcular_fecha_de_caducid2` — múltiples workflows de cálculo de caducidad
- `Calcular_valor_sem_foro` — semáforo de estado
- `Verificar_formato_y_tama_` — valida formato y tamaño del doc
- `Asignar_Documento_A_Requs` — asigna el doc subido al requisito correspondiente
- `actualizarSemaforosCaduci1` — recalcula semáforos de caducidad en cascada
- `Aprobar_Documento` — flujo de aprobación
- `Subir_Documento` / `Subir_Doc_Trabajador` — flujos de subida
- `Field_Rules_On_Update` — reglas de campo al editar
- `checar_si_debe_ser_archiv` — archivado automático
- `On_Delete` — limpieza al borrar
- `ColocarEtiqueta` — etiqueta coloreada
- `NombrarDocumento` — nombre automático
- `Cargar_usuario_como_traba` — asigna el usuario logueado como trabajador
- `Deshabilitar_campos_Rol_E` — restringe campos según rol Empleado
- `Carga_del_Formulario2` — init del formulario
- `Calcular_D_as_para_caduca` — días restantes para caducar

### `Nuevo_Cliente` — campos PRL destacados
- `Gestor_PRL` → `Nuevo_Empleado.ID`
- `Persona_Responsable_CAE` — grid → `Persona_Responsable_CAE.ID`
- `Personas_Contacto_en_Planta` — grid → `Persona_Contacto_en_Planta.ID`
- **Contadores desnormalizados** (actualizados por workflows):
  - `ContadorPendietesSubir`, `ContadorCaducados`, `ContadorNoEnviados`
  - `ContadorEnviadosAprobados`, `ContadorEnviadosNoAprobados`

**Workflows PRL en Nuevo_Cliente:**
- `Agregar_Trabajador_a_Clie` / `Asignar_Desasignar_Trabaj/1` — gestión de asignaciones trabajador-cliente
- `Actualizar_Documentacion_` — cuando cambia la plantilla de empresa
- `Color_Trabajador_Segun_Doc` — semáforo visual por trabajador
- `Estado_General_Doc_Actual1` — recalcula estado general y contadores
- `Eliminar_Requisitos1` — limpieza al borrar cliente
- `Agregar_Modelo_Doc_a_Trab` / `Modelo_Doc_Empresa_Elimin` / `Modelo_Doc_Trabajador_Eli` — gestión de plantillas
- `ActualizarListasRequisito` / `ActualizarListasDocClient` — regenera listas al cambiar requisitos
- `Enviar_Documentaci_n_Repo` — envío desde reporte clientes
- `Validar_Documentos_Report` — validación desde reporte clientes
- `Reporte_Clientes_Modifica` / `Reporte_Clientes_Modifica1` — modificar requisitos desde reporte
- `Modificar_Lista_Documento` / `Modificar_Requisitos_Empr` / `ModificarRequisitosAutono` / `ModificarDocumentosAutono` — modificación de requisitos
- `Ver_Documentacion` — vista de documentación del cliente

### `Modificar_Requisitos_Clientes` / `_Trabajadores` / `_Empresa` / `_Aut_nomos`
Formularios popup para modificar la lista de requisitos:
- Cada uno tiene un workflow `Env_o_de_formulario` que aplica los cambios
- `Modificar_Requisitos_Trabajadores` también tiene `Modelo_A_adido` y `On_Add_Models`
- `Modificar_Requisitos_Aut_nomos` tiene `Reglas_de_Campos18`

---

## Reportes PRL principales

| Link Name | Descripción |
|-----------|-------------|
| `Clientes_Requisitos` | Vista principal de requisitos por cliente — filtrable por Estado, Enviado, Aprobado_Cliente |
| `Ver_Clientes` | Lista de clientes (embebido en dashboard) |
| `Ver_Listas_de_Documentaci_n_Requerida` | Listas de documentación requerida |
| `Lista_de_Documentaci_n_Trabajadores_Empresa` | Documentación por trabajador-empresa |
| `Requisitos_Cliente_Trabajador` | Requisitos de un cliente por trabajador |
| `Documentos_Trabajador` | Documentos subidos por trabajador |
| `Documentos_Empresa` | Documentos de empresa |
| `Documentacion_Incompleta` | Requisitos incompletos |
| `Docs_No_Subidos` | Documentos pendientes de subir |
| `Conjunto_Requisitos_Documentacion_Report` | Sets de requisitos |
| `Modificar_Requisitos_Trabajadores_Report` | Report para modificar requisitos trabajadores |
| `Modificar_Requisitos_Empresa_Report` | Report para modificar requisitos empresa |
| `Modificar_Requisitos_Aut_nomos_Report` | Report para modificar requisitos autónomos |
| `Modificar_Requisitos_Clientes_Report` | Report para modificar requisitos clientes |
| `Persona_Responsable_CAE_Report` | Responsables CAE |
| `Persona_Contacto_en_Planta_Report` | Contactos en planta |
| `Cliente_Empresa_Docs_Estado` | Estado docs cliente-empresa |
| `Trabajadores_Documentos` | Documentos de trabajadores |
| `Otros_Documentos` | Otros documentos |
| `Archivados` | Documentos archivados |
| `Env_o_de_documentaci_n_Report` | Envíos de documentación |
| `Subir_Multiples_Documentos_Report` / `_2_Report` | Subida múltiple |
| `Clientes` | Lista básica de clientes |

---

## Arquitectura del flujo PRL

```
Nuevo_Cliente (CIF, Gestor_PRL, Persona_Responsable_CAE, Personas_Contacto_en_Planta)
    ↓ se asignan Trabajadores (Asignacion_Tecnico_Cliente)
    ↓ se definen Plantillas de documentos (Plantilla)
    ↓ workflow genera Nueva_Lista_de_Requisitos (para cada par Cliente-Trabajador o Cliente-Empresa)
        ↓ workflow genera Nuevo_Requisitos_Doc (uno por plantilla)
            ↓ técnico/RRHH sube Subir_Documento
                ↓ workflow Asignar_Documento_A_Requs enlaza doc al requisito
                    ↓ workflow Checar_Estado_Requisito actualiza Estado (Caducidad)
                        ↓ workflow ActualizarEstado propaga a Lista y Cliente
                            ↓ contadores en Nuevo_Cliente se recalculan
                                ↓ Tablero_PRL refleja la situación actualizada
            ↓ RRHH marca Enviado=SI en Nuevo_Requisitos_Doc
                ↓ Cliente recibe email/acceso
                    ↓ RRHH marca Aprobado_Cliente=SI
                        ↓ contadores se actualizan
```

## Bugs/Mejoras potenciales detectados

1. **Panel 6 título incorrecto**: dice "Clientes con Todos los Documentos Validados" pero el criteria incluye `ContadorEnviadosNoAprobados > 0` — debería ser algo como "En proceso de validación"
2. **Panel 7 criteria redundante**: `ContadorNoEnviados == 0 && ContadorNoEnviados == 0` — segunda condición duplicada, probablemente debería ser `ContadorEnviadosNoAprobados == 0`
3. **Typo en Panel 3**: "Pendientes" escrito como "Pendietnes" en el displayname (también en el nombre del campo `ContadorPendietesSubir`)
4. **Múltiples workflows de caducidad en Subir_Documento**: 4 workflows calculan fecha de caducidad — probable duplicidad o lógica condicional distribuida
