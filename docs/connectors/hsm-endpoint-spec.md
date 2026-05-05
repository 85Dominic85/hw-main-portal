# HSM — Spec del endpoint para HW Main Portal

> Este documento define el contrato HTTP que **el repo `Hardware-Support-Manager-main` debe exponer** para que el HW Main Portal consuma sus métricas. Mismo patrón que el endpoint `/api/external/metrics` de MainOps (referencia: `hw-SellGear-platform`).
>
> **Dueño portal**: Domingo Bueno (`hardware@qamarero.com`).
> **Estado**: pendiente de implementar en HSM. El connector del lado portal (`src/lib/connectors/hsm/`) ya está construido contra este contrato. Cuando el endpoint exista y el portal tenga las env vars, el banner pasa de "Conectando con HSM…" a datos reales sin redeploy de código.

---

## 1. Endpoint

```
GET /api/external/metrics
```

- **Hosting**: el deploy de Vercel del HSM (cualquier dominio que termine en producción — el portal lo configurará vía env var `HSM_BASE_URL`).
- **Method**: `GET`. No mutation, idempotente.
- **Cache**: el portal cachea la respuesta 60 segundos por rango. HSM puede añadir `Cache-Control: max-age=60` opcionalmente.

## 2. Autenticación

Header obligatorio:

```
X-API-Key: <SECRET>
```

- El secreto se compara con la env var **`MAIN_PORTAL_API_KEY`** (misma convención que MainOps — secreto compartido entre HSM y el portal).
- Validación con `crypto.timingSafeEqual()` para mitigar timing attacks (mismo helper que `apps/web/lib/external-auth.ts` de MainOps).
- Si falta el header → `401 Unauthorized`.
- Si no coincide → `403 Forbidden`.
- Si la env var no está configurada en el server → `503 Service Unavailable` con `{ error: "MAIN_PORTAL_API_KEY no configurada" }`.

## 3. Query params

| Param | Tipo | Obligatorio | Default | Descripción |
|---|---|---|---|---|
| `from` | string `YYYY-MM-DD` | No | hace 30 días | Fecha inicio del rango (UTC, inclusive). |
| `to` | string `YYYY-MM-DD` | No | hoy | Fecha fin del rango (UTC, inclusive). |

**Validación**: si `from > to` o cualquiera no parsea como ISO date → `400 Bad Request` con `{ error, detail }`.

**Cap a hoy**: si `to` está en el futuro, recortar a `now`.

## 4. Cálculo del periodo anterior (CLAVE)

El portal necesita la **tendencia MoM**: el delta de SLA del periodo actual vs el periodo equivalente inmediatamente anterior. Para evitar 2 round-trips, **HSM calcula ambos periodos server-side y los devuelve en el mismo JSON**.

Cálculo del periodo anterior:
```ts
const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
const prevTo = new Date(from);
prevTo.setUTCDate(prevTo.getUTCDate() - 1);
const prevFrom = new Date(prevTo);
prevFrom.setUTCDate(prevFrom.getUTCDate() - (days - 1));
```

Ejemplo: `from=2026-04-01, to=2026-04-30` (30 días) → `prev_from=2026-03-02, prev_to=2026-03-31`.

## 5. Response shape

```json
{
  "generated_at": "2026-05-05T13:00:00.000Z",
  "schema_version": "1.0.0",
  "filters": {
    "from": "2026-04-01",
    "to": "2026-04-30",
    "prev_from": "2026-03-02",
    "prev_to": "2026-03-31"
  },
  "current": {
    "open_incidents": 24,
    "active_rmas": 8,
    "sla_compliance_pct": 67.5,
    "overdue_count": 4,
    "avg_resolution_hours": 18.4,
    "reopen_rate_pct": 2.3,
    "avg_rma_turnaround_days": 5.2,
    "critical_in_sla_pct": 92.0,
    "throughput_ratio": 0.85,
    "incidents_by_priority": [
      { "priority": "critica", "count": 13 },
      { "priority": "alta",    "count": 28 },
      { "priority": "media",   "count": 41 },
      { "priority": "baja",    "count": 19 }
    ],
    "aging_distribution": [
      { "bucket": "lt_1d",  "count": 6 },
      { "bucket": "1_3d",   "count": 9 },
      { "bucket": "3_7d",   "count": 5 },
      { "bucket": "gt_7d",  "count": 4 }
    ],
    "top_providers": [
      { "provider_id": "uuid", "provider_name": "Acme S.A.",   "rma_count": 12, "success_rate_pct": 83.3, "avg_turnaround_days": 4.8 },
      { "provider_id": "uuid", "provider_name": "Globex Ltd.", "rma_count":  8, "success_rate_pct": 75.0, "avg_turnaround_days": 6.1 }
    ]
  },
  "previous": {
    "sla_compliance_pct": 62.3,
    "avg_resolution_hours": 21.0,
    "reopen_rate_pct": 3.1,
    "open_incidents_at_close": 28
  }
}
```

