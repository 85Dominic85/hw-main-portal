-- =============================================================
-- HW Main Portal — Migración inicial
-- Crea schema `portal`, tablas, role `portal_app`, RLS y trigger
-- de allowlist de dominio en signup.
--
-- Ejecutar como `postgres` en Supabase SQL Editor.
-- NO ejecutar con `portal_app` (no tiene DDL).
-- =============================================================

-- -------------------------------------------------------------
-- Extensiones requeridas
-- -------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- -------------------------------------------------------------
-- Schema y role
-- -------------------------------------------------------------
create schema if not exists portal;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'portal_app') then
    create role portal_app login password 'CHANGE_ME_USE_VAULT';
  end if;
end $$;

grant usage on schema portal to portal_app;
alter default privileges in schema portal grant select, insert, update, delete on tables to portal_app;
alter default privileges in schema portal grant usage, select on sequences to portal_app;

-- =============================================================
-- TABLAS
-- =============================================================

-- -------------------------------------------------------------
-- portal.portal_users
-- Espejo de auth.users con rol del portal.
-- -------------------------------------------------------------
create table portal.portal_users (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null unique,
  full_name     text,
  role          text not null default 'viewer'
                check (role in ('admin', 'viewer')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index portal_users_email_idx on portal.portal_users (email);
create index portal_users_role_idx on portal.portal_users (role);

-- -------------------------------------------------------------
-- portal.kpi_thresholds
-- Umbrales semáforo configurables por KPI.
-- -------------------------------------------------------------
create table portal.kpi_thresholds (
  id            uuid primary key default gen_random_uuid(),
  kpi_id        text not null unique,
  warn_value    numeric,
  danger_value  numeric,
  direction     text not null default 'lower-is-worse'
                check (direction in ('lower-is-worse', 'higher-is-worse')),
  notes         text,
  updated_by    uuid references portal.portal_users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index kpi_thresholds_kpi_id_idx on portal.kpi_thresholds (kpi_id);

-- -------------------------------------------------------------
-- portal.kpi_notes
-- Notas/comentarios sobre métricas — thread por KPI.
-- -------------------------------------------------------------
create table portal.kpi_notes (
  id            uuid primary key default gen_random_uuid(),
  kpi_id        text not null,
  body          text not null,
  author_id     uuid not null references portal.portal_users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index kpi_notes_kpi_id_created_at_idx on portal.kpi_notes (kpi_id, created_at desc);
create index kpi_notes_author_id_idx on portal.kpi_notes (author_id);

-- -------------------------------------------------------------
-- portal.kpi_goals
-- Metas mensuales por KPI.
-- -------------------------------------------------------------
create table portal.kpi_goals (
  id            uuid primary key default gen_random_uuid(),
  kpi_id        text not null,
  period_year   integer not null check (period_year between 2025 and 2100),
  period_month  integer not null check (period_month between 1 and 12),
  target_value  numeric not null,
  notes         text,
  created_by    uuid references portal.portal_users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (kpi_id, period_year, period_month)
);

create index kpi_goals_kpi_period_idx on portal.kpi_goals (kpi_id, period_year, period_month);

-- -------------------------------------------------------------
-- portal.manual_entries
-- Métricas manuales que no viven en las herramientas externas.
-- -------------------------------------------------------------
create table portal.manual_entries (
  id            uuid primary key default gen_random_uuid(),
  kpi_id        text not null,
  occurred_at   timestamptz not null,
  value         numeric not null,
  description   text,
  created_by    uuid not null references portal.portal_users (id) on delete restrict,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index manual_entries_kpi_occurred_idx on portal.manual_entries (kpi_id, occurred_at desc);
create index manual_entries_created_by_idx on portal.manual_entries (created_by);

-- -------------------------------------------------------------
-- portal.export_log
-- Audit log de exports CSV.
-- -------------------------------------------------------------
create table portal.export_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references portal.portal_users (id) on delete restrict,
  export_kind   text not null,
  filters       jsonb not null default '{}'::jsonb,
  row_count     integer,
  created_at    timestamptz not null default now()
);

create index export_log_user_created_idx on portal.export_log (user_id, created_at desc);

-- =============================================================
-- updated_at trigger
-- =============================================================

create or replace function portal.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'portal_users',
      'kpi_thresholds',
      'kpi_notes',
      'kpi_goals',
      'manual_entries'
    ])
  loop
    execute format('drop trigger if exists set_updated_at on portal.%I', t);
    execute format(
      'create trigger set_updated_at before update on portal.%I
        for each row execute function portal.set_updated_at()',
      t
    );
  end loop;
end $$;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

-- Helper: ¿es el usuario actual admin?
create or replace function portal.is_admin()
returns boolean
language sql
stable
security definer
set search_path = portal, public
as $$
  select coalesce(
    (select role = 'admin' from portal.portal_users where id = auth.uid()),
    false
  );
$$;

-- Helper: ¿es viewer (incluye admin)?
create or replace function portal.is_authenticated_user()
returns boolean
language sql
stable
security definer
set search_path = portal, public
as $$
  select exists (select 1 from portal.portal_users where id = auth.uid());
$$;

-- ------- portal_users -------
alter table portal.portal_users enable row level security;

create policy portal_users_self_read on portal.portal_users
  for select
  using (auth.uid() = id or portal.is_admin());

create policy portal_users_admin_full on portal.portal_users
  for all
  using (portal.is_admin())
  with check (portal.is_admin());

-- ------- kpi_thresholds -------
alter table portal.kpi_thresholds enable row level security;

create policy kpi_thresholds_read on portal.kpi_thresholds
  for select
  using (portal.is_authenticated_user());

create policy kpi_thresholds_admin_write on portal.kpi_thresholds
  for all
  using (portal.is_admin())
  with check (portal.is_admin());

-- ------- kpi_notes -------
alter table portal.kpi_notes enable row level security;

create policy kpi_notes_read on portal.kpi_notes
  for select
  using (portal.is_authenticated_user());

create policy kpi_notes_admin_write on portal.kpi_notes
  for all
  using (portal.is_admin())
  with check (portal.is_admin());

-- ------- kpi_goals -------
alter table portal.kpi_goals enable row level security;

create policy kpi_goals_read on portal.kpi_goals
  for select
  using (portal.is_authenticated_user());

create policy kpi_goals_admin_write on portal.kpi_goals
  for all
  using (portal.is_admin())
  with check (portal.is_admin());

-- ------- manual_entries -------
alter table portal.manual_entries enable row level security;

create policy manual_entries_read on portal.manual_entries
  for select
  using (portal.is_authenticated_user());

create policy manual_entries_admin_write on portal.manual_entries
  for all
  using (portal.is_admin())
  with check (portal.is_admin());

-- ------- export_log -------
alter table portal.export_log enable row level security;

create policy export_log_self_read on portal.export_log
  for select
  using (auth.uid() = user_id or portal.is_admin());

create policy export_log_admin_full on portal.export_log
  for all
  using (portal.is_admin())
  with check (portal.is_admin());

create policy export_log_self_insert on portal.export_log
  for insert
  with check (auth.uid() = user_id and portal.is_authenticated_user());

-- =============================================================
-- ALLOWLIST DE DOMINIO + AUTOMATIC USER PROVISIONING
-- =============================================================
-- Trigger en auth.users para:
--   1. Bloquear signups fuera del dominio @qamarero.com.
--   2. Insertar fila en portal.portal_users con rol según email.
-- Los emails admin se mantienen en una tabla pequeña en lugar
-- de hardcodear: facilita gestión sin redeploy.

create table if not exists portal.admin_emails (
  email     text primary key
);

insert into portal.admin_emails (email) values
  ('jj.gallego@qamarero.com'),
  ('guillermo.mateos@qamarero.com'),
  ('domingo.bueno@qamarero.com')
on conflict (email) do nothing;

create or replace function portal.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = portal, public
as $$
declare
  v_role text;
begin
  if new.email is null or position('@qamarero.com' in lower(new.email)) = 0 then
    raise exception 'Email % is not allowed (only @qamarero.com).', new.email;
  end if;

  if exists (select 1 from portal.admin_emails where email = lower(new.email)) then
    v_role := 'admin';
  else
    v_role := 'viewer';
  end if;

  insert into portal.portal_users (id, email, role)
  values (new.id, lower(new.email), v_role)
  on conflict (id) do update set
    email = excluded.email,
    role  = excluded.role,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function portal.handle_new_auth_user();

-- =============================================================
-- JWT custom claim — para que RLS pueda leer el rol del usuario
-- =============================================================
-- Se usará en hooks Auth de Supabase (Auth Hook):
-- https://supabase.com/docs/guides/auth/auth-hooks#hook-custom-access-token

create or replace function portal.set_role_claim_on_jwt(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  user_role text;
  claims jsonb;
begin
  select role into user_role from portal.portal_users where id = (event->>'user_id')::uuid;
  claims := event->'claims';
  claims := jsonb_set(claims, '{role}', to_jsonb(coalesce(user_role, 'viewer')));
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Tras crear esta función, configurar en Supabase Auth → Hooks:
--   Custom Access Token Hook → portal.set_role_claim_on_jwt

-- =============================================================
-- FIN DE 0001_init.sql
-- =============================================================
