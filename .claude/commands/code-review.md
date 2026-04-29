---
description: Revisa los cambios pendientes (staged o de la rama actual vs main) usando el checklist de calidad del portal.
allowed-tools: Bash(git diff*), Bash(git status), Bash(git log*), Bash(git branch*), Read, Grep, Glob
---

# /code-review

Aplica el checklist sistemático de la skill `code-reviewer` a los cambios actuales.

## Modos

- `/code-review` — revisa lo staged.
- `/code-review HEAD~1` — revisa el último commit.
- `/code-review main` — revisa la rama actual vs main.

## Pasos

1. **Determina alcance**: si el usuario pasó argumento, úsalo. Si no, `git diff --staged` y si vacío, `git diff main...HEAD`.
2. **Lista archivos**: agrupa por área (connectors, server, components, lib, app).
3. **Lee cada cambio** con `Read` o `git diff <file>`.
4. **Aplica checklist** de la skill:
   - Bloqueantes: seguridad, correctitud, tests críticos.
   - Importantes: performance, legibilidad, UI/UX.
   - Menores: comentarios, magic numbers, naming.
5. **Detecta señales rojas con grep**:
   - Secrets hardcoded: `password`, `sk_`, `eyJhbG`.
   - `any`, `@ts-ignore`, `@ts-expect-error` sin comentario.
   - `console.log` en código de producción.
   - `TODO`/`FIXME` añadidos.
6. **Output** en formato markdown:

```markdown
## Resumen
<1-2 frases de qué hace el cambio>

## Bloqueantes
- [ ] <issue> — `archivo:línea` — <sugerencia de fix>

## Importantes
- ...

## Menores
- ...

## Lo que está bien
- ...
```

## Reglas

- Cita siempre `archivo:línea` cuando puedas.
- Distingue gusto vs. correctitud.
- Si todo está OK, dilo claramente: "No hay bloqueantes".
- Si invocas a otro agente (`code-reviewer`, `typescript-pro`), no dupliques su trabajo.