### Tipos TypeScript

```ts
interface HsmExternalResponse {
  generated_at: string;       // ISO 8601 UTC
  schema_version: string;     // "1.0.0"
  filters: {
    from: string;             // YYYY-MM-DD
    to: string;
    prev_from: string;
    prev_to: string;
  };
  current: HsmCurrentMetrics;
  previous: HsmPreviousMetrics;
}

interface HsmCurrentMetrics {
  /** Status NOT IN ('resuelto','cerrado','cancelado'). */
  open_incidents: number;
  /** Status NOT IN ('recibido_oficina','cerrado','cancelado'). */
  active_rmas: number;
  /** % de incidencias resueltas dentro del SLA (0-100). */
  sla_compliance_pct: number;
  /** Incidencias abiertas hoy con elapsed > umbral (todas las prioridades). */
  overdue_count: number;
  /** Promedio horas createdAt → resolvedAt. null si no hay resueltos en el periodo. */
  avg_resolution_hours: number | null;
  /** % de incidencias resueltas que volvieron a abrir (0-100). */
  reopen_rate_pct: number;
  /** Días promedio de turnaround RMA. null si no hay RMAs cerradas. */
  avg_rma_turnaround_days: number | null;
  /** % CRÍTICAS resueltas en ≤8h (sobre total críticas resueltas). null si no hay críticas. */
  critical_in_sla_pct: number | null;
  /** (cerrados en el periodo) / (creadas en el periodo). 1 = paridad, >1 desatasco. */
  throughput_ratio: number;
  incidents_by_priority: Array<{ priority: string; count: number }>;
  aging_distribution: Array<{ bucket: "lt_1d" | "1_3d" | "3_7d" | "gt_7d"; count: number }>;
  /** Top 5 por rma_count (no por success_rate, para mostrar volumen real). */
  top_providers: Array<{
    provider_id: string;
    provider_name: string;
    rma_count: number;
    success_rate_pct: number;       // 0-100
    avg_turnaround_days: number | null;
  }>;
}

interface HsmPreviousMetrics {
  sla_compliance_pct: number;
  avg_resolution_hours: number | null;
  reopen_rate_pct: number;
  /** Incidencias abiertas en el last day del periodo anterior (snapshot). */
  open_incidents_at_close: number;
}
```

## 6. Implementación recomendada en HSM

Las queries necesarias **ya existen** en HSM. Solo hay que envolverlas en un route handler con cache:

