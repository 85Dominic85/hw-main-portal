# AGENTS.md

Catálogo de subagentes del HW Main Portal. Cada uno especializado en un dominio; invocar el adecuado según la tarea.

## Resumen rápido

| Agente | Cuándo invocarlo |
|---|---|
| [database-architect](.claude/agents/database-architect.md) | Schema `portal`, migraciones Drizzle, RLS, índices, optimización queries |
| [frontend-developer](.claude/agents/frontend-developer.md) | Componentes React/Next.js, KPI cards, layouts, gráficas |
| [ui-ux-designer](.claude/agents/ui-ux-designer.md) | Crítica UI/UX, jerarquía visual, accesibilidad |
| [backend-architect](.claude/agents/backend-architect.md) | Conectores a herramientas, server actions, integraciones |
| [fullstack-developer](.claude/agents/fullstack-developer.md) | Features end-to-end (DB → server → UI) |
| [code-reviewer](.claude/agents/code-reviewer.md) | Pre-merge, auditorías de calidad y seguridad |
| [typescript-pro](.claude/agents/typescript-pro.md) | Tipado avanzado, generics, inferencia |
| [test-engineer](.claude/agents/test-engineer.md) | Estrategia y cobertura de tests |
| [debugger](.claude/agents/debugger.md) | Investigación y resolución de bugs |
| [deployment-engineer](.claude/agents/deployment-engineer.md) | Vercel, Supabase, env vars, dominios, rollbacks |
| [mcp-expert](.claude/agents/mcp-expert.md) | Configuración y debug de MCP servers |
| [documentation-expert](.claude/agents/documentation-expert.md) | CLAUDE.md, AGENTS.md, README, ADRs |
| [error-detective](.claude/agents/error-detective.md) | Patrones de errores recurrentes y cascadas |

## Cuándo combinar agentes

| Escenario | Agentes a usar |
|---|---|
| Añadir un KPI nuevo de cero | `backend-architect` (conector si extiende) → `database-architect` (si toca schema) → `frontend-developer` (tarjeta) → `test-engineer` (tests) |
| Bug en producción | `debugger` (causa raíz) → `error-detective` (si es patrón) → `code-reviewer` (validar fix) |
| Refactor grande | `code-reviewer` (validar cambios incrementales) → `test-engineer` (cubrir antes de mover) |
| Decisión arquitectónica | `/ultra-think` + `documentation-expert` (registrar ADR) |
| Nueva pestaña UI | `ui-ux-designer` (diseño) → `frontend-developer` (impl) → `code-reviewer` (revisión) |
| Conector nuevo | `/add-connector` → `backend-architect` → `typescript-pro` (genéricos) → `test-engineer` (tests) |

## Reglas de uso

- **No invoques un agente para tareas triviales**: lectura simple, edits puntuales, git status.
- **No dupliques esfuerzo**: si delegas investigación a un agente, no la rehagas tú.
- **Pasa contexto suficiente**: el agente no ve la conversación previa. Inclúyelo en el prompt.
- **Combina con skills y commands**: los agentes son perspectivas; las skills son know-how; los commands son flujos.
