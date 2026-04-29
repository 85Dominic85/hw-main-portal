---
name: code-reviewer
description: Checklist sistemático para revisar cambios de código en el portal. Úsalo antes de mergear, en auditorías, o cuando quieras una pasada estructurada de calidad.
---

# Code Review — checklist del portal

## Bloqueantes de merge

### Seguridad
- [ ] Sin secrets en código (regex `sk_`, `eyJhbGciOi`, `password=`).
- [ ] Server actions con auth + role check antes de input parsing.
- [ ] Inputs validados con Zod antes de tocar DB.
- [ ] Sin SQL strings con interpolación directa.
- [ ] `dangerouslySetInnerHTML` justificado y sanitizado.
- [ ] RLS habilitada en tablas nuevas.

### Correctitud
- [ ] TypeScript sin `any` ni `// @ts-ignore` sin comentario.
- [ ] Promises con await o `.then` (sin "fire and forget" no intencional).
- [ ] Manejo de errores explícito en async (try/catch o `.catch`).
- [ ] Server vs Client Components correctamente marcados.
- [ ] Server-only modules no importados desde Client.

### Tests
- [ ] Lógica nueva crítica (connectors, server actions, KPI calc) tiene test.
- [ ] Tests verdes localmente.

## Importantes (corregir en este PR si es razonable)

### Performance
- [ ] No N+1 (loops con awaits a DB).
- [ ] `useMemo`/`React.memo` solo donde aporta.
- [ ] Componentes pesados con `dynamic()` si no son críticos.
- [ ] Cache (`unstable_cache`) en server fetches a conectores externos.
- [ ] Suspense boundaries por conector.

### Legibilidad
- [ ] Naming claro (sin abreviaturas no estándar).
- [ ] Funciones <50 líneas (signal, no regla).
- [ ] Niveles de indentación <4.
- [ ] Sin código muerto / comentado.
- [ ] Imports ordenados (auto vía ESLint).

### UI/UX
- [ ] Loading, empty, error states presentes.
- [ ] Accesibilidad básica (labels, foco, contraste).
- [ ] Sin layout shifts evidentes.

## Menores

- [ ] Comentarios solo donde el código no se explica solo.
- [ ] Magic numbers nombrados.
- [ ] Strings de UI consolidados (no repetidos).

## Formato de la review

```markdown
## Resumen
<1-2 frases>

## Bloqueantes
- [ ] <issue> — `archivo:línea`

## Importantes
- ...

## Menores
- ...

## Bien
- ...
```

Sé concreto: archivo + línea + sugerencia. No "esto se puede mejorar" sin más.
