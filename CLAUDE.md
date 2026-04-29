# CLAUDE.md

Guía de referencia para Claude Code cuando trabaje en este repositorio.

## Project Overview

**HW Main Portal** es la capa de visualización unificada del departamento de Hardware de Qamarero. Agrega métricas en tiempo real (a demanda) de las 4 herramientas internas del departamento, ofrece atajos a cada una, gestión de datos propios (umbrales, notas, metas, manual entries) y exports CSV.

**Audiencia**: 3 admins (jj.gallego, guillermo.mateos, domingo.bueno) + viewers `@qamarero.com`.
**Idioma UI**: español. Nombres de columnas y código en inglés.
**MVP v1**: integra MainOPS y HW Tool. HSM en v2. (Finanzas queda fuera del proyecto.)

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript strict |
| ORM | Drizzle |
| BD propia | Supabase PostgreSQL (proyecto `hw-portal`, schema `portal`) |
| UI | shadcn/ui + Tailwind v4 + Tremor |
| Server state | TanStack Query v5 (`staleTime: Infinity`) |
| URL state | nuqs |
| Forms | React Hook Form + Zod |
| Auth | Supabase Auth (magic link, allowlist `@qamarero.com`) |
| Charts | Tremor + Recharts |
| Notificaciones | sonner (in-app, sin Slack/email en v1) |
| Tests | Vitest + Testing Library |
| Deploy | Vercel (Pro) |

## Arquitectura — patrón de conectores

El portal NO tiene una BD agregada de las herramientas. Cada herramienta se enchufa con un **conector** independiente en `src/lib/connectors/<name>/` que implementa una interfaz común `Connector<T>`.

| Herramienta | Patrón | Detalle |
|---|---|---|
| MainOPS | HTTP proxy | Reusa `GET /api/metrics` de MainOPS |
| HW Tool | Supabase RO directo | Cliente Supabase apuntando a `olcxbtvjkjmofrbvzpat`, schema `hw_staging` |
| HSM (v2) | Server queries | Envuelve queries existentes en `/api/portal/metrics` |

**Refresco**: solo al cargar página o pulsar "Actualizar". `unstable_cache(60s)` evita martillear las DBs si el usuario refresca en bucle. Sin polling ni Realtime.

**Filtros temporales**: diario / semanal / quincenal / mensual / personalizado. Se calculan al vuelo desde los timestamps de origen. **No hay tabla de snapshots históricos.**

## Project Structure

```
src/
  app/
    (auth)/                 # Login, magic link callback
    (portal)/               # Layout autenticado: home, pestañas, admin
    api/
      portal/               # Endpoints internos del portal
      connectors/           # Proxies a las APIs de las herramientas
      exports/              # Generación CSV
    layout.tsx
  components/
    ui/                     # shadcn/ui base
    layout/                 # Sidebar, header, breadcrumbs
    kpi/                    # KPI cards, banners
    charts/                 # Wrappers Tremor/Recharts
    connectors/             # Componentes específicos de cada herramienta
    shared/                 # DataTable, DateRangePicker, ExportButton
  lib/
    auth/                   # Supabase Auth + magic link + roles
    connectors/             # Clientes para cada herramienta
      mainops/
      hwtool/
      hsm/                  # v2
    db/                     # Cliente Supabase del propio portal
      schema/               # Drizzle schema de `portal`
    kpi/                    # Definiciones de KPIs (id, fórmula, conector)
    validators/             # Zod schemas
    utils/
  server/
    actions/                # Server Actions (CRUD datos propios)
    queries/                # Funciones de fetch agregado
  hooks/
  types/

sql/                        # Migraciones SQL revisadas a mano
docs/
  adr/                      # Architecture Decision Records
  connectors/               # Contrato y secrets por conector
.claude/
  agents/                   # 13 subagentes
  skills/                   # 9 skills
  commands/                 # 10 comandos slash
  settings.json
.mcp.json                   # 8 MCP servers
```

