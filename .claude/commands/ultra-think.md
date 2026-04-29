---
description: Análisis profundo multi-dimensional para decisiones arquitectónicas complejas.
allowed-tools: Read, Glob, Grep, WebSearch, WebFetch
---

# /ultra-think

Para decisiones arquitectónicas o de producto que merecen pensarse despacio: comparas opciones, evalúas trade-offs, anticipas consecuencias.

## Cuándo usar

- "¿Qué patrón de cache uso para los conectores?"
- "¿Migro a Server Components puros o mantengo TanStack Query?"
- "¿Vale la pena snapshots históricos en v2?"
- "¿Cómo estructuro el registro de KPIs para que sea extensible?"

NO usar para:
- Decisiones triviales (color de un botón).
- Cosas que ya están decididas en ADRs.

## Estructura del output

```markdown
## Pregunta
<la decisión a tomar, replanteada con precisión>

## Contexto relevante
- <lo que ya tenemos / hemos decidido>
- <restricciones>
- <stakeholders e incentivos>

## Opciones
### A — <nombre>
**Cómo**: <descripción técnica breve>
**Pros**: ...
**Contras**: ...
**Coste de implementar**: <bajo/medio/alto>
**Coste de revertir**: <bajo/medio/alto>

### B — ...
### C — ...

## Trade-offs cruzados
<cuál optimiza qué y a costa de qué>

## Recomendación
**Opción <X>** por <razón principal>.

**Cuándo NO sería esto**: <condiciones que invalidan>.

## Riesgos a vigilar
- <con métrica/señal observable>

## Próximos pasos si seguimos esta opción
1. ...
2. ...
```

## Reglas

- **No te quedes en abstracto**: cita archivos del repo cuando aplique.
- **Cuantifica**: "más rápido" → "60ms vs 300ms"; "más complejo" → "+200 líneas, 2 tablas nuevas".
- **Considera reversibilidad**: prefiere opciones que se puedan revertir si te equivocas.
- **Una sola recomendación final**: no "depende".
- **Si hay ADR existente que decide esto**: cítalo y di si la decisión sigue válida o si toca un nuevo ADR.
