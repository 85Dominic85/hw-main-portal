---
name: git-commit-helper
description: Genera mensajes de commit descriptivos a partir de los cambios staged. Úsalo cuando vayas a commitear y quieras un mensaje claro siguiendo conventional commits.
---

# Git Commit Helper

## Estructura

```
<tipo>(<scope>): <descripción imperativa, <72 chars>

<cuerpo opcional explicando el "por qué", no el "qué">

<footer opcional con BREAKING CHANGE, refs a issues, etc>
```

## Tipos

| Tipo | Cuándo |
|---|---|
| `feat` | Funcionalidad nueva visible al usuario |
| `fix` | Bug fix |
| `refactor` | Cambio interno sin alterar comportamiento |
| `perf` | Mejora de performance |
| `style` | Formato (no afecta lógica) |
| `test` | Tests nuevos o cambios en tests |
| `docs` | Documentación |
| `build` | Tooling de build, deps |
| `ci` | Cambios en CI |
| `chore` | Mantenimiento sin impacto funcional |

## Scopes habituales en este proyecto

- `connectors/mainops`, `connectors/hwtool`, `connectors/hsm`.
- `auth`.
- `db`, `migrations`.
- `kpi`, `kpi-cards`, `charts`.
- `home`, `mainops` (pestaña), `hwtool` (pestaña), `admin`.
- `exports`.
- `tooling`, `claude` (cuando toques `.claude/` o `.mcp.json`).

## Reglas

1. **Imperativo, presente**: "add user role check", no "added" ni "adds".
2. **Sin punto al final** del título.
3. **<72 chars** en el título.
4. **El cuerpo explica el porqué**: si está claro en el código, omite el cuerpo.
5. **Un commit, un cambio coherente**: si tienes que usar "and" en el título, divide.

## Ejemplos buenos

```
feat(connectors/mainops): add /api/metrics proxy with cache
fix(auth): reject signup when email is outside @qamarero.com
refactor(kpi): extract threshold evaluation into pure function
docs(adr): add ADR-0001 on connector architecture
chore(tooling): configure 12 subagents and 9 skills in .claude
```

## Ejemplos malos

```
update                              # vacío
fix bug                             # ¿qué bug?
WIP                                 # nunca commitear WIP a main
feat: add stuff                     # impreciso
```

## Cuando se te invoque

Lee el output de `git diff --staged` y propón:
- 1 mensaje principal recomendado.
- 1-2 alternativas si hay ambigüedad sobre el alcance.
- Sugerencia de **dividir** el commit si los cambios no son coherentes.
