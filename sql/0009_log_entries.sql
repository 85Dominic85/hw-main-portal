-- =============================================================
-- 0009 — Bitácora del departamento (cuaderno de a bordo diario)
-- -------------------------------------------------------------
-- Sustituye al Google Doc infinito donde el dpto de Hardware registra
-- llamadas, incidencias, configuraciones e instalaciones día a día.
-- Cada fila es una entrada: texto libre (TipTap) + etiquetas opcionales.
--
-- El recopilatorio semanal NO se almacena: se calcula al vuelo desde
-- estas filas (`summarizeWeek`), igual que las tendencias del portal.
--
-- Autor por EMAIL, sin FK: desde 0005 el login va por `portal_accounts`
-- + cookie firmada, y `getCurrentUser()` devuelve un id sintético común
-- a todos los usuarios. Además un admin del allowlist
-- (PORTAL_ADMIN_EMAILS) puede no tener fila en `portal_accounts`
-- (bootstrap per-email), así que un FK a cualquiera de las dos tablas
-- rompería. El email es la identidad real del portal.
--
-- Aplicar como `postgres` (DDL). `portal_app` hereda CRUD por las
-- default privileges del schema (0001) + grant explícito aquí; además
-- opera con BYPASSRLS, así que las escrituras server-side no chocan
-- con RLS.
-- =============================================================

create table if not exists portal.log_entries (
  id           uuid primary key default gen_random_uuid(),

  -- Día al que pertenece la entrada. Editable: permite rellenar ayer.
  -- No es created_at: se escribe el jueves lo que pasó el martes.
  entry_date   date not null,

  author_email text not null,
  -- Nombre en el momento de escribir (snapshot). Si la cuenta cambia de
  -- nombre, la entrada histórica conserva quién la firmó.
  author_name  text,

  title        text,
  -- Documento TipTap. Misma forma que el body de los informes.
  body         jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  -- Texto plano derivado del body, para búsqueda con ILIKE + pg_trgm.
  -- Se rellena en el server action (tiptapToPlainText).
  body_text    text not null default '',

  -- Etiquetas normalizadas: minúsculas, sin '#', slug. Opcionales.
  tags         text[] not null default '{}',
  -- Cliente / local, si aplica. Texto libre con autocompletado en UI.
  client       text,

  -- Las dos ÚNICAS concesiones a la estructura, ambas opcionales.
  -- Existen porque hay partes del scorecard semanal que no se pueden
  -- calcular del texto: "2 resueltas · 1 abierta" necesita `status`, y
  -- el bloque "Lo que hay que mirar" necesita `highlight` (saber qué es
  -- lo importante de la semana es criterio, no agregación).
  status       text check (status in ('abierta', 'resuelta', 'seguimiento')),
  highlight    boolean not null default false,

  -- Semana ISO como columnas GENERADAS: extract(isoyear|week|isodow) es
  -- IMMUTABLE sobre date, así que no pueden desincronizarse de
  -- entry_date. `iso_dow`: 1=lunes … 7=domingo.
  iso_year     integer generated always as (extract(isoyear from entry_date)::int) stored,
  iso_week     integer generated always as (extract(week    from entry_date)::int) stored,
  iso_dow      integer generated always as (extract(isodow  from entry_date)::int) stored,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists log_entries_date_idx
  on portal.log_entries (entry_date desc);
create index if not exists log_entries_author_date_idx
  on portal.log_entries (author_email, entry_date desc);
create index if not exists log_entries_week_idx
  on portal.log_entries (iso_year, iso_week);
create index if not exists log_entries_tags_gin
  on portal.log_entries using gin (tags);
-- Búsqueda de texto libre. pg_trgm está activado en 0001. NO usar
-- unaccent(): el pooler no lo soporta (ver CLAUDE.md).
create index if not exists log_entries_body_trgm
  on portal.log_entries using gin (body_text gin_trgm_ops);

-- Parciales: las consultas que las usan filtran siempre por el valor
-- "interesante", así que el índice solo indexa esas filas.
create index if not exists log_entries_highlight_idx
  on portal.log_entries (iso_year, iso_week) where highlight;
create index if not exists log_entries_open_idx
  on portal.log_entries (entry_date desc) where status = 'abierta';

-- updated_at automático, reusando el helper de 0001.
drop trigger if exists log_entries_set_updated_at on portal.log_entries;
create trigger log_entries_set_updated_at
  before update on portal.log_entries
  for each row execute function portal.set_updated_at();

grant select, insert, update, delete on portal.log_entries to portal_app;

-- RLS: solo admin (los 3 del dpto, jota incluido). Defensa en
-- profundidad — la autorización real la aplican los server actions con
-- requireAdmin(), porque portal_app va con BYPASSRLS y auth.uid() no
-- está poblado para las cuentas de portal_accounts.
-- La regla "cada autor solo edita lo suyo" se aplica en código
-- (comparando author_email con el email de sesión), no aquí.
-- Abrirlo a `viewer` más adelante = añadir una policy de select.
alter table portal.log_entries enable row level security;

create policy log_entries_admin_read on portal.log_entries
  for select using (portal.is_admin());

create policy log_entries_admin_write on portal.log_entries
  for all using (portal.is_admin()) with check (portal.is_admin());
