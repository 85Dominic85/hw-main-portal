# ADR-0001: Arquitectura de conectores híbridos por herramienta

## Estado
Aceptado — 2026-04-28.

## Contexto

El HW Main Portal debe agregar métricas en tiempo real de 3 herramientas internas del departamento de Hardware:

- **HSM** (Hardware Support Manager) — Next.js + Supabase, schema `hsm`, role `hsm_app`.
- **MainOPS** (`hw-SellGear-platform`) — Next.js + Supabase, project `gbuifpsgcvxmuwzoyush`, schema `public`. Expone `GET /api/metrics`.
- **HW Tool** (`staging-schema-manager`) — Vite + Supabase, project `olcxbtvjkjmofrbvzpat`, schema `hw_staging`. Sin API agregada.

(La herramienta de finanzas/contabilidad del dpto queda fuera del alcance del portal — se gestiona aparte y no se integra aquí.)

Cada herramienta:
- vive en un **proyecto Supabase distinto** (refs verificados: MainOPS y HW Tool difieren),
- usa un **sistema de auth distinto** (NextAuth credenciales, Supabase Auth, Google Workspace),
- expone un **nivel de "API" muy diferente** (de `/api/metrics` listo a "no hay API").

## Decisión

Adoptamos un patrón **híbrido por conector**, donde cada herramienta tiene un módulo independiente en `src/lib/connectors/<name>/` que implementa una interfaz común `Connector<T>` y elige internamente cómo obtener los datos:

| Herramienta | Patrón | Justificación |
|---|---|---|
| MainOPS | HTTP proxy a `GET /api/metrics` | Endpoint ya existe — cero duplicación. |
| HW Tool | Cliente Supabase RO sobre `hw_staging` | Sin API; montar una sería desproporcionado para 5 KPIs. |
| HSM (v2) | Envolver `src/server/queries/{dashboard,analytics}.ts` en `/api/portal/metrics` | Funciones agregadas ya escritas — solo hace falta exponerlas. |

Sobre esa heterogeneidad montamos:

- **Interfaz uniforme**: `getMetrics(filter)`, `getHotList()`, `healthcheck()`.
- **Tipos Zod en el borde**: cada conector valida lo que entra del exterior antes de mapearlo a la shape canónica de KPI del portal.
- **Cache uniforme**: `unstable_cache` con tag `<name>-metrics` y `revalidate: 60s`.
- **Errores con shape consistente**: `Result<T> = { ok: true, data } | { ok: false, error }`.
- **Refresco solo al cargar**: sin polling ni Realtime; el botón "Actualizar" hace `revalidateTag`.

## Consecuencias

**Positivas**
- Cada herramienta evoluciona a su ritmo sin afectar al resto.
- Añadir una 5ª herramienta es registrar un módulo en `lib/connectors/` y un `KpiDefinition`. Cambios localizados.
- Si una herramienta cae, los Suspense boundaries por conector evitan que tire la home entera.
- No hay BD agregada a mantener / sincronizar.

**Negativas**
- Más código que un patrón único (cada conector reimplementa fetch + cache + parse).
- El portal no puede hacer JOINs cross-tool en SQL — la composición ocurre en TypeScript.
- Cuatro contratos que mantener (uno por herramienta), aunque ya existen 3 sin nuestro esfuerzo.

**Neutras**
- El usuario percibe los datos "siempre frescos al cargar", a costa de pegar a las DBs de origen al refrescar (mitigado por cache 60s).

## Alternativas consideradas

### A — Lectura multi-schema directa (descartada)
Un único cliente Supabase del portal con role read-only que ve todos los schemas (`hsm`, `mainops`, `hwtool`).
**Por qué no**: las herramientas viven en proyectos Supabase distintos. No comparten instancia. Imposible salvo migración masiva.

### B — Tabla de KPIs precalculada con cron (descartada para v1)
Cada herramienta empuja a `portal.kpi_snapshots`, o el portal corre cron jobs que pollean.
**Por qué no en v1**: añade latencia, scheduler que mantener, y duplica datos. El usuario aceptó "consulta puntual" como modelo y descartó snapshots históricos.

### C — Una API agregadora central (descartada)
Levantar un servicio backend único que llama a todas las herramientas.
**Por qué no**: el portal mismo (Next.js) ya puede hacer eso desde sus Server Components y route handlers — no merece la pena un servicio extra.

## Referencias

- `src/lib/connectors/` — implementación por herramienta.
- ADR-0003 — sin snapshots históricos.
