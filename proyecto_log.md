# HW Main Portal — Proyecto Log

> **Fuente de verdad para handoffs**. Si retomas el proyecto desde otra sesión, empieza leyendo este archivo. Cubre estado actual, decisiones tomadas, bugs conocidos, credenciales (referencias, sin valores), backlog priorizado, comandos útiles e histórico de iteraciones.
>
> Última actualización: **2026-05-05 17:30 UTC** · v0.4 con connector HSM listo (espera endpoint) + selector global de periodo en home · 43/43 tests verdes.

---

## Estado actual — v0.4 (connector HSM + selector home)

El portal está **desplegado en producción** (`https://hw-main-portal.vercel.app/`) sin auth (modo abierto temporal) con:

- **Selector global de periodo en home** (v0.4): pills `Mes en curso / 7d / 15d / 30d / Custom…` arriba a la derecha. Estado en URL (`?period=...&from=...&to=...`). Custom expande dos inputs date inline + botón Aplicar (sin nuevas dependencias). Cada cambio dispara re-fetch fresh de los 3 escudos en paralelo (Suspense con key derivada del rango). Default: mes natural en curso. Helper neutral en `src/lib/home/period.ts`. Selector NO comparte estado con los selectores de las pestañas detalle (decisión 2026-04-30).
- **Connector HSM** (v0.4): completo del lado portal (`src/lib/connectors/hsm/`), banner home `<HsmBanner>` con hero "delta MoM en pp", pestaña `/hsm` con dashboard completo, server query con cache 60s + throw-no-cache, helper periodo, period selector. Espera endpoint en HSM (`docs/connectors/hsm-endpoint-spec.md` lista para que el dev de HSM lo implemente). Failsafe: sin env vars el banner muestra "Conectando con HSM…" en escudo neutral; cuando se publique el endpoint y se setee `HSM_BASE_URL` + `HSM_API_KEY` en Vercel, los datos aparecen automáticamente sin redeploy del portal.
- **Naming UI** (cambio v0.3): `MainOPS` → **Logística**, `HW Tool` → **Configuraciones** en sidebar, topbar, banners y mensajes. Slugs de rutas y código interno mantienen los originales (`/mainops`, `/hwtool`, `lib/connectors/mainops/...`). Iniciales del botón sobre escudo se mantienen (MOP / HWT / HSM).
- **Logo del sidebar** (cambio v0.3): `<PortalLogo variant="hub-shield-pulse">` + texto "Hardware Dashboard" (antes "Qamarero / HW"). Variantes alternativas en `/lab/logos` y `/lab/logos/hub-shield`.
- **Modo claro pulido** (v0.3): `--background` pasa de blanco puro a gris-azulado `220 20% 97%`, `--card` queda blanco para crear capa con sidebar/topbar. `--border` de 91% a 85%. Glow del Shield migrado a CSS var `--shield-glow-opacity` (0.6 light / 0.35 dark) para que el halo sea visible sobre blanco. `<UpdatesList>` items con `border-border/40 bg-card`. `<ToolShortcut>` con sombra neutra `hsl(220 20% 0%/0.12)`.
- **Home**: 3 escudos heráldicos (variante `rivets-double`) con KPI hero y 3 líneas de updates por herramienta.
  - **Logística** ✅ datos reales — **hero: `ops.on_time_shipping_pct`** (`73.7%` en abril 2026 — métrica del depto, no SLA end-to-end). Umbrales semáforo recalibrados v0.3: `≥85 ok / ≥70 warn / <70 danger` (handling depto, no SLA end-to-end). Fallback a `sla.on_time_pct` con umbrales antiguos si la API no devuelve `ops`.
  - **Configuraciones** ✅ datos reales — `% configs OK a 1ª intento` como hero (82.3% verde).
  - **HSM** 🟡 connector completo del lado portal — espera endpoint `/api/external/metrics` en HSM. Mientras `HSM_BASE_URL`/`HSM_API_KEY` no estén en Vercel, el banner muestra "Conectando con HSM…" en escudo neutral, sin romper la home. Hero (cuando llegue): **delta MoM del SLA en pp** (decisión 2026-04-30 — mostrar tendencia, no absoluto, porque el SLA actual es bajo y la tendencia mejorando es lo accionable).
- **Pestaña `/mainops`**:
  - Sección **"Actividad operativa"** arriba (si la API devuelve `ops`): 6 KPI cards (enviados, completados, bloqueados / handling-d, transit-d, cumplimiento 5d) + bar chart de throughput semanal (created / shipped / delivered).
  - Badge "En rodaje desde 21-abr" si `ops.total_shipped < 10` (TIPSA arrancó esa fecha).
  - Sección **"Negocio"** debajo: 5 KPI cards (pedidos, ingresos, ticket medio, %SLA on-time, %completados — ahora muestra valor real 84.8% tras fix del 2026-04-30).
  - 2 pies (tipos de compra, estados) + tabla últimos 10 pedidos.
  - Selector de periodo (Hoy / 7d / 30d / Mes) · `error.tsx`.
