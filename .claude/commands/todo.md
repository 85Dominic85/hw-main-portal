---
description: Lista TODOs/FIXMEs del código y los prioriza por urgencia/impacto.
allowed-tools: Glob, Grep, Read
---

# /todo

Inventario y priorización de la deuda técnica explícita en el código del portal.

## Pasos

1. **Busca patrones**: `TODO`, `FIXME`, `HACK`, `XXX`, `@todo`, `// REMOVE`, `unstable_` con comentario.
2. **Agrupa por área**: connectors, server, components, lib, sql, docs.
3. **Anota contexto**: archivo, línea, autor (de `git blame`), edad del comentario.
4. **Clasifica**:
   - **Bloqueante**: TODOs que comprometen seguridad o correctitud.
   - **Importante**: TODOs que limitan funcionalidad o mantenibilidad.
   - **Menor**: nice-to-haves, ideas futuras.
   - **Stale**: TODOs cuyo contexto ya no aplica → proponer borrar.

## Output

```markdown
## Bloqueantes (atender ya)
- [ ] `src/lib/connectors/mainops/client.ts:42` — TODO: handle 401 retry — autor X, hace 30 días
  - Propuesta: añadir retry once con backoff antes de devolver Result.error.

## Importantes
- [ ] `src/server/actions/notes.ts:18` — FIXME: validar markdown (XSS?) — hace 12 días
  - Propuesta: integrar `dompurify` o sanitizar en server.

## Menores
- [ ] ...

## Stale (proponer eliminar)
- `src/components/kpi/card.tsx:7` — TODO: use Tremor card — ya migrado, comentario olvidado.

## Nuevos riesgos detectados (sin TODO marcado)
- `src/lib/connectors/hwtool/client.ts:88` — fetch sin timeout — añadir AbortSignal.

## Recomendaciones de orden
1. Atacar bloqueantes esta sprint.
2. Stale: borrar comentarios en bloque (1 commit `chore`).
3. Importantes: meter en backlog priorizado.
```

## Reglas

- No crear nuevos TODOs durante este comando — solo inventariar.
- Si un TODO referencia a una persona externa (ej. "esperar a que MainOPS añada X"), márcalo como **bloqueado externamente** y nota qué se necesita.
