---
name: supabase-postgres-best-practices
description: Optimización de PostgreSQL sobre Supabase para el portal — índices, RLS, conexión via pooler, full-text search, performance de queries multi-fuente. Úsalo cuando diseñes queries, debugees latencia o configures RLS.
---

# Supabase + PostgreSQL — buenas prácticas para el portal

## Conexión via Supavisor pooler

- Modo: **transaction**.
- `prepare: false` en postgres-js (statements preparados no funcionan en pooler).
- Connection string: `postgresql://portal_app.[ref]:[pwd]@aws-0-[region].pooler.supabase.com:6543/postgres`.
- Timeout por statement: 15s en server (`statement_timeout: 15000`).

## Roles del proyecto portal

| Role | Propósito |
|---|---|
| `postgres` | Migraciones DDL (en SQL Editor). Nunca usar en runtime. |
| `portal_app` | Runtime del portal: SELECT/INSERT/UPDATE/DELETE en `portal`. |
| `anon` | Sin acceso al schema `portal`. |

## RLS — reglas de oro

1. **`enable row level security` en TODAS las tablas** del schema `portal`.
2. **Default deny**: si no hay policy que permite, no se accede.
3. **Policies por rol del usuario**:
   - `admin` (3 emails) → `using (true) with check (true)`.
   - `viewer` → solo SELECT en tablas leíbles.
4. **No confíes solo en RLS**: server actions también validan rol antes de operar.

Ejemplo:
```sql
alter table portal.kpi_thresholds enable row level security;

create policy "admin_full_access" on portal.kpi_thresholds
  for all
  using ((auth.jwt() ->> 'role') = 'admin')
  with check ((auth.jwt() ->> 'role') = 'admin');

create policy "viewer_read" on portal.kpi_thresholds
  for select
  using ((auth.jwt() ->> 'role') in ('admin','viewer'));
```

## Índices

- **Foreign keys**: índice obligatorio si filtras por ellas.
- **Filtros + sort**: índice compuesto en el orden del WHERE seguido del ORDER BY.
- **Texto**: `pg_trgm` para `LIKE '%foo%'` (no `unaccent` — pooler no lo soporta).
- **Timestamp range**: BRIN para tablas grandes append-only; B-tree estándar funciona bien para <10M rows.

## Full-text search

```sql
create index foo_search_idx on portal.foo
  using gin (to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(notes, '')));
```

Búsqueda:
```sql
where to_tsvector('spanish', name || ' ' || notes) @@ plainto_tsquery('spanish', $1)
```

## Drizzle conventions

- Schema namespace: `pgSchema('portal')`.
- Cada tabla: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`.
- FK explícitas con `references(() => otherTable.id)`.
- `onDelete: 'cascade' | 'restrict' | 'set null'` siempre explícito.

## Migraciones

1. Modificar archivo schema.
2. `npm run db:generate` → archivo SQL en `drizzle/`.
3. **Revisar el SQL**. Drizzle no es perfecto.
4. Dev: `npm run db:push`. Prod: `db:migrate` + revisión humana.
5. DDL siempre como `postgres` en SQL Editor (rol `portal_app` no tiene DDL).

## Queries multi-fuente (portal)

El portal lee de varios proyectos Supabase. Cada uno con su cliente:

```ts
const portalDb = createClient(process.env.PORTAL_DATABASE_URL!);
const hwToolDb = createClient(process.env.HWTOOL_SUPABASE_URL!, process.env.HWTOOL_SUPABASE_ANON_KEY!);
```

- Nunca compartir cliente entre proyectos.
- Cada cliente con su token de menor privilegio posible.
- Lo que lee el portal de HW Tool va vía `Connector<HwToolMetrics>`, no se mezcla con queries del portal.

## Anti-patrones

- Bucle con `await db.select().where(...)` — usar `inArray()` o JOIN.
- `select *` en server queries — listar columnas explícitas.
- Transacciones largas en pooler transaction mode (no soporta).
- `BEGIN; ALTER TYPE...; UPDATE...; COMMIT;` en Supabase SQL Editor — separar en statements.