- **Pestaña `/hwtool`**: 5 KPI cards + 2 pies (problemas, equipamiento) + bloque CRM test (cuando count > 0) · selector de periodo · `error.tsx`.
- **Pestaña `/hsm`**: dashboard completo (espera endpoint para datos reales). Secciones:
  - **Salud del SLA**: Cumplimiento %, Mejora MoM en pp (con semáforo `≥0 ok / -3 a 0 warn / ≤-3 danger`), Críticas en plazo (subset estricto), Vencidas ahora.
  - **Volumen**: Incidencias abiertas, RMAs activas, Throughput ratio (cerradas/creadas), Reapertura.
  - **Tiempos**: Resolución media (con comparativa al periodo anterior), Turnaround RMA.
  - **Distribuciones**: Pie chart incidencias por prioridad + Bar chart aging distribution.
  - **Top proveedores**: tabla con rma_count, % éxito, turnaround.
  - Selector periodo (Hoy / 7d / 30d / Mes) · `error.tsx`.
  - Si la API no está disponible: card amistosa "Conectando con HSM…" con instrucciones de configuración.
- **Pestaña `/admin`**: 4 cards "próximamente" para Sprint 5 (umbrales, notas, metas, manual entries).
- **`/lab/shields`**: comparador interno de las 7 variantes del componente Shield × 4 estados de semáforo.
- **`/lab/logos`** (nuevo v0.3): 8 propuestas de logo SVG inline para el portal (triple-shield, shield-hexes, shield-portal, q-shield, shield-pillars, convergence, hub-shield, monolith).
- **`/lab/logos/hub-shield`** (nuevo v0.3): 7 sub-variantes del hub-shield con señales de "bajo asedio" (dent, cracks, pulse, impacts, shaded, battle). Elegida `hub-shield-pulse` (anillos concéntricos saliendo del hub central — absorción activa).

**Tests**: 30/30 verdes (13 hwtool + 17 mainops, +4 nuevos del bloque `ops`). **Build**: 11 rutas, /hwtool 3.46kB, /mainops 1.14kB (Recharts pie + bar en chunks dinámicos cliente).

