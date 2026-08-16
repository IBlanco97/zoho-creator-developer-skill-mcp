---
name: zoho-review-session
description: >
  Revisa la sesión actual en busca de aprendizajes para mejorar la skill zoho-creator-dev,
  el MCP o la memoria de proyecto. Busca errores corregidos, selectores que fallaron,
  métodos más eficientes descubiertos, limitaciones de plataforma nuevas.
  Sin sobrepensar: solo cambios que realmente ahorren tiempo o eviten errores futuros.
metadata:
  author: sicma21
  version: "1.0"
---

# Zoho Session Review

Examina la sesión en busca de conocimiento accionable para mejorar el tooling de este proyecto.
Solo cambios que realmente ahorren tiempo o eviten errores futuros — no recargar con teoría.

## Qué buscar

### 1. Errores en la skill (`~/.claude/commands/zoho-creator-dev.md`)
- Selectores CSS/JS que fallaron y cuál fue el correcto
- Pasos de flujo que no funcionaron (orden incorrecto, espera insuficiente, etc.)
- Limitaciones de plataforma descubiertas (features que Zoho no soporta, endpoints que dan 500)

### 2. Patrones más eficientes descubiertos
- Si se encontró un método más rápido para algo ya documentado → reemplazar, no añadir
- Si se descubrió un gotcha recurrente → añadir a la tabla de errores comunes

### 3. Memoria del proyecto (`memory/MEMORY.md` y archivos relacionados)
- IDs de componentes nuevos descubiertos
- Estado actualizado de features (DONE/DESCARTADO/NO DISPONIBLE)
- Notas sobre comportamiento confirmado (lo que antes era "pendiente verificar")

## Cómo aplicar los cambios

- Leer la sección relevante de la skill ANTES de editar
- Preferir editar una entrada existente a añadir una nueva
- Si es un error nuevo en la tabla → añadirlo al final de la tabla de errores
- Si es una corrección de selector/paso → editar in-place, no duplicar
- Máximo 5-6 cambios por sesión — si hay más, priorizar los que evitan bloqueos

## Formato de cambios en tabla de errores

| Problema exacto (síntoma) | Causa raíz | Solución concreta (código si aplica) |

## Al terminar

Confirmar qué se cambió y por qué, en 3-5 bullets concisos.
