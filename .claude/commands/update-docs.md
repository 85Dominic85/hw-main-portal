---
description: Sincroniza CLAUDE.md, AGENTS.md, README.md y docs/ con el estado actual del código.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(git log*), Bash(git diff*)
---

# /update-docs

Detecta drift entre la documentación y el código real, y lo corrige.

## Pasos

1. **Inventario actual**:
   - Stack: lee `package.json` para librerías y versiones.
   - Subagentes: lista archivos en `.claude/agents/`.
   - Skills: lista en `.claude/skills/`.
   - Commands: lista en `.claude/commands/`.
   - MCPs: lee `.mcp.json`.
   - Conectores: lista en `src/lib/connectors/`.
   - Tablas: lee `src/lib/db/schema/`.

2. **Compara con docs**:
   - `CLAUDE.md`: tabla de stack, mapas de tooling.
   - `AGENTS.md`: tabla de subagentes.
   - `README.md`: env vars, comandos, deploy.
   - `docs/connectors/<name>.md`: existe uno por cada conector activo?
   - `docs/adr/`: hay ADRs sin actualizar (estado superseded sin marcar)?

3. **Reporta drift**:
   - Cosas que existen en código pero no en docs.
   - Cosas que se mencionan en docs pero ya no existen.
   - Versiones de stack desfasadas.

4. **Pregunta antes de actualizar** si hay cambios significativos.

5. **Actualiza** los archivos con Edit.

## Reglas

- **Concisión**: si una sección crece desproporcionadamente, refactoriza.
- **No duplicar**: si una info está en código bien nombrado, no la repitas.
- **ADRs son inmutables**: si una decisión cambió, no edites el ADR; crea uno nuevo.
- **`.env.example` siempre al día**: cualquier var nueva en código → entra en el ejemplo.

## Output

```markdown
## Drift detectado
- CLAUDE.md menciona X pero ya no existe.
- README falta: env var Y.
- AGENTS.md no incluye agente Z creado en commit abc123.
- ...

## Cambios aplicados
- `CLAUDE.md` — actualizada tabla de stack.
- `README.md` — añadida sección de env vars Y.
- `AGENTS.md` — añadida fila para agente Z.

## Acciones recomendadas (no aplicadas)
- Crear ADR para decisión sobre <tema> (no documentada).
```