```ts
// apps/web/app/api/external/metrics/route.ts
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { requireMainPortalAuth } from "@/lib/external-auth"; // crear igual que MainOps
import {
  getDashboardStats,
  getSlaMetrics,
  getAgingDistribution,
} from "@/server/queries/dashboard";
import {
  getProviderRmaVolume,
  getProviderSuccessRate,
  getProviderRmaTurnaround,
} from "@/server/queries/analytics";

export const runtime = "nodejs";  // necesario para crypto.timingSafeEqual

export async function GET(req: Request) {
  const authError = requireMainPortalAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? defaultFrom();
  const to = searchParams.get("to") ?? defaultTo();

  const { prevFrom, prevTo } = computePrevPeriod(from, to);

  const data = await unstable_cache(
    () => buildPayload({ from, to, prevFrom, prevTo }),
    ["hsm-external-metrics", from, to],
    { revalidate: 60, tags: ["hsm-external-metrics"] },
  )();

  return NextResponse.json(data, {
    headers: { "Cache-Control": "max-age=60, public" },
  });
}

async function buildPayload({ from, to, prevFrom, prevTo }: {
  from: string; to: string; prevFrom: string; prevTo: string;
}) {
  const fromDate = new Date(from);
  const toDate = endOfDayUtc(to);
  const prevFromDate = new Date(prevFrom);
  const prevToDate = endOfDayUtc(prevTo);

  // Reusa queries existentes — las funciones ya aceptan { dateFrom, dateTo }.
  const [
    stats,
    slaCurrent,
    agingDist,
    providersVolume,
    providersSuccess,
    providersTurnaround,
    slaPrev,
    statsPrevAtClose,
  ] = await Promise.all([
    getDashboardStats({ dateFrom: fromDate, dateTo: toDate }),
    getSlaMetrics({ dateFrom: fromDate, dateTo: toDate }),
    getAgingDistribution(),
    getProviderRmaVolume({ dateFrom: fromDate, dateTo: toDate }),
    getProviderSuccessRate({ dateFrom: fromDate, dateTo: toDate }),
    getProviderRmaTurnaround({ dateFrom: fromDate, dateTo: toDate }),
    getSlaMetrics({ dateFrom: prevFromDate, dateTo: prevToDate }),
    getDashboardStats({ dateFrom: prevFromDate, dateTo: prevToDate }),
    // throughput_ratio y critical_in_sla_pct: añadir 2 queries pequeñas o calcular
    // a partir de getIncidents() filtrado, según prefieras.
  ]);

  // Merge top providers por rma_count + success_rate + avg_turnaround.
  const topProviders = mergeProviders(providersVolume, providersSuccess, providersTurnaround)
    .sort((a, b) => b.rma_count - a.rma_count)
    .slice(0, 5);

  return {
    generated_at: new Date().toISOString(),
    schema_version: "1.0.0",
    filters: { from, to, prev_from: prevFrom, prev_to: prevTo },
    current: {
      open_incidents: stats.openIncidents,
      active_rmas: stats.activeRmas,
      sla_compliance_pct: slaCurrent.slaCompliancePercent,
      overdue_count: slaCurrent.overdueCount,
      avg_resolution_hours: slaCurrent.avgResolutionHours,
      reopen_rate_pct: slaCurrent.reopenRate,
      avg_rma_turnaround_days: slaCurrent.avgRmaTurnaroundDays,
      critical_in_sla_pct: /* calcular */,
      throughput_ratio: /* calcular */,
      incidents_by_priority: slaCurrent.incidentsByPriority,
      aging_distribution: agingDist.map(toBucket),
      top_providers: topProviders,
    },
    previous: {
      sla_compliance_pct: slaPrev.slaCompliancePercent,
      avg_resolution_hours: slaPrev.avgResolutionHours,
      reopen_rate_pct: slaPrev.reopenRate,
      open_incidents_at_close: statsPrevAtClose.openIncidents,
    },
  };
}
```

### Helpers a crear en HSM

```ts
// apps/web/lib/external-auth.ts
import { timingSafeEqual } from "crypto";

export function requireMainPortalAuth(req: Request): Response | null {
  const expected = process.env.MAIN_PORTAL_API_KEY;
  if (!expected) {
    return Response.json(
      { error: "MAIN_PORTAL_API_KEY no configurada" },
      { status: 503 },
    );
  }
  const provided = req.headers.get("x-api-key") ?? "";
  if (!provided) {
    return Response.json({ error: "Missing X-API-Key header" }, { status: 401 });
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ error: "Invalid API key" }, { status: 403 });
  }
  return null;
}
```

### `throughput_ratio`