## Code Conventions

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos & carpetas | kebab-case | `kpi-card.tsx`, `connectors/mainops/` |
| Funciones & variables | camelCase | `getKpiValue`, `isLoading` |
| Componentes React | PascalCase | `KpiCard`, `MainOpsBanner` |
| Constantes | UPPER_SNAKE_CASE | `KPI_THRESHOLDS`, `MAX_EXPORT_ROWS` |
| Tablas DB | snake_case | `kpi_thresholds`, `manual_entries` |
| Columnas DB | snake_case | `created_at`, `kpi_id` |
| Tipos TS | PascalCase | `KpiDefinition`, `ConnectorResult` |
| Zod schemas | camelCase + Schema | `createNoteSchema`, `kpiThresholdSchema` |

- Un componente por archivo. Imports relativos con alias `@/` → `src/`.
- Co-locar tipos y subcomponentes con su componente principal.
- Tests al lado del archivo (`foo.test.ts` junto a `foo.ts`).
- Server actions con `"use server"` y `Result = { ok: true, data } | { ok: false, error }`.
- Auth + role check **antes** del input parse en server actions.
- TS strict, sin `any`. `unknown` + Zod parse en bordes externos.

## Database

### Schema `portal`

| Tabla | Propósito |
|---|---|
| `portal_users` | Usuarios del portal con su rol (`admin`/`viewer`) |
| `kpi_thresholds` | Umbrales de semáforo configurables por KPI |
| `kpi_notes` | Notas/comentarios sobre métricas |
| `kpi_goals` | Metas mensuales por KPI |
| `manual_entries` | Métricas manuales que no viven en las herramientas |
| `export_log` | Audit log de quién exportó qué y cuándo |

**Sin `kpi_snapshots`**: las tendencias se calculan al vuelo.

### RLS

- `enable row level security` en TODAS las tablas.
- Default deny. Policies explícitas por rol.
- `admin` (los 3 emails) tiene full access.
- `viewer` (resto `@qamarero.com`) solo SELECT en tablas de lectura.

### Conexión

- Pooler Supavisor en transaction mode.
- Role runtime: `portal_app` (sin DDL).
- DDL desde `postgres` en SQL Editor.
- `prepare: false` en postgres-js.

### Workflow de migraciones

1. Editar schema en `src/lib/db/schema/`.
2. `npm run db:generate` → SQL en `drizzle/`.
3. **Revisar SQL a mano**.
4. Dev: `npm run db:push`. Prod: aplicar como `postgres` en SQL Editor.

## Authentication

Supabase Auth con magic link.

- `PORTAL_EMAIL_ALLOWLIST_DOMAIN` (default `qamarero.com`) — solo este dominio puede registrarse.
- `PORTAL_ADMIN_EMAILS` — lista comma-separated de admins.
- Roles definidos en `portal_users.role` y reflejados en JWT custom claim para RLS.

## Tooling Claude Code

### Subagentes (`.claude/agents/`)

| Agente | Para qué |
|---|---|
| `database-architect` | Schema, migraciones, RLS, índices |
| `frontend-developer` | Componentes UI, KPI cards, gráficas |
| `ui-ux-designer` | Crítica UI/UX de dashboards |
| `backend-architect` | Conectores, server actions, integraciones |
| `fullstack-developer` | Features end-to-end |
| `code-reviewer` | Pre-merge, auditoría |
| `typescript-pro` | Tipado avanzado |
| `test-engineer` | Estrategia y ejecución de tests |
| `debugger` | Bugs y causa raíz |
| `deployment-engineer` | Vercel + Supabase + dominios |
| `mcp-expert` | Configuración MCPs |
| `documentation-expert` | CLAUDE.md, ADRs, README |
| `error-detective` | Patrones de errores recurrentes |

### Skills (`.claude/skills/`)

| Skill | Para qué |
|---|---|
| `senior-frontend` | Patrones React/Next moderno |
| `senior-fullstack` | Features cross-stack |
| `react-best-practices` | Performance React |
| `supabase-postgres-best-practices` | Optimización Postgres |
| `frontend-design` | Dashboards production-grade |
| `emil-design-eng` | Microinteracciones y polish |
| `ui-ux-pro-max` | Motor de diseño con scripts Python: 67 estilos, 96 paletas, 57 pares tipográficos, 99 UX guidelines, 25 charts, 13 stacks. Genera design system completo (`python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "<proyecto>"`) |
| `code-reviewer` | Checklist sistemático |
| `git-commit-helper` | Mensajes de commit |

