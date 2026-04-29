# ADR-0003: Sin snapshots históricos propios — filtros temporales al vuelo

## Estado
Aceptado — 2026-04-28.

## Contexto

Al diseñar el portal se evaluaron tres modelos de gestión de tendencias:

1. Snapshot diario en `portal.kpi_snapshots` (cron nocturno).
2. Snapshot por hora (más granular).
3. Sin tabla de snapshots — calcular tendencias al vuelo desde las DBs de origen, que ya guardan timestamps en cada operación (`orders.created_at`, `hw_config.fecha_hora`, `incidents.created_at`, etc.).

El usuario propietario del portal manifestó que el portal es **un panel de consulta puntual**: se entra, se ven las métricas del rango deseado, se exporta si hace falta y se sale. Las herramientas de origen ya retienen el detalle.

## Decisión

**No mantener tabla de snapshots históricos en el schema `portal`**. Las visualizaciones temporales (filtros diario / semanal / quincenal / mensual / personalizado) se calculan al vuelo desde las DBs de origen.

## Consecuencias

**Positivas**
- Schema `portal` más simple — 6 tablas en lugar de 7+. Menos RLS que mantener.
- Cero job de cron que orquestar.
- Los datos siempre coinciden con la herramienta de origen — no hay desfase ni "snapshot olvidado".
- Cero almacenamiento desperdiciado en Supabase.

**Negativas**
- Tendencias muy largas (>1 año) cargan más lento porque se calculan en cada visita.
- Si una herramienta de origen borra registros antiguos, el portal pierde visibilidad de ese pasado.
- No hay forma trivial de comparar "hoy" con "hace 1 año" sin dejar la página esperando.

**Mitigaciones aceptadas**
- Cache `unstable_cache(60s)` evita recalcular 100 veces por minuto.
- Filtros temporales por defecto cortos (semanal o mensual) — la mayoría de queries son rápidas.
- Si en v2 surgen necesidades reales de tendencias multi-año, se introducirá `portal.kpi_snapshots` como cache materializado, sin romper el modelo.

**Neutras**
- Los KPIs basados en `manual_entries` ya guardan su propio histórico en `portal.manual_entries` — esto sigue siendo histórico real, no es snapshot derivado.

## Alternativas consideradas

### A — Snapshot diario (descartada para v1)
Cron nocturno que vuelca KPIs en `portal.kpi_snapshots`.
**Por qué no**: añade complejidad operativa sin ROI claro en v1. El usuario lo desestimó: "veo algo innecesario, esto es un panel que se va a consultar al momento".

### B — Snapshot por hora (descartada)
Más granular que A.
**Por qué no**: aún más overhead, mismo argumento de A amplificado.

### C — Vista materializada en cada Supabase de origen (descartada)
Pedir a los equipos de las herramientas que mantengan vistas pre-agregadas.
**Por qué no**: acoplaría el portal a la velocidad de roadmap de las herramientas y multiplicaría puntos de fallo.

## Cuándo revisar esta decisión

Esta decisión se revisará si:
- Las queries cross-tool tardan >5s P95 con cache caliente.
- Surge una necesidad operativa de "comparar este trimestre con el del año pasado" que el management consulte semanalmente.
- Una herramienta de origen empieza a purgar registros antiguos sistemáticamente.

En ese caso, el cambio sería aditivo: introducir `portal.kpi_snapshots` como cache derivado, sin tocar la lógica de los conectores.

## Referencias

- ADR-0001 — arquitectura de conectores (independiente de esta decisión).
- `src/lib/connectors/<name>/index.ts:getMetrics(filter)` — donde se aplican filtros temporales.