```sql
-- (cerrados en el periodo) / (abiertos creados en el periodo)
WITH closed AS (
  SELECT COUNT(*) c FROM hsm.incidents
  WHERE resolved_at >= $1 AND resolved_at <= $2 AND status IN ('resuelto','cerrado')
), opened AS (
  SELECT COUNT(*) c FROM hsm.incidents
  WHERE created_at >= $1 AND created_at <= $2
)
SELECT CASE WHEN opened.c = 0 THEN 1 ELSE closed.c::float / opened.c END
FROM closed, opened;
```

### `critical_in_sla_pct`

```ts
// % de incidencias priority='critica' resueltas en <= 8h en el rango.
const result = await db
  .select({
    total: sql<number>`COUNT(*)::int`,
    inSla: sql<number>`COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (resolved_at - created_at)) <= ${8 * 3600})::int`,
  })
  .from(incidents)
  .where(and(
    eq(incidents.priority, 'critica'),
    inArray(incidents.status, ['resuelto', 'cerrado']),
    gte(incidents.resolvedAt, fromDate),
    lte(incidents.resolvedAt, toDate),
  ));

const pct = result.total === 0 ? null : (result.inSla / result.total) * 100;
```

## 7. Errores

Forma estándar para todos los códigos no-2xx:

```json
{
  "error": "human-readable summary",
  "detail": "optional technical detail (stack, query failed, etc.)"
}
```

Códigos esperados:
- `400` — query params inválidos.
- `401` — header `X-API-Key` ausente.
- `403` — header presente pero no coincide.
- `500` — error interno (DB caída, query failed, etc.).
- `503` — env var de auth no configurada.

El portal trata cualquier no-2xx como connector down y muestra el escudo neutral con un mensaje "API HSM no disponible — <error>".

## 8. CORS

**No es necesario**. El portal hace fetch server-side desde Vercel (Next.js Server Component), no desde el navegador. Si HSM no añade headers CORS, no rompe nada.

## 9. Rate limit / caching

- HSM puede añadir `Cache-Control: max-age=60, public` para reforzar el cache de 60s del portal.
- Si HSM tiene rate-limiter, el portal solo hace 1 request por rango cada 60s en escenarios normales (cuando un usuario navega por la home). Permitir al menos **30 req/min** desde la IP del portal Vercel.

## 10. Verificación end-to-end

Una vez desplegado en HSM, el portal puede verificar con:

```bash
curl -s -H "X-API-Key: $MAIN_PORTAL_API_KEY" \
  "https://<hsm-vercel-url>/api/external/metrics?from=2026-04-01&to=2026-04-30" | jq .
```

Debe responder 200 con la estructura JSON de la sección 5.

Si responde:
- 401/403 → revisar la env var `MAIN_PORTAL_API_KEY` en Vercel del HSM.
- 503 → la env var no está set. Configurar en Vercel → Settings → Env Vars → Production + Preview → redeploy.
- 500 → revisar logs de Vercel del HSM. Probablemente alguna query subyacente falla.

---

## 11. Checklist para Domi

- [ ] Crear PR en `Hardware-Support-Manager-main` con:
  - [ ] `apps/web/lib/external-auth.ts` (helper con `timingSafeEqual`)
  - [ ] `apps/web/app/api/external/metrics/route.ts` (handler con cache)
  - [ ] Tests unitarios del handler (mocks de queries)
- [ ] Configurar `MAIN_PORTAL_API_KEY` en Vercel del HSM (Production + Preview). **Mismo valor** que el portal (genera el secret una sola vez con `openssl rand -hex 32` y replica).
- [ ] Verificar con curl (sección 10).
- [ ] Avisar a Domi para que setee `HSM_BASE_URL` y `HSM_API_KEY` en Vercel del portal y haga redeploy.
- [ ] Verificar en `https://hw-main-portal.vercel.app/` — el banner HSM debería pasar de "Conectando con HSM…" a datos reales en máximo 60s tras el redeploy.

## 12. Referencias

- MainOps endpoint equivalente: `apps/web/app/api/external/metrics/route.ts` en `hw-SellGear-platform`.
- Connector portal correspondiente: `src/lib/connectors/hsm/` (ya construido contra este contrato).
- Banner home: `src/components/connectors/hsm-banner.tsx`.
- Pestaña detalle: `src/app/(portal)/hsm/page.tsx`.
