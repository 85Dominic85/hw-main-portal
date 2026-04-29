---
description: Añade un KPI nuevo al portal — definición, conector, tarjeta y test, en un solo flujo.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(npm run lint*), Bash(npm test*)
---

# /add-kpi

Scaffolda todo lo necesario para introducir un KPI nuevo al portal manteniendo el patrón establecido.

## Argumentos esperados (vía conversación)

- `id` — slug único (`mainops-orders-new`, `hwtool-plug-and-play-rate`).
- `connector` — `mainops` | `hwtool` | `hsm` | `manual`.
- `label` — texto visible (ej. "Pedidos nuevos").
- `description` — 1 línea.
- `unit` — número | porcentaje | moneda | días | etc.
- `formula` — pseudo-SQL o descripción breve.
- `period_default` — diario | semanal | mensual.
- `threshold` — opcional: regla de semáforo (ej. `< 5 → rojo`, `< 10 → ámbar`).

## Pasos del comando

1. **Pregunta los argumentos** que falten al usuario.
2. **Verifica que el `id` no existe** en `src/lib/kpi/definitions.ts`.
3. **Edita `src/lib/kpi/definitions.ts`** añadiendo la entrada del KPI.
4. **Si el conector necesita extender su shape**:
   - Actualiza `src/lib/connectors/<connector>/schema.ts` (Zod del payload).
   - Actualiza `src/lib/connectors/<connector>/mapper.ts` para extraer el campo.
5. **Si es manual**:
   - Verifica que la tabla `manual_entries` ya soporta el nuevo `kpi_id` o ajusta migración.
6. **Crea/actualiza componente de tarjeta**:
   - Si encaja en `KpiCard` genérico → solo registrar en home/pestaña.
   - Si necesita gráfica especial → componente nuevo en `src/components/kpi/`.
7. **Añade test** en `src/lib/kpi/<id>.test.ts` con casos: valor normal, vacío, umbral cruzado.
8. **Registra umbral** en `portal.kpi_thresholds` (si aplica) — propón script SQL.
9. **Lint + test**: deben pasar.
10. **Documenta**: actualiza `docs/connectors/<connector>.md` con el nuevo KPI.

## Output esperado

```markdown
KPI `mainops-orders-new` añadido.

Archivos tocados:
- `src/lib/kpi/definitions.ts` — entry
- `src/lib/connectors/mainops/mapper.ts` — extrae `orders_new` del payload
- `src/lib/kpi/mainops-orders-new.test.ts` — tests

Pasos manuales pendientes:
- Insertar threshold inicial en producción:
  INSERT INTO portal.kpi_thresholds (kpi_id, warn, danger) VALUES ('mainops-orders-new', 10, 5);

Lint: ✓
Tests: ✓
```
