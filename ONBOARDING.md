# HW Main Portal — Punto de entrada para retomar

> Lee esto primero si vuelves desde **otro terminal** o tras un parón. Es el "empieza aquí".
> Para el detalle completo (decisiones, bugs, histórico, credenciales): [`proyecto_log.md`](proyecto_log.md). Para la arquitectura: [`CLAUDE.md`](CLAUDE.md).
>
> Última actualización: **2026-06-26** (viernes). Próxima sesión: **lunes 2026-06-29**.

---

## Qué es

Capa de visualización del dpto Hardware de Qamarero: agrega métricas de 3 herramientas internas (MainOps/Logística, HW Tool/Configuraciones, HSM) vía **conectores** + feature de **Informes semanales/mensuales** (editor estilo Notion, publish, export PDF/MD/Notion).

- **Producción**: https://hw-main-portal.vercel.app (auto-deploy desde `main` en Vercel).
- **Repo**: https://github.com/85Dominic85/hw-main-portal (branch por defecto `main`).
- Stack: Next.js 15 (App Router) · TS strict · Drizzle · Supabase Postgres (schema `portal`) · shadcn/ui + Tailwind v4 · Recharts · Vitest.

## Arrancar en un terminal que no está al día

```bash
git pull            # o git clone https://github.com/85Dominic85/hw-main-portal.git
npm install
# Pedir al user el .env.local (NO se commitea — está en .gitignore).
# Incluye PORTAL_DATABASE_URL, HWTOOL_ANALYTICS_API_URL/KEY, MAINOPS_BASE_URL/API_KEY, etc.
npm run typecheck && npm test && npm run build   # base limpia si todo verde (51 tests)
npm run dev         # http://localhost:3001
```

> ⚠️ **No se prueba en local, se valida en producción.** El portal exige login real (cuentas en `portal_accounts`) y los datos viven en una única BD de Supabase. **Norma de trabajo**: tras cada cambio verificado (typecheck/lint/test/build) → **commit + push a `main`** (sin pedir permiso). Vercel despliega solo.

## Estado actual (v0.6 — 2026-06-26)

Todo pusheado a `main`:
- **Resumen ejecutivo rediseñado**: scorecard curado de 11 KPIs (catálogo `report_kpi_definitions`, `sql/0006` ya aplicado) con columnas `KPI · Target · Actual · Semana anterior · Owner · Semáforo · Comentario`. El autofill trae actual + **semana anterior real** llamando a los 3 conectores para el rango actual y el previo. KPIs sin conector = fila vacía editable. Lógica en [`src/lib/reports/autofill.ts`](src/lib/reports/autofill.ts).
- **9 informes históricos** publicados en BD (W16-W23 + Mayo 2026 mensual). Seed en `scripts/seed-reports.mjs` + `src/lib/reports/seed/` (soporta `type=monthly`).
- **Auth**: login por formulario + cuentas propias `portal_accounts` (`sql/0005`), gestión en `/admin/users`, toggle dashboards invitados.
- 3 conectores (MainOps ✅, HW Tool ✅, HSM 🟡 espera endpoint). Home con 3 escudos + pestañas `/mainops`, `/hwtool`, `/hsm`.

## Cómo está construido (mapa rápido)

| Zona | Dónde |
|---|---|
| Conectores (fetch + cache 60s + mapper) | `src/lib/connectors/<tool>/` + `src/server/queries/<tool>.ts` |
| Informes: schema/contenido | `src/lib/reports/schema/` (Zod, `reportContentSchemaV1`, 13 secciones) |
| Informes: autofill desde conectores | `src/lib/reports/autofill.ts` |
| Informes: server actions (CRUD/publish/clone/refresh) | `src/server/actions/reports.ts` |
| Informes: editor / viewer / exports | `src/components/reports/` + `src/app/(portal)/reports/` |
| Catálogo de KPIs del resumen ejecutivo | tabla `portal.report_kpi_definitions` (seed en `sql/0006`) |
| Migraciones (a mano, sin `drizzle/`) | `sql/000x_*.sql` |
| Auth / sesión | `src/lib/auth/` + `src/middleware.ts` |

## Dónde retomar (lunes 2026-06-29)

Ver la sección **"Próxima sesión"** de [`proyecto_log.md`](proyecto_log.md). Resumen:
1. **Validar en prod el resumen ejecutivo rediseñado** — crear un borrador nuevo en `/reports/new` y comprobar las 11 filas (Actual + Semana anterior + Owner). Requiere login.
2. **Respuesta de Guille** sobre el desfase 27-vs-28 de "Configuraciones" (la `analytics-api` de HW Tool devuelve 1 sesión menos que su app Toolbox; **no es bug del portal**, escalado — ver Bug conocido #10 en el log).
3. Más mejoras de informes según lo que se vea en prod.
