# Manual STOP2 — Guía del Supervisor / Gestor

**Perfil:** Gestor RRHH, Responsable CAE, Supervisor, Super Administrador
**Acceso:** [https://creatorapp.zoho.com/formacion11/human-resource-management/](https://creatorapp.zoho.com/formacion11/human-resource-management/)
**Versión:** 1.0 — Julio 2026

---

## Índice

1. [Qué es STOP2 y para qué sirve](#1-qué-es-stop2-y-para-qué-sirve)
2. [Cómo lo rellena el técnico](#2-cómo-lo-rellena-el-técnico)
3. [Cálculo automático de "Valida Intervención"](#3-cálculo-automático-de-valida-intervención)
4. [Gestión de ítems invalidantes: medida + foto de evidencia](#4-gestión-de-ítems-invalidantes-medida--foto-de-evidencia)
5. [Reporte STOP2](#5-reporte-stop2)
6. [Informe semanal automático a clientes](#6-informe-semanal-automático-a-clientes)
7. [Configuración necesaria por cliente](#7-configuración-necesaria-por-cliente)
8. [Qué hacer ante un checklist con alertas](#8-qué-hacer-ante-un-checklist-con-alertas)

---

## 1. Qué es STOP2 y para qué sirve

**STOP2** (Seguridad en el Trabajo: Observación y Prevención) es el checklist de seguridad de 22 ítems que cada técnico debe completar antes de cualquier intervención en instalaciones de cliente. El objetivo desde tu perfil es doble:

- **Preventivo**: que ningún técnico entre a intervenir sin verificar las condiciones mínimas de seguridad, y que si detecta un riesgo, quede constancia de cómo se resolvió antes de continuar.
- **De cumplimiento ante el cliente**: los clientes con requisitos CAE reciben automáticamente un informe semanal de los checklists realizados en sus instalaciones.

## 2. Cómo lo rellena el técnico

El técnico accede desde el Portal del Empleado a **STOP2 Análisis Previo → Nuevo STOP2**, indica la Orden de Trabajo y el Cliente, y marca los 22 ítems repartidos en 5 bloques (Acceso, Entorno, Personal, Materiales, Final). Al final firma el registro y lo envía.

El detalle completo del formulario, ítem por ítem, está en el **[Manual STOP2 — Técnico](STOP2-tecnico.md)**. Como supervisor no necesitas rellenarlo tú, pero conviene conocer su estructura para poder orientar a un técnico si te consulta una duda, o para interpretar correctamente un registro con alertas.

## 3. Cálculo automático de "Valida Intervención"

En el momento en que el técnico envía el checklist, el sistema calcula automáticamente el campo **Valida Intervención**:

| Resultado | Causa |
|-----------|-------|
| **Válido (Sí)** | Todos los ítems de seguridad están marcados correctamente |
| **No válido (No)** | Hay uno o más ítems críticos ("invalidantes") marcados en su condición de riesgo |

Los ítems que invalidan una intervención son: Trabajos Eléctricos, ATEX, Alturas y Espacios Confinados (bloque Acceso); Zona de Obra, Zona de Vehículos e Intemperie (bloque Entorno); y Limpieza deficiente (bloque Materiales).

Que un checklist salga "No válido" **no significa que el sistema bloquee al técnico indefinidamente** — significa que se detectó una condición de riesgo. Lo que exige el sistema (ver §4) es que, si el técnico continúa, quede documentada la medida tomada para resolverla.

## 4. Gestión de ítems invalidantes: medida + foto de evidencia

| Ítem invalidante | Medida + Foto activo |
|-------------------|:---:|
| Permiso de Trabajo (Acceso)
| Herramientas en mal estado (Personal)
| Zona en Obra — `E1_Zona_Obra` (Entorno)
| Zona de Vehículos — `E2_Zona_Vehiculos` (Entorno)
| Intemperie — `E4_Intemperie` (Entorno)
| Limpieza Previa — `M2_Limpieza` (Materiales)
| Trabajos Eléctricos — `A4_Trab_Electricos` (Acceso)
| ATEX — `A5_ATEX` (Acceso)
| Alturas — `A6_Alturas` (Acceso)
| Espacios Confinados — `A7_Espacios_Confinados` (Acceso)

Cuando un ítem tiene la funcionalidad activa, al marcarlo en condición de riesgo el formulario exige rellenar, para ese ítem concreto:

- **Medida tomada / Solución** (campo `Medida_Tomada_<ítem>`) — texto libre describiendo cómo se resolvió o mitigó la situación de riesgo antes de continuar
- **Foto de evidencia** (campo `Foto_evidencia_<ítem>`) — fotografía que demuestra que la medida se aplicó realmente (señalización colocada, EPI adicional, autorización firmada, etc.)

El técnico **no puede enviar el checklist** con un invalidante marcado y estos dos campos vacíos, en los ítems donde ya está activo — el envío se bloquea de verdad a nivel de plataforma (no es solo una recomendación visual) y se muestra un aviso indicando qué ítem concreto falta por resolver.

> **Nota técnica (verificado 20/07/2026):** el bloqueo está implementado como workflow `Validar_Bloqueo_Invalidan` sobre `STOP2_Analisis_Previo`, trigger "Validaciones al enviar formularios" (on validate), evento de registro "Creado o editado". Para cada uno de los 6 ítems activos comprueba si el ítem está en condición de riesgo y si falta `Medida_Tomada_<ítem>` o `Foto_evidencia_<ítem>` (o `Foto_del_Permiso`/`Foto_de_herramienta_en_mal_estado` en los 2 ítems con nombre propio); si falta algo, hace `alert` con el detalle y `cancel submit`. Ver patrón reutilizable en memoria de proyecto (`on-validate-bloqueo-stop2.md`).

**Cómo revisar esto desde el Reporte STOP2:** abre el detalle de cualquier registro con `Valida Intervención = No` — encontrarás, junto a cada ítem invalidante marcado, la medida descrita por el técnico y la foto adjunta. Si un registro antiguo (previo al despliegue de esta funcionalidad) no tiene estos campos, es porque se generó antes de que este ítem concreto estuviera activo.

## 5. Reporte STOP2

**Ruta de menú:** RRHH → STOP2 Análisis Previo → STOP2 Reporte
**URL directa:** `#Report:STOP2_Analisis_Previo_Report`

![STOP2 Reporte](img/B-rrhh/B-stop2-reporte.png)

Listado completo de todos los checklists enviados por los técnicos, de cualquier cliente.

**Columnas principales:** Empleado, Cliente, Orden de Trabajo, Fecha Checklist, Valida Intervención.

**Acciones disponibles:**
- **Ver registro** — abre el detalle completo con los 22 ítems, medidas y fotos de evidencia
- **Búsqueda y filtros** — filtra por técnico, cliente, fecha o resultado de validación (ver Manual B §11 — Filtros en Reportes)
- **Exportar** — descarga el listado en Excel/CSV para auditorías

**Cómo revisar un análisis con alertas:**
1. Localiza los registros con **Valida Intervención = No**.
2. Abre el detalle y revisa qué ítems están marcados en riesgo.
3. Comprueba que la medida tomada y la foto de evidencia estén rellenas para cada uno.
4. Si falta información o la medida no parece adecuada, contacta con el técnico (Chat RRHH o directamente) para aclarar la situación antes de dar por cerrada la intervención.

## 6. Informe semanal automático a clientes

**Estado: desplegado y habilitado (verificado 20/07/2026).** El workflow `Enviar_Reporte_STOP2_Semanal` corre automáticamente cada **lunes a las 09:00 h** (zona horaria Europe/Madrid) y envía un correo por cada cliente que tuvo al menos una intervención STOP2 la semana anterior (lunes a domingo).

**Contenido del correo:** una tabla con una fila por cada checklist STOP2 de esa semana en ese cliente:

| Columna | Contenido |
|---------|-----------|
| Fecha | Fecha y hora del checklist |
| Técnico | Nombre del técnico que lo realizó |
| OT | Número de Orden de Trabajo |
| Cumplimiento | Ítems correctos sobre el total, formato `X/21` |
| Estado | **OK** (verde) si no hay alertas críticas, o **"N alerta(s) crítica(s)"** (rojo) |

> **Qué cuenta como "alerta crítica" en este correo concreto:** el workflow solo cuenta los 4 ítems del bloque Acceso — Trabajos Eléctricos, ATEX, Alturas y Espacios Confinados — marcados en condición de riesgo. No incluye Zona de Obra, Zona de Vehículos, Intemperie ni Limpieza Previa, aunque esos también sean invalidantes para el cálculo de `Valida Intervención` del registro individual (§3). Si necesitas ver el desglose completo de un checklist con cualquier tipo de alerta, consulta el registro en el Reporte STOP2 (§5), no solo el resumen del correo.

**A quién se envía:** al **Email para enviar reporte STOP 2** de la ficha del cliente si está relleno; si está vacío, el sistema envía automáticamente como alternativa a todos los contactos con email de **Personas Contacto en Planta** de ese cliente.

No es necesaria ninguna acción manual — el envío es automático. Si un cliente reporta que no recibió el informe, revisa la configuración de destinatarios (§7).

> Si en una semana concreta no hubo intervenciones registradas en un cliente, ese cliente simplemente no recibe correo esa semana — no es un fallo del sistema.

## 7. Configuración necesaria por cliente

Toda la configuración del informe STOP2 vive en la **ficha del cliente** (formulario `Nuevo_Cliente`), no hace falta tocar Configuración General:

| Campo en la ficha del cliente | Para qué sirve |
|-------------------------------|----------------|
| **Email para enviar reporte STOP 2** | Destinatario **prioritario** del informe semanal. Si está relleno, el correo se envía SOLO a esta dirección |
| **Email Responsable de Mantenimiento** | Se usa cuando un técnico indica que **no puede realizar el trabajo** — el aviso llega a este buzón para que mantenimiento actúe |

**Estado actual (verificado 20/07/2026):** los campos "Email para enviar reporte STOP 2" y "Email Responsable de Mantenimiento" ya existen en el formulario de cliente y están operativos. El workflow semanal ya aplica esta prioridad (STOP2 → fallback Planta) en producción.

**Pendiente:** no existe todavía un campo de tipo "STOP2 activo / inactivo" por cliente (para desactivar el módulo en clientes que no lo requieran). Si lo necesitas, coméntalo para priorizarlo.

**Cómo comprobar la configuración de un cliente:**
1. Abre la ficha del cliente en **Clientes** (módulo C).
2. Verifica que al menos un contacto en planta tenga email, o que el campo "Email para enviar reporte STOP 2" esté relleno.
3. Verifica el campo "Email Responsable de Mantenimiento" si ese cliente tiene equipos que puedan requerir intervención de mantenimiento.

## 8. Qué hacer ante un checklist con alertas

1. Localízalo en el **Reporte STOP2** (§5) filtrando por `Valida Intervención = No`.
2. Abre el detalle y revisa el ítem invalidante, la medida tomada y la foto de evidencia.
3. Si la medida es adecuada, no se requiere ninguna acción adicional — queda documentada para el informe semanal del cliente.
4. Si detectas que la medida no resuelve realmente el riesgo, o que el ítem se repite sistemáticamente con el mismo técnico o cliente, escala la situación fuera del sistema (contacto directo, revisión in situ) — STOP2 documenta el riesgo, no lo resuelve por sí mismo.

---

*Manual STOP2 (Supervisor) actualizado el 20/07/2026 — Gestión de Recursos Humanos v2026*
