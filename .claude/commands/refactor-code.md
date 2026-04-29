---
description: Refactoriza código existente sin alterar comportamiento — extrae funciones, simplifica, elimina duplicación.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(npm test*), Bash(npm run lint*)
---

# /refactor-code

Limpia código existente del portal sin cambiar comportamiento observable.

## Modos

- `/refactor-code <archivo>` — refactoriza un archivo específico.
- `/refactor-code <patrón>` — refactoriza ficheros que matchean (ej. `src/components/kpi/*.tsx`).
- Sin argumento — pregunta qué refactorizar.

## Reglas

1. **Tests primero**: si no hay tests del área, **avisa al usuario** y propón añadirlos antes de refactorizar.
2. **Comportamiento idéntico**: tras el refactor, los tests existentes deben pasar sin cambios.
3. **Cambios pequeños y revisables**: prefiere varios edits enfocados que uno enorme.
4. **No mezclar features**: si encuentras un bug, déjalo apuntado en un TODO o crea otro PR.

## Patrones de refactor habituales

- Funciones largas (>50 líneas) → extraer.
- Lógica duplicada en 3+ sitios → extraer a util.
- Componentes con >5 props → considerar composición / slot pattern.
- Branches anidados → early return.
- Magic numbers → constante con nombre.
- `any` → tipo concreto (con `typescript-pro`).

## Pasos

1. **Lee el código** completo del archivo objetivo.
2. **Lista los smells** detectados.
3. **Propón el refactor** al usuario antes de aplicarlo si es no-trivial.
4. **Aplica con Edit** los cambios.
5. **Corre tests + lint**: deben pasar.
6. **Resume cambios** con archivos y line ranges.

## Anti-patrones del propio refactor

- Cambiar APIs públicas sin actualizar consumidores.
- Renombrar archivos que aparecen en imports sin actualizar.
- "Refactorizar" añadiendo abstracciones que no se usan.
- Refactorizar y arreglar bugs en el mismo cambio.
