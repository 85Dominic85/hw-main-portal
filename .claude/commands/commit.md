---
description: Crea un commit git con mensaje descriptivo siguiendo conventional commits, tras correr lint y validación.
allowed-tools: Bash(git status), Bash(git diff*), Bash(git log*), Bash(git add*), Bash(git commit*), Bash(npm run lint*), Bash(npm test*)
---

# /commit

Genera y crea un commit con un mensaje descriptivo a partir de los cambios staged. Sigue las reglas de la skill `git-commit-helper` (conventional commits con scope del proyecto).

## Pasos

1. **Verifica estado**: `git status` para ver staged y untracked.
2. **Inspecciona cambios**: `git diff --staged` y `git diff` (no staged).
3. **Lee historial reciente**: `git log --oneline -10` para coherencia de estilo.
4. **Pregunta al usuario** si quiere incluir untracked relevantes en el commit.
5. **Lint pre-commit**: `npm run lint`. Si falla, **NO commitees**, reporta los errores.
6. **Tests rápidos** (opcional): si la skill `code-reviewer` lo recomendó o si el cambio toca `lib/connectors/` o `server/`, corre `npm test`.
7. **Genera el mensaje** con la skill `git-commit-helper`. Aplica:
   - tipo + scope correctos
   - <72 chars en título
   - cuerpo solo si añade contexto no derivable del diff
8. **Muestra el mensaje propuesto** y pide confirmación al usuario antes de commitear.
9. **Commit**: `git commit -m "..."` con HEREDOC para preservar saltos de línea.
10. **Verifica**: `git status` para confirmar el commit limpió el staging.

## Reglas no negociables

- NUNCA `--no-verify` (saltar hooks).
- NUNCA `--amend` salvo que el usuario lo pida explícitamente.
- NUNCA hacer push automático.
- NUNCA incluir secretos (`.env`, claves) en el commit.
- Si el lint falla: arregla la causa, no la suprimas.

## Ejemplo de salida esperada

```
Lint: ✓ pasó
Diff analizado: cambios en src/lib/connectors/mainops/{client,schema}.ts

Mensaje propuesto:
  feat(connectors/mainops): wire /api/metrics proxy with Zod validation

  - Add typed client wrapping MainOPS GET /api/metrics
  - Validate response with Zod, surface parse errors as Result.error
  - 60s unstable_cache with 'mainops-metrics' tag

¿Procedo con el commit? (s/n)
```
