---
description: Evalúa decisiones arquitectónicas del portal — coherencia, escalabilidad, deuda técnica.
allowed-tools: Read, Glob, Grep, Bash(git log*)
---

# /architecture-review

Pasada arquitectónica al portal. Evalúa el estado del sistema en su conjunto, no archivo por archivo.

## Cuándo usar

- Antes de empezar v2 (HSM).
- Tras añadir 3+ features grandes.
- Cuando "algo no sienta bien" pero no hay un bug concreto.
- Antes de un handoff a otro dev/equipo.

## Áreas que cubres

### 1. Coherencia
- ¿Los conectores siguen el mismo patrón?
- ¿Hay lógica duplicada que debería estar en `lib/`?
- ¿Naming consistente entre módulos?

### 2. Capas
- ¿Server-only modules importados desde Client por error?
- ¿UI bypass del server (consultando DB directa)?
- ¿Validación Zod en los bordes correctos?

### 3. Escalabilidad
- ¿Cuántos archivos hay que tocar para añadir un KPI nuevo? Idealmente: 1.
- ¿Y para añadir una herramienta nueva? Idealmente: registrar en `lib/connectors/<name>/` y `lib/kpi/definitions.ts`.
- ¿La home renderiza N×M veces (N conectores × M KPIs)? Suspense boundaries por conector.

### 4. Deuda técnica
- TODOs / FIXMEs antiguos.
- Tipos `any` o casts.
- Archivos con >500 líneas.
- Funciones con >5 parámetros.
- Tests pendientes.

### 5. Seguridad
- RLS en todas las tablas del schema `portal`.
- Server actions verifican rol.
- Secrets fuera del bundle.
- Allowlist de dominio en signup.

### 6. Performance
- Cache aplicado donde toca.
- N+1 queries.
- Bundle size razonable (`npm run build` reporta).

### 7. Documentación
- ¿CLAUDE.md, AGENTS.md, README al día?
- ¿ADRs cubren las decisiones gordas?
- ¿`docs/connectors/` tiene un MD por conector existente?

## Output

```markdown
## Estado general
<una línea: salud arquitectónica del portal>

## Hallazgos por área
### Coherencia
- ✓ ...
- ⚠ ... — `archivo:línea`

### Capas
...

## Deuda priorizada
1. <crítico> — propuesta de fix.
2. <importante> — ...
3. <nice to have> — ...

## ADRs sugeridos
- "Por qué X" — si una decisión grande no está documentada.

## Próximos pasos recomendados
1. ...
```
