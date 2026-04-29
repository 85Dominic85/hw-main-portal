# HW Main Portal

Capa de visualización unificada del departamento de Hardware de Qamarero. Agrega métricas en tiempo real de las 3 herramientas internas (HSM, MainOPS, HW Tool), expone exports CSV y permite gestionar datos propios (umbrales, notas, metas, manual entries).

> **Estado actual**: Fase 0 — preparación del proyecto. Sin scaffold Next.js todavía.

## Stack

- Next.js 15 (App Router) + TypeScript strict
- Supabase PostgreSQL (schema `portal`) + Drizzle ORM
- shadcn/ui + Tailwind v4 + Tremor
- TanStack Query v5 + nuqs + React Hook Form + Zod
- Supabase Auth con magic link
- Vitest + Testing Library
- Vercel (Pro) para deploy

## Setup local (cuando exista el scaffold)

### Requisitos previos

- Node.js 20+ (recomendado 22)
- npm 10+
- Acceso a:
  - Proyecto Supabase del portal (`hw-portal`)
  - Tokens read-only de los Supabase de MainOPS y HW Tool
  - Cuenta GitHub `85Dominic85` (o equivalente con permisos del repo)

### Instalación

```bash
git clone https://github.com/85Dominic85/hw-main-portal.git
cd hw-main-portal
npm install
cp .env.example .env.local
# rellena .env.local con valores reales — ver sección "Variables de entorno"
npm run db:push       # aplica schema portal en dev (no en prod)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Todas en `.env.local` (no commitear). Ver `.env.example` con plantilla completa.

### Imprescindibles (Fase 0)

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL pública del portal (en dev: `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase del portal |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key del portal |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
| `PORTAL_DATABASE_URL` | Connection string Drizzle al portal |
| `PORTAL_ADMIN_EMAILS` | Comma-separated emails de admins |
| `PORTAL_EMAIL_ALLOWLIST_DOMAIN` | Dominio permitido (default `qamarero.com`) |

### Conectores (Fase 1+)

| Variable | Descripción |
|---|---|
| `MAINOPS_API_BASE_URL` | URL base de MainOPS |
| `MAINOPS_API_TOKEN` | Bearer token para `/api/metrics` |
| `HWTOOL_SUPABASE_URL` | URL del Supabase de HW Tool |
| `HWTOOL_SUPABASE_ANON_KEY` | Anon key del Supabase de HW Tool |

### Tooling Claude (opcional)

| Variable | Descripción |
|---|---|
| `SUPABASE_PORTAL_ACCESS_TOKEN` | Token MCP Supabase del portal |
| `SUPABASE_MAINOPS_ACCESS_TOKEN` | Token MCP Supabase de MainOPS |
| `SUPABASE_HWTOOL_ACCESS_TOKEN` | Token MCP Supabase de HW Tool |
| `GITHUB_TOKEN` | Token MCP GitHub |
| `FIGMA_API_KEY` | Token MCP Figma |

## Scripts

```bash
npm run dev          # localhost:3000
npm run build        # build prod (también valida tipos)
npm run lint         # ESLint
npm run lint:fix     # ESLint --fix
npm test             # Vitest
npm run test:watch   # Vitest watch
npm run test:coverage
npm run db:push      # Drizzle: empuja schema (DEV ONLY)
npm run db:generate  # Drizzle: genera migración SQL
npm run db:migrate   # Drizzle: aplica migraciones (PROD)
npm run db:studio    # Drizzle Studio
```

## Estructura del repo

Ver [CLAUDE.md](CLAUDE.md) para la estructura completa.

## Deploy

Producción: Vercel.

- Branch `main` → producción (`hw-portal.qamarero.com`).
- PRs → preview deployments automáticos.

### Antes de cada deploy a producción

1. `npm run lint` ✓
2. `npm run build` ✓
3. `npm test` ✓
4. Migraciones DB revisadas y aplicadas como `postgres` en SQL Editor.
5. Env vars Vercel actualizadas si hay cambios.

## Tooling Claude Code

Este repo está configurado con:
- 13 subagentes — ver [AGENTS.md](AGENTS.md).
- 9 skills — ver `.claude/skills/`.
- 10 comandos slash — ver `.claude/commands/`.
- 8 MCP servers — ver `.mcp.json`.

Si usas Claude Code, los subagentes y comandos están disponibles automáticamente. Para los MCPs hace falta rellenar los tokens en `.env.local`.

## Documentación

- [CLAUDE.md](CLAUDE.md) — guía técnica completa.
- [AGENTS.md](AGENTS.md) — catálogo de subagentes.
- [docs/adr/](docs/adr/) — Architecture Decision Records.
- [docs/connectors/](docs/connectors/) — contrato y secrets por conector.

## Roadmap

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Preparación: tooling, scaffold, auth | 🟡 En curso |
| 1 | MVP MainOPS | ⏳ Pendiente |
| 2 | Añadir HW Tool | ⏳ Pendiente |
| 3 | Datos propios (umbrales, notas, metas) | ⏳ Pendiente |
| 4 | Polish + traslado a Qamarero | ⏳ Pendiente |
| v2 | HSM, wallboard, alertas externas | 📦 Backlog |

## Contribución

1. Branch desde `main`: `feat/<scope>-<descripción>`.
2. Commits con conventional commits (ver `.claude/skills/git-commit-helper`).
3. PR con descripción clara y test plan.
4. Pasar `lint` + `test` + `build` localmente antes de pushear.
5. Squash merge a `main` tras review.

## Licencia

Privado — uso interno Qamarero.