### Comandos slash (`.claude/commands/`)

| Comando | Para qué |
|---|---|
| `/commit` | Git commit con linting previo |
| `/code-review` | Revisión sistemática |
| `/refactor-code` | Refactor sin cambiar comportamiento |
| `/ultra-think` | Análisis multi-dimensional |
| `/architecture-review` | Evaluación arquitectónica |
| `/update-docs` | Sincronizar documentación |
| `/explain-code` | Explicar archivo/función |
| `/add-kpi` | Scaffolding KPI nuevo |
| `/add-connector` | Scaffolding conector nuevo |
| `/todo` | Inventario de TODOs/FIXMEs |

### MCP Servers (`.mcp.json`)

| Server | Para qué |
|---|---|
| `supabase-portal` | Schema `portal` (BD propia) |
| `supabase-mainops` | Lectura Supabase de MainOPS |
| `supabase-hwtool` | Lectura Supabase de HW Tool |
| `postgresql` | Conexión directa al portal |
| `github` | Issues, PRs, releases |
| `web-fetch` | Documentación externa |
| `markitdown` | Convertir documentos a markdown |
| `figma` | Modo desarrollo Figma |

### Selección de herramientas

| Tipo de tarea | Herramienta principal |
|---|---|
| Componente UI nuevo | `frontend-developer` + skill `senior-frontend` |
| Feature fullstack | `fullstack-developer` + skill `senior-fullstack` |
| Schema / migración | `database-architect` + skill `supabase-postgres-best-practices` |
| Conector nuevo | `/add-connector` + agente `backend-architect` |
| KPI nuevo | `/add-kpi` |
| Code review | `/code-review` + skill `code-reviewer` |
| Bug | `debugger` + (`error-detective` si es recurrente) |
| Commit | `/commit` |
| Decisión grande | `/ultra-think` + `/architecture-review` |
| Diseño UI/UX | skill `ui-ux-pro-max` + `frontend-design` + agente `ui-ux-designer` |
| Polish / micro | skill `emil-design-eng` |
| Documentación | `/update-docs` + agente `documentation-expert` |
| Deploy | `deployment-engineer` |
| MCP | `mcp-expert` + skill `mcp-builder` (cuando se cree custom) |

## Deployment

- **Plataforma**: Vercel (Pro).
- **Repo v1**: `github.com/85Dominic85/hw-main-portal` → traslado a Qamarero en Fase 4.
- **Dominio v1**: `hw-portal.qamarero.com`.
- **Branch strategy**: feature → PR → preview → squash merge a `main` → producción.

### Pre-deploy checklist

- [ ] `npm run lint` ✓
- [ ] `npm run build` ✓
- [ ] `npm test` ✓
- [ ] Migraciones revisadas
- [ ] Env vars Vercel actualizadas

## Security

- **Sin secrets en código**: todo via `process.env`.
- **`.env.local` en `.gitignore`**.
- **Allowlist de dominio** en signup.
- **RLS** en todas las tablas del portal.
- **Server actions con auth + role check** antes de input parse.
- **Connectors externos** con tokens de menor privilegio (read-only en MainOPS / HW Tool).

## Common Issues

**Build pasa local pero falla en Vercel**
- Env vars de prod distintas. Revisar dashboard Vercel.

**Auth devuelve null tras login**
- Cookies de Supabase no se setean → revisar dominio de cookie.

**Drizzle devuelve filas vacías inesperadamente**
- RLS filtrando. Verifica que el JWT contiene `role` correcto.

**`unstable_cache` no se invalida**
- Falta `revalidateTag('<tag>')` en la mutación. Verifica que el tag matchea.

**`unaccent()` falla en queries**
- El pooler no lo soporta. Usar `ILIKE` con `pg_trgm`.

**DDL falla con `portal_app`**
- El role runtime no tiene DDL. Aplica migraciones como `postgres` en SQL Editor.