**Repo**: [`github.com/85Dominic85/hw-main-portal`](https://github.com/85Dominic85/hw-main-portal). Último commit en `main`: ver `git log --oneline -1`.

---

## Quickstart

### Para iterar local

```bash
cd "C:/Users/Qamarero/Desktop/PROYECTOS/Hw Main Portal"
npm install                # ya hecho, 426 paquetes
npm run dev                # http://localhost:3001
```

`.env.local` ya tiene los valores reales (no se commitea, está en `.gitignore`).

### Para deployar

Push a `main` → Vercel auto-deploya. Si cambias env vars en Vercel, hacer **Redeploy** explícito (Deployments → ⋯ → Redeploy) — Vercel solo aplica env vars en build time.

### Para verificar producción

```bash
# El endpoint MainOps (debe responder con kpis.total_orders, etc.)
curl -H "X-API-Key: <ver .env.local>" \
  "https://hw-sell-gear-platform-tsm1.vercel.app/api/external/metrics?from=2026-04-01&to=2026-04-30" | head -c 500

# El endpoint HW Tool (debe responder con principal.total_sessions)
curl -H "x-api-key: qamarer0" \
  "https://olcxbtvjkjmofrbvzpat.supabase.co/functions/v1/analytics-api?from=2026-04-01&to=2026-04-30" | head -c 500

# Health del HW Tool
curl -H "x-api-key: qamarer0" \
  "https://olcxbtvjkjmofrbvzpat.supabase.co/functions/v1/analytics-api?endpoint=health"
```

---

## Stack técnico

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **Next.js 15.5.15** (App Router) | React 19, Turbopack |
| Lenguaje | **TypeScript strict** | `noUncheckedIndexedAccess` activado |
| ORM | **Drizzle 0.36+** | Schema `portal` |
| BD propia | **Supabase PostgreSQL** | Proyecto `thkrkubkiasfqmiiwfbj`, region `eu-west-3` |
| UI base | **shadcn/ui + Tailwind v4** (CSS-based config) | sin tailwind.config.ts |
| Charts | **Recharts** (lazy-loaded con `dynamic({ ssr: false })`) | NO Tremor (incompatible con React 19) |
| Server state | **TanStack Query v5** | `staleTime: Infinity`, refresco solo manual |
| URL state | **nuqs** | preparado, aún no usado |
| Forms | **React Hook Form + Zod** | preparado, aún no usado en CRUD |
| Auth | **Supabase Auth con magic link** | desactivado por defecto (`PORTAL_AUTH_REQUIRED=false`) |
| Notificaciones | **sonner** | toasts |
| Tests | **Vitest + Testing Library** | 43 tests verdes (17 mainops + 13 hwtool + 13 hsm) |
| Deploy | **Vercel (Pro)** | auto-deploy desde `main` |

---

## Arquitectura — patrón de connectors

El portal **NO tiene una BD agregada** de las herramientas. Cada herramienta se enchufa con un connector independiente en `src/lib/connectors/<name>/` que sigue una estructura común:

```
src/lib/connectors/<name>/
├── types.ts          # Shape interno camelCase (HwToolMetrics, MainOpsMetrics)
├── schema.ts         # Zod del response API + types inferidos
├── mapper.ts         # snake_case → camelCase + ISO strings → Date
├── client.ts         # fetch HTTP con timeout + auth + Result<T>
├── labels.ts         # i18n + colores semánticos
├── index.ts          # barrel exports públicos
└── mapper.test.ts    # tests con payload real
```

Cada connector expone:
- **`fetch<Name>RawMetrics(filter)`** → `Result<ApiResponse>` (raw, JSON-serializable, **safe para `unstable_cache`**).
- **`fetch<Name>Metrics(filter)`** → `Result<Metrics>` (con Date reales, **NO usar dentro de `unstable_cache`**).

El **server query** (`src/server/queries/<name>.ts`) cachea el RAW por 60s y aplica el mapper post-cache. Patrón **throw-no-cache**: si la API falla, lanza `<Name>ApiError` dentro de `unstable_cache` → Next no cachea throws → próxima request reintenta fresh. Sin esto, un timeout transitorio quedaba cached 60s.

Los **banners de la home** (`src/components/connectors/<name>-banner.tsx`) son Server Components que llaman al server query, derivan los 3 updates y renderizan `<ToolSummary>` con el escudo. Cada uno aislado en su propio `<Suspense>` para que la caída de una API no rompa la página.

### Patrón de cada herramienta

| Herramienta | Patrón | Endpoint / acceso | Auth |
|---|---|---|---|
| **HW Tool** | HTTP a edge function Supabase | `https://olcxbtvjkjmofrbvzpat.supabase.co/functions/v1/analytics-api` | header `x-api-key` |
| **MainOps** | HTTP a Next.js route handler | `https://hw-sell-gear-platform-tsm1.vercel.app/api/external/metrics` | header `X-API-Key` (capitalización distinta) |
| **HSM** | (v2) Envolver queries existentes en `/api/portal/metrics` | repo `Hardware-Support-Manager-main` | TBD |

---

## Auth — modo abierto

El portal **arranca sin auth** por decisión del 2026-04-29 (entorno cerrado, no se podía configurar el Site URL del proyecto Supabase del portal porque pertenece a otra organización).

- Default: portal accesible directamente con un usuario admin sintético (primer email de `PORTAL_ADMIN_EMAILS` = `jj.gallego@qamarero.com`).
- El topbar muestra avatar `JJ` con badge `demo` discreto en el menú.
- Botón "Cerrar sesión" deshabilitado: "Portal abierto".

**Para reactivar auth real cuando se pueda configurar Supabase**:
1. En Supabase del portal (`thkrkubkiasfqmiiwfbj`) → Auth → URL Configuration:
   - Site URL: `https://hw-main-portal.vercel.app`
   - Redirect URLs: `https://hw-main-portal.vercel.app/**` y `https://*-85dominic85.vercel.app/**` (previews).
2. En Vercel del portal: añadir env var `PORTAL_AUTH_REQUIRED=true`.
3. Redeploy.

El código del flujo magic link sigue presente y funcional — solo está bypasseado por la lógica en [`src/lib/auth/bypass.ts`](src/lib/auth/bypass.ts).

---

## Schema `portal` en Supabase del portal (ya aplicado)

Proyecto: `thkrkubkiasfqmiiwfbj`. Schema: `portal`. Aplicado vía `scripts/apply-migration.mjs`.

| Tabla | Propósito | RLS |
|---|---|---|
| `portal_users` | Espejo de `auth.users` con rol del portal (`admin` / `viewer`) | ✅ |
| `kpi_thresholds` | Umbrales semáforo configurables por KPI | ✅ |
| `kpi_notes` | Notas/comentarios sobre métricas (thread por KPI) | ✅ |
| `kpi_goals` | Metas mensuales por KPI | ✅ |
| `manual_entries` | Métricas manuales que no viven en las herramientas | ✅ |
| `export_log` | Audit log de exports CSV | ✅ |
| `admin_emails` | Seed de emails admin (jj.gallego, guillermo.mateos, domingo.bueno) | n/a (interna) |

**Triggers**:
- `auth.users → on_auth_user_created` — allowlist `@qamarero.com` + auto-provisioning en `portal_users` con rol según email.
- `set_updated_at` en 5 tablas (todas menos `export_log`).

**Roles**:
- `portal_app` (runtime, password `qamarero2025`) — SELECT/INSERT/UPDATE/DELETE en `portal`. Sin DDL.
- `postgres` (DDL, password en `.env.local`) — solo migraciones.

**Conexión**:
- Runtime → transaction pooler `aws-0-eu-west-3.pooler.supabase.com:6543` con `portal_app`.
- DDL → session pooler `:5432` con `postgres`. La direct connection (`db.<ref>.supabase.co`) **no funciona desde redes IPv4 only** — es IPv6 only.

**Pendiente**: las CRUD UIs de admin que escriben en estas tablas (Sprint 5 del backlog).

---

## URLs y credenciales (referencias, sin valores)

### URLs canónicas

| Recurso | URL | Estado |
|---|---|---|
| **Portal en producción** | `https://hw-main-portal.vercel.app` | ✅ activo |
| Portal repo GitHub | `github.com/85Dominic85/hw-main-portal` | activo, default branch `main` |
| **MainOps en producción** | `https://hw-sell-gear-platform-tsm1.vercel.app` | ✅ activo (alias canónico `hw-sell-gear-platform.vercel.app` está roto, ver Bugs conocidos) |
| MainOps repo GitHub | `github.com/qamarero/hw-SellGear-platform` | activo, default branch `feature/mvp-foundation` |
| **HW Tool app** | `https://hwtoolbox.lovable.app/` | externa (Lovable) |
| **HW Tool API** | `https://olcxbtvjkjmofrbvzpat.supabase.co/functions/v1/analytics-api` | ✅ activo, schema `1.1.0` |
| HW Tool repo GitHub | `github.com/WillyDrift/staging-schema-manager` | externa |
| **HSM app** | `https://hardware-support-manager.vercel.app/dashboard` | externa, integración pendiente para v2 |
| **Supabase del portal** | `thkrkubkiasfqmiiwfbj` (Paris, eu-west-3) | ✅ schema `portal` aplicado |
| **Supabase de MainOps** | `gbuifpsgcvxmuwzoyush` (project ref) | usado solo desde la app MainOps |
| **Supabase de HW Tool** | `olcxbtvjkjmofrbvzpat` (project ref) | edge function `analytics-api` consumida desde el portal |

### Env vars (todas en `.env.local` y `.env.vercel` locales, ambos en `.gitignore`)

| Var | Para qué |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL canónica del portal en cliente |
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto Supabase del portal |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_*` para el cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_*` server-only, bypassa RLS |
| `PORTAL_DATABASE_URL` | Transaction pooler con `portal_app` (runtime) |
| `PORTAL_DATABASE_DDL_URL` | Session pooler con `postgres` (solo migraciones, NO en Vercel) |
| `PORTAL_ADMIN_EMAILS` | jj.gallego, guillermo.mateos, domingo.bueno |
| `PORTAL_EMAIL_ALLOWLIST_DOMAIN` | `qamarero.com` |
| `HWTOOL_ANALYTICS_API_URL` | `https://olcxbtvjkjmofrbvzpat.supabase.co/functions/v1/analytics-api` |
| `HWTOOL_ANALYTICS_API_KEY` | `qamarer0` |
| `MAINOPS_BASE_URL` | `https://hw-sell-gear-platform-tsm1.vercel.app` (alias canónico roto, usar tsm1 hasta arreglar) |
| `MAINOPS_API_KEY` | secret hex 64 chars; en MainOps se llama `MAIN_PORTAL_API_KEY` |
| `PORTAL_AUTH_REQUIRED` | (no seteada → portal abierto). Setear `true` para reactivar magic link. |

### Credenciales rotables

- Password de `portal_app`: `qamarero2025` — predecible, **rotar antes de prod real** (`alter role portal_app with password '...'`).
- Password de `postgres` (Supabase del portal): rotar también (la inicial se mostró en chat).
- `MAINOPS_API_KEY` / `MAIN_PORTAL_API_KEY`: secret compartida portal ↔ MainOps. Generar nueva con `openssl rand -hex 32` y actualizar ambos lados.
- `HWTOOL_ANALYTICS_API_KEY` (`qamarer0`): pedirle a Guillermo que la rote a algo robusto antes de prod.

---

## Bugs conocidos y workarounds

### 1. Alias canónico de MainOps roto

`https://hw-sell-gear-platform.vercel.app/` devuelve `DEPLOYMENT_NOT_FOUND` aunque el proyecto tiene deployments activos. Por eso usamos `hw-sell-gear-platform-tsm1.vercel.app` (alias deployment-specific).

**Fix pendiente**: en Vercel del proyecto MainOps → Settings → Domains → reasignar `hw-sell-gear-platform.vercel.app` al deployment Production actual. Cuando esté arreglado, cambiar `MAINOPS_BASE_URL` del portal de vuelta a la canónica.

### 2. ~~`kpis.completed_rate: 0` aunque hay 55 pedidos completados~~ ✅ RESUELTO 2026-04-30

MainOps reescribió `get_dashboard_metrics` (commit `9561d68`). Ahora `completed_rate` filtra por `status='completado'` y excluye `'bloqueado'` del denominador. Hoy devuelve valores reales (84.8% en abril). El portal lo muestra correctamente — mi `normalizeRate` ya manejaba 0-100. Ver `docs/CHANGELOG_2026-04-30_HW_PORTAL.md` en el repo de MainOps.

### 3. API de MainOps devuelve 0-100 cuando el doc dice 0-1

`HW_MAIN_PORTAL_API.md` declara `kpis.completed_rate`, `sla.on_time_pct`, `sla_by_week[].on_time_pct` como ratio 0-1, pero la implementación los devuelve en escala 0-100 (`55.2`, `100`, `34.4`...).

**Workaround**: el mapper del portal tiene `normalizeRate(v) = v > 1 ? v/100 : v`. Funciona con ambos formatos. Si MainOps "arregla" su implementación al 0-1 del doc algún día, el portal sigue funcionando sin cambios.

### 4. SLA 11.3d promedio + 30 rotos en abril

Métrica preocupante en sí misma, pero conviene confirmar con el equipo:
- ¿Es realidad operativa actual?
- ¿Los días incluyen TIPSA en tránsito (ralentizando el cómputo)?
- Si el target sigue siendo `<7d` (como el resumen ejecutivo del primer día), hay un gap real que el portal está reflejando bien.

### 5. Umbrales semáforo del escudo MainOPS

`% SLA on-time = 55.2%` se pinta rojo con los defaults del portal: `≥95 ok / ≥85 warn / <85 danger`. Si la realidad del negocio es que ese SLA es la nueva normalidad, ajustar a algo como `≥85 / ≥70 / <70` para que el indicador sea útil. Cambio de 1 línea en [`src/components/connectors/mainops-banner.tsx`](src/components/connectors/mainops-banner.tsx).

### 6. Auth desactivada — portal accesible públicamente

Por decisión temporal hasta que se pueda configurar el Site URL del proyecto Supabase del portal (no es accesible al usuario actual). Cualquiera con la URL entra como admin. **Mitigación pendiente**: reactivar `PORTAL_AUTH_REQUIRED=true` cuando esté el dashboard configurable.

---

## Backlog priorizado

### Inmediato (mañana, según indicación del user)
1. **Cambios estéticos y de nomenclatura** — el user revisará UI antes de seguir con bug fixes / HSM.

### Corto plazo
2. **Cleanup operativo** (~30 min):
   - Reasignar alias canónico de MainOps en Vercel.
   - Configurar Site URL en Supabase del portal cuando se pueda.
   - Reactivar auth con `PORTAL_AUTH_REQUIRED=true`.
3. **Ajustar umbrales** del escudo MainOPS si SLA 55% es la normalidad.
4. **Bug `completed_rate=0`** en MainOps (ticket a Domingo / Guillermo).

### Medio plazo
5. **Datos propios — Sprint 5** (3-5 días):
   - CRUD `kpi_thresholds` (admin only) con UI en `/admin/thresholds`.
   - CRUD `kpi_notes` con thread por KPI.
   - CRUD `kpi_goals` con visualización real vs meta.
   - CRUD `manual_entries`.
   - Toast cuando KPI cruza umbral.
   - `export_log` automatizado en cada export CSV.
6. **Snapshots mensuales** (2-3 días):
   - Tabla `portal.kpi_snapshots` (revertir ADR-0003).
   - Vercel Cron Function último día del mes 23:55 UTC → graba snapshot.
   - Botón "Generar parcial mensual" en `/admin` para CEOs en cualquier momento → snapshot intermedio + vista print-friendly exportable.
   - Selector de mes en `/mainops` y `/hwtool` para histórico.
7. **HSM connector** (2-3 días):
   - Envolver `src/server/queries/{dashboard,analytics}.ts` de HSM en `/api/portal/metrics` (mismo patrón que MainOps).
   - Auth con shared secret + JWT del SSO.
   - Banner HSM con datos reales: candidatos a hero → `% SLA cumplido` o `incidencias abiertas / target`.

### Polish y v2
8. **UI polish** (1 día): microinteracciones, hover en escudos con timestamp generated_at, brand Qamarero más visible.
9. **Tests E2E** (1 día): Playwright básico de los 3 flujos críticos.
10. **CSV exports** centralizados con audit log.
11. **Notificaciones externas** (Slack/email cuando KPI cruza umbral).
12. **Wallboard** `/wallboard?token=...` para TV de oficina.

---

## Decisiones arquitectónicas registradas

ADRs en [`docs/adr/`](docs/adr/):

| ADR | Decisión | Estado |
|---|---|---|
| **0001** Arquitectura conectores | Patrón híbrido por herramienta (HTTP proxy / Supabase RO / server queries) | ✅ Aceptado |
| **0002** Auth magic link | Supabase Auth con magic link + allowlist domain (no Google Workspace) | ✅ Aceptado · 🟡 desactivado temporalmente |
| **0003** Sin snapshots históricos | Calcular tendencias al vuelo | 🟡 **A revertir** (Sprint 6 — el user pidió snapshots mensuales el 29-04-2026) |

Decisiones tomadas pero sin ADR formal todavía:
- **Modo abierto por defecto** (`PORTAL_AUTH_REQUIRED=false`) — entorno cerrado mientras no se pueda configurar Supabase Auth.
- **Tremor descartado** — incompatible con React 19. Recharts directo + chunks dinámicos cliente.
- **`unstable_cache` con throw-no-cache pattern** — para no cachear errores transitorios.
- **Cachear el RAW (snake_case) y mapear post-cache** — porque `unstable_cache` serializa los Date a string al deserializar.
- **Helpers de periodo en módulo neutro server/client** (`lib/<tool>/period.ts`) — porque exportar funciones desde Client Components rompe Server Components.
- **Variante `rivets-double` del Shield** — combinación de `rivets` + `double` elegida por el user el 28-04-2026 tras comparar las 7 variantes en `/lab/shields`.

---

## Histórico de iteraciones (resumen cronológico)

| Fase | Qué se hizo |
|---|---|
| **Sesión 1 (28 abril)** — Planificación | Exploración del ecosistema (HSM, MainOps, HW Tool, Finanzas inicialmente). Decisión: Finanzas fuera del scope. Selección de stack. Diseño del schema `portal`. |
| **Sprint 0** — Andamiaje del proyecto | Estructura `.claude/` (13 agents + 9 skills + 10 commands), `.mcp.json` (8 MCPs), `CLAUDE.md`, `AGENTS.md`, `README.md`, 3 ADRs, `sql/0001_init.sql` con RLS. Scaffold Next.js 15 + TS strict + Tailwind v4 + shadcn/ui (manual). Layout sidebar + topbar + theme provider. |
| **Iteración Shield** | 7 variantes del componente `<Shield>` (heater, rivets, kite, hex, double, modern, rivets-double). Comparador en `/lab/shields`. Selección final: `rivets-double`. Reposicionamiento de los atajos MOP/HWT/HSM del topbar a encima de cada escudo. Tamaño aumentado a 240px. |
| **Sprint 1** — Auth Supabase | Esquema `portal` aplicado a `thkrkubkiasfqmiiwfbj`. Magic link + allowlist `@qamarero.com`. Middleware de protección. UserMenu con logout. |
| **Auth bypass** | Decisión: portal abierto por defecto (`PORTAL_AUTH_REQUIRED` opcional). Banner de modo abierto descartado, sustituido por badge `demo` discreto en avatar. |
| **Connector HW Tool** | Tipos + Zod schema + mapper + client + tests + server query. Banner home con 3 líneas (sesiones, PnP entregados, origen equipamiento). Pestaña `/hwtool` con 5 KPI cards + 2 pies + bloque CRM test. Schema actualizado a `1.1.0` con `crm_test` ampliado. |
| **Bugs `/hwtool`** | Bug 1: `unstable_cache` deserializaba Date como string → SSR petaba. Fix: cachear raw, mapear post-cache. Bug 2: Recharts en SSR rompía la página. Fix: `dynamic({ ssr: false })`. Bug 3: helpers en Client Component importados desde Server Component → throw runtime. Fix: módulo neutro `lib/hwtool/period.ts`. Bug 4: `unstable_cache` cacheaba errores 60s → fallaba aunque la API se recuperase. Fix: throw-no-cache pattern. |
| **Connector MainOps** | Mismo patrón. Tests con payload sintético. Banner home con 3 líneas (volumen + revenue, SLA detalle, top compras). Pestaña `/mainops` MVP con 5 KPI cards + 2 pies + tabla recent_orders. |
| **Deploy MainOps endpoint** | Endpoint `/api/external/metrics` ya existía en `feature/mvp-foundation` (default branch). Bloqueo: alias canónico `hw-sell-gear-platform.vercel.app` roto. Workaround: usar `tsm1`. |
| **Bug shape MainOps** | API devuelve 0-100 a pesar de que doc dice 0-1. Fix: schema relajado a `.max(100)` + `normalizeRate` en mapper. |
| **v0.1 cerrada** (29-abr) | Home con 3 escudos + pestañas funcionando · 26/26 tests · build verde. |
| **MainOps CHANGELOG 2026-04-30 + bloque `ops`** | MainOps fixea `completed_rate` (era 0 siempre, ahora valor real) y añade bloque `ops` opcional (handling vs transit, on_time_shipping, throughput_by_week, blocked, excluded_admin). Portal: schema/mapper/tests +4 / banner usa `ops.on_time_shipping_pct` como hero (con fallback) / línea 2 separa Manipulación (depto) y Transporte (TIPSA) / pestaña `/mainops` con sección "Actividad operativa" arriba (6 KPI cards + bar chart throughput) + sección "Negocio" debajo. Componentes nuevos: `<BarChartCard>` + `<BarChartRecharts>` SSR-safe. |
| **v0.2 cerrada** (30-abr) | Bloque `ops` integrado · 30/30 tests · build verde. |
| **v0.3 polish UI** (30-abr) | Renames `MainOPS→Logística` / `HW Tool→Configuraciones`. Recalibrar umbrales semáforo MainOps (`≥85/≥70/<70` para handling depto). Diagnóstico modo claro vía agente UX → 5 cambios aplicados (background gris-azulado, border más oscuro, glow del Shield con CSS var adaptable, surface en updates-list, sombra neutra en tool-shortcut). 8 propuestas de logo en `/lab/logos` + 7 sub-variantes "bajo asedio" en `/lab/logos/hub-shield`. Elegida `hub-shield-pulse` con texto "Hardware Dashboard" en sidebar. |
| **v0.3 cerrada** (30-abr) | Polish UI · 30/30 tests · build verde · /lab/logos y /lab/logos/hub-shield disponibles. |
| **Selector global de periodo en home** (5-may) | Pills 5 presets + Custom… inline (estado en URL). Helper neutral `src/lib/home/period.ts`. Banners aceptan props `from/to` y refetchean por Suspense key. NO afecta a las pestañas detalle. |
| **Connector HSM** (5-may) | Spec del endpoint HSM en `docs/connectors/hsm-endpoint-spec.md`. Connector portal completo (types/schema/mapper/client/labels/index + 13 tests). Server query con cache 60s + throw-no-cache. Banner home con hero "delta MoM en pp" (mostrar tendencia, no absoluto, porque SLA HSM es bajo y la mejora es lo accionable). Pestaña `/hsm` completa: 12 KPI cards + 2 charts + tabla top proveedores + selector periodo + error.tsx. Activado en `tools.ts` + sidebar. Failsafe: sin env vars muestra "Conectando con HSM…" sin romper. |
| **v0.4 cerrada** (5-may) | Connector HSM listo (espera endpoint) + selector global de periodo en home · 43/43 tests · build verde. |

### Commits importantes (en `main` del repo del portal)

```
0796d2a feat(connectors/hsm): integrar HSM (banner home + pestaña /hsm + spec endpoint)  ← v0.4
d81f3f0 feat(home): selector de periodo global sobre los 3 escudos
9d8f417 feat(ui): integrar hub-shield-pulse + 'Hardware Dashboard' en sidebar
59f24ed feat(ui): modo claro pulido + 6 sub-variantes hub-shield     ← v0.3
fe7a6db feat(ui): renombrar MainOPS→Logística + HW Tool→Configuraciones + lab/logos
3a34f8c fix(mainops): recalibrar umbrales semáforo on_time_shipping (≥85/≥70/<70)
6d47c96 feat(connectors/mainops): integrar bloque ops del CHANGELOG 2026-04-30
fc2db34 docs: añadir proyecto_log.md como source of truth para handoffs   ← v0.2
46a6186 fix(connectors/mainops): normalizar rate/pct cuando vienen en 0-100
1dde6c1 feat(connectors/mainops): integrar API analytics-api con banner + pestaña
0e616c3 fix(hwtool): no cachear errores + timeout 15s
9b875e9 fix(hwtool): mover periodToFilter() a módulo neutro server/client
c57175e feat(hwtool): API v1.1.0 (crm_test ampliado) + fix SSR /hwtool + banner PnP
934a5f7 fix(connectors/hwtool): cache raw payload + map post-cache
7bcc6ea feat(auth): portal abierto por defecto, auth opt-in con PORTAL_AUTH_REQUIRED
5e3daed feat(auth): PORTAL_AUTH_BYPASS env var (deprecated por 7bcc6ea)
922aa0b chore(tooling): gitignore .env.vercel y .env.production
e2be4fe feat: Sprint 1 (Supabase Auth) + connector HW Tool con datos reales
5c75f92 feat: bootstrap HW Main Portal scaffold with shield-based home
```

---

## Tooling Claude Code disponible en el repo

### Subagentes (`.claude/agents/`) — 13

`database-architect`, `frontend-developer`, `ui-ux-designer`, `backend-architect`, `fullstack-developer`, `code-reviewer`, `typescript-pro`, `test-engineer`, `debugger`, `deployment-engineer`, `mcp-expert`, `documentation-expert`, `error-detective`.

Ver [`AGENTS.md`](AGENTS.md) para tabla completa de cuándo invocar cada uno.

### Skills (`.claude/skills/`) — 9

`senior-frontend`, `senior-fullstack`, `react-best-practices`, `supabase-postgres-best-practices`, `frontend-design`, `emil-design-eng`, `ui-ux-pro-max` (oficial uipro-cli con scripts Python), `code-reviewer`, `git-commit-helper`.

### Commands slash (`.claude/commands/`) — 10

`/commit`, `/code-review`, `/refactor-code`, `/ultra-think`, `/architecture-review`, `/update-docs`, `/explain-code`, `/add-kpi`, `/add-connector`, `/todo`.

### MCP servers (`.mcp.json`) — 8

`supabase-portal`, `supabase-mainops`, `supabase-hwtool`, `postgresql`, `github`, `web-fetch`, `markitdown`, `figma`. Requiere autenticación OAuth en cada Supabase MCP.

---

## Comandos útiles

```bash
# Desarrollo
npm run dev                      # localhost:3001
npm run typecheck                # tsc --noEmit
npm run lint                     # next lint
npm run lint:fix                 # next lint --fix
npm test                         # vitest run
npm run test:watch               # vitest watch
npm run build                    # production build (valida tipos)
npm run start                    # next start (tras build)

# Drizzle / DB
npm run db:generate              # genera SQL desde schema
npm run db:push                  # aplica al DDL_URL (DEV)
npm run db:migrate               # aplica migraciones (PROD)
npm run db:studio                # GUI

# Migraciones manuales (recomendado para prod)
node --env-file=.env.local scripts/apply-migration.mjs sql/0001_init.sql --verify

# Verificar APIs externas
curl -H "x-api-key: qamarer0" "https://olcxbtvjkjmofrbvzpat.supabase.co/functions/v1/analytics-api?endpoint=health"
curl -H "x-api-key: qamarer0" "https://olcxbtvjkjmofrbvzpat.supabase.co/functions/v1/analytics-api?endpoint=schema" | head -c 600
curl -H "X-API-Key: <MAINOPS_API_KEY>" "https://hw-sell-gear-platform-tsm1.vercel.app/api/external/metrics?from=2026-04-01&to=2026-04-30" | head -c 800
```

---

## Cómo retomar desde cero (handoff guide)

1. **Leer este archivo entero** — son ~10 min y cubre el 80% del contexto.
2. **Para detalle adicional**: leer `~/.claude/plans/vamos-a-planificar-bien-expressive-iverson.md` (plan acumulado de la sesión inicial, con todas las decisiones razonadas).
3. **Verificar que el portal sigue rulando**:
   - Abrir `https://hw-main-portal.vercel.app/` — deben aparecer los 3 escudos con datos reales (MOP rojo, HWT verde, HSM neutral).
   - Si MOP está neutral con error: probablemente el alias canónico de MainOps cambió otra vez. Curlar `tsm1` directamente y comparar con la URL de `MAINOPS_BASE_URL` en Vercel.
4. **Clonar local si hace falta**:
   ```bash
   git clone https://github.com/85Dominic85/hw-main-portal.git
   cd hw-main-portal
   npm install
   ```
5. **Pedir al user las env vars** o copiar de Vercel del proyecto. `.env.local` no se commitea.
6. **Antes de tocar nada**: verificar `npm run typecheck && npm run test && npm run build`. Si todo verde, base limpia.
7. **Para añadir un KPI nuevo**: usar el slash command `/add-kpi`. Para una herramienta nueva: `/add-connector`.
8. **Para refactor o decisión grande**: usar el slash command `/ultra-think` o `/architecture-review`.

---

## Convenciones que conviene mantener

| Elemento | Convención |
|---|---|
| Archivos & carpetas | `kebab-case` (`hwtool-banner.tsx`) |
| Funciones & variables | `camelCase` (`getHwToolSummary`) |
| React components | `PascalCase` (`HwToolBanner`) |
| Constantes | `UPPER_SNAKE_CASE` (`HWTOOL_DEFAULT_PERIOD`) |
| Tablas DB | `snake_case` (`kpi_thresholds`) |
| Columnas DB | `snake_case` (`created_at`) |
| Tipos TS | `PascalCase` (`HwToolMetrics`) |
| Zod schemas | `camelCase` + `Schema` (`hwToolApiResponseSchema`) |
| Branches git | `feat/<scope>-<descripcion>`, `fix/<descripcion>` |
| Commits | Conventional commits con scope (`feat(connectors/mainops): ...`) |
| Tests | Junto al archivo (`mapper.test.ts` al lado de `mapper.ts`) |

---

## Próxima sesión — agenda según indicación del user (29-04-2026 19:20)

> "Mañana realizaremos algunos cambios estéticos y de nomenclatura, antes de proceder con otro tipo de fallos y de integrar HSM."

Por tanto, prioridad mañana:
1. **Cambios estéticos** — esperar input del user sobre qué pulir.
2. **Nomenclatura** — revisar nombres de KPIs, etiquetas, copy.
3. **Bug fixes pendientes** (lista de "Bugs conocidos" arriba).
4. **Integración HSM** (después de los puntos anteriores).

---

_Fin del log. Para detalle de razonamientos, decisiones descartadas y conversación completa, ver el archivo de plan en `~/.claude/plans/`._
