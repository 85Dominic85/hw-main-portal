# HW Main Portal — Punto de entrada para retomar

> Lee esto primero si vuelves desde **otro terminal** o tras un parón. Es el "empieza aquí".
> Para el detalle completo (decisiones, bugs, histórico, credenciales): [`proyecto_log.md`](proyecto_log.md). Para la arquitectura: [`CLAUDE.md`](CLAUDE.md).
>
> Última actualización: **2026-09-09** (miércoles). Próxima sesión: **jueves 2026-09-10**.

> 🔴 **LO PRIMERO AL RETOMAR**: verificar si `/bitacora` sigue dando **504**. Se
> pusheó un fix (`ebdf046`) que **no quedó confirmado**, y la causa se **dedujo,
> no se observó**. Detalle completo en la sección "Próxima sesión" de
> [`proyecto_log.md`](proyecto_log.md).

---

## Qué es

Capa de visualización del dpto Hardware de Qamarero: agrega métricas de 3 herramientas internas (MainOps/Logística, HW Tool/Configuraciones, HSM) vía **conectores** + feature de **Informes semanales/mensuales** (editor estilo Notion, publish, export PDF/MD/Notion) + **Bitácora** diaria del departamento con recopilatorio semanal calculado.

- **Producción**: https://hw-main-portal.vercel.app (auto-deploy desde `main` en Vercel).
- **Repo**: https://github.com/85Dominic85/hw-main-portal (branch por defecto `main`).
- Stack: Next.js 15 (App Router) · TS strict · Drizzle · Supabase Postgres (schema `portal`) · shadcn/ui + Tailwind v4 · Recharts · Vitest.

## Arrancar en un terminal que no está al día

```bash
git pull            # o git clone https://github.com/85Dominic85/hw-main-portal.git
npm install
# Pedir al user el .env.local (NO se commitea — está en .gitignore).
# Incluye PORTAL_DATABASE_URL, HWTOOL_ANALYTICS_API_URL/KEY, MAINOPS_BASE_URL/API_KEY, etc.
npm run typecheck && npm test && npm run build   # base limpia si todo verde (142 tests)
npm run dev         # http://localhost:3001
```

> ⚠️ **No se prueba en local, se valida en producción.** El portal exige login real (cuentas en `portal_accounts`) y los datos viven en una única BD de Supabase. **Norma de trabajo**: tras cada cambio verificado (typecheck/lint/test/build) → **commit + push a `main`** (sin pedir permiso). Vercel despliega solo.

## Estado actual (v0.7 — 2026-09-09)

### Lo último: Bitácora del departamento (`/bitacora`, solo admin)

Sustituye el Google Doc infinito del día a día. **Se rellena por persona** (texto
libre con TipTap + etiquetas opcionales) y el **recopilatorio semanal se calcula
solo**: scorecard arriba, diario completo debajo, vistas conmutables
`?vista=temas|personas`. Exports a Markdown, Notion (pegado manual) y PDF.

- Migración `sql/0009_log_entries.sql` **ya aplicada** en prod — no re-aplicar.
- **Semana laboral L–V** en `src/lib/bitacora/work-week.ts`. ⚠️ **No tocar
  `src/lib/reports/iso-week.ts`**: lo consumen 9 ficheros de informes y
  cambiarlo reetiquetaría los informes históricos publicados.
- Dos marcas opcionales por entrada, `status` y `highlight`, que alimentan las
  partes del scorecard que no se pueden calcular del texto.
- **Sin verificar con datos reales todavía** (los MCP de Supabase dieron 401
  toda la sesión). Checklist de validación en `proyecto_log.md`.
- Pendiente: **Slack** (necesita webhook) y **Google Doc** (necesita service
  account). La integración en el informe **mensual** espera a que jota valide el
  formato.

### Antes (v0.6 y anteriores)

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
| Bitácora: lógica pura (semana L–V, resumen, markdown) | `src/lib/bitacora/` |
| Bitácora: server actions / queries | `src/server/actions/bitacora.ts` · `src/server/queries/bitacora.ts` |
| Bitácora: UI y exports | `src/components/bitacora/` · `src/app/(portal)/bitacora/` · `src/app/api/portal/bitacora/` |
| Inspector de conectores (qué trae cada herramienta y a qué KPI alimenta) | `src/app/(portal)/fuentes/` + `src/lib/fuentes/fields.ts` |

## Dónde retomar (jueves 2026-09-10)

Ver la sección **"Próxima sesión"** de [`proyecto_log.md`](proyecto_log.md), que
tiene el detalle. Resumen por orden de prioridad:

1. 🔴 **¿Sigue el 504 en `/bitacora`?** Confirmar que el deploy de `ebdf046` está
   en producción y abrir la pestaña con sesión de admin. Si sigue colgándose:
   Vercel → Logs → filtrar `/bitacora`. La causa del fix se dedujo, no se
   observó, así que puede haber una segunda causa detrás.
2. **Validar la bitácora en prod** — checklist de 7 pasos en el log. El más
   importante: una entrada en **sábado** debe salir en "fuera de horario" sin
   añadir columna a la gráfica de 5 barras, y la cabecera debe cerrar en viernes.
3. **Fases 4 y 5** de la bitácora (Slack, Google Doc) — bloqueadas por
   credenciales que tiene que dar el user.
4. **Deuda técnica anotada, no arreglada**: falta `statement_timeout` en el
   cliente de BD; hay client components arrastrando el schema Drizzle al bundle;
   quedan 2 ramas remotas muertas por borrar desde la UI de GitHub.
5. **Bug #10** — desfase 27 vs 28 configuraciones, esperando a Guille. **No es
   bug del portal.**
