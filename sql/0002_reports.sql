-- =============================================================
-- HW Main Portal — Migración 0002: Feature "Informes"
-- Crea tablas reports, report_authors, report_kpi_definitions,
-- report_templates con RLS y triggers.
--
-- Ejecutar como `postgres` en Supabase SQL Editor.
-- NO ejecutar con `portal_app` (no tiene DDL).
-- =============================================================

-- =============================================================
-- TABLAS
-- =============================================================

-- -------------------------------------------------------------
-- portal.reports
-- Informe semanal / mensual / custom del departamento HW.
-- content es JSONB versionado (reportContentSchemaV1).
-- kpi_snapshot es null en draft (live) y se congela al publicar.
-- -------------------------------------------------------------
create table portal.reports (
  id                uuid primary key default gen_random_uuid(),
  type              text not null check (type in ('weekly', 'monthly', 'custom')),
  period_key        text not null,
  -- "W22-2026" | "2026-05" | "2026-05-15--2026-05-30"
  period_from       date,
  period_to         date,
  iso_year          integer check (iso_year between 2020 and 2100),
  iso_week          integer check (iso_week between 1 and 53),
  status            text not null default 'draft'
                    check (status in ('draft', 'published', 'archived')),
  global_status     text check (global_status in ('verde', 'amarillo', 'rojo')),
  title             text not null,
  content           jsonb not null default '{}'::jsonb,
  kpi_snapshot      jsonb,
  content_version   integer not null default 1,
  parent_report_id  uuid references portal.reports (id) on delete set null,
  created_by        uuid not null references portal.portal_users (id) on delete restrict,
  published_by      uuid references portal.portal_users (id) on delete set null,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (type, period_key)
);

-- Una sola semana ISO activa por año (los archivados no cuentan).
create unique index reports_weekly_unique
  on portal.reports (iso_year, iso_week)
  where type = 'weekly' and status != 'archived';

create index reports_status_idx on portal.reports (status);
create index reports_created_by_idx on portal.reports (created_by);
create index reports_period_idx on portal.reports (type, period_from desc);

-- -------------------------------------------------------------
-- portal.report_authors
-- Audit trail: quién editó qué sección y cuándo.
-- -------------------------------------------------------------
create table portal.report_authors (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references portal.reports (id) on delete cascade,
  section_key text not null,
  user_id     uuid references portal.portal_users (id) on delete set null,
  action      text not null
              check (action in ('create', 'edit', 'autosave', 'publish', 'clone', 'restore')),
  diff_summary jsonb,
  created_at  timestamptz not null default now()
);

create index report_authors_report_id_idx on portal.report_authors (report_id, created_at desc);
create index report_authors_user_id_idx on portal.report_authors (user_id);

-- -------------------------------------------------------------
-- portal.report_kpi_definitions
-- Catálogo versionado de KPIs con targets, owners y semáforos.
-- Permite editar umbrales sin tocar código.
-- -------------------------------------------------------------
create table portal.report_kpi_definitions (
  id          uuid primary key default gen_random_uuid(),
  kpi_key     text not null,
  version     integer not null default 1,
  label       text not null,
  unit        text,
  source      text not null check (source in ('mainops', 'hwtool', 'hsm', 'manual')),
  section_key text not null,
  target      numeric,
  warn_delta  numeric,
  danger_delta numeric,
  direction   text not null default 'higher-is-better'
              check (direction in ('higher-is-better', 'lower-is-better')),
  owner       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (kpi_key, version)
);

create index report_kpi_definitions_active_idx
  on portal.report_kpi_definitions (section_key, active)
  where active = true;

-- Seed: KPIs iniciales del informe weekly_v1
insert into portal.report_kpi_definitions
  (kpi_key, label, unit, source, section_key, target, direction, owner)
values
  -- MainOPS
  ('mainops.total_orders',        'Total pedidos',       'pedidos', 'mainops', 'envios', null,  'higher-is-better', 'Domi'),
  ('mainops.completed_orders',    'Completados',         'pedidos', 'mainops', 'envios', null,  'higher-is-better', 'Domi'),
  ('mainops.pending_orders',      'Pendientes',          'pedidos', 'mainops', 'envios', null,  'lower-is-better',  'Domi'),
  ('mainops.sla_7d_pct',          'SLA 7d',              '%',       'mainops', 'envios', 90,    'higher-is-better', 'Domi'),
  ('mainops.avg_delivery_days',   'Plazo medio entrega', 'días',    'mainops', 'envios', null,  'lower-is-better',  'Domi'),
  -- HW Tool
  ('hwtool.total_configs',        'Total configs',       'configs', 'hwtool',  'configuraciones', null, 'higher-is-better', 'Guille'),
  ('hwtool.success_rate_pct',     '% éxito 1ª config',  '%',       'hwtool',  'configuraciones', 85,   'higher-is-better', 'Guille'),
  -- HSM
  ('hsm.open_incidents',          'Incidencias abiertas','#',       'hsm',     'soporte', null, 'lower-is-better',  'Domi'),
  ('hsm.active_rmas',             'RMAs activos',        '#',       'hsm',     'soporte', null, 'lower-is-better',  'Domi'),
  ('hsm.sla_compliance_pct',      'SLA cumplido',        '%',       'hsm',     'soporte', 90,   'higher-is-better', 'Domi'),
  ('hsm.avg_resolution_hours',    'Resolución media',    'h',       'hsm',     'soporte', 48,   'lower-is-better',  'Domi'),
  ('hsm.reopen_rate_pct',         'Tasa reapertura',     '%',       'hsm',     'soporte', 5,    'lower-is-better',  'Domi')
on conflict (kpi_key, version) do nothing;

-- -------------------------------------------------------------
-- portal.report_templates
-- Layouts disponibles (seed: weekly_v1). Preparado para futuros
-- formatos (monthly_v1, etc.) sin migración adicional.
-- -------------------------------------------------------------
create table portal.report_templates (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  label        text not null,
  description  text,
  type         text not null check (type in ('weekly', 'monthly', 'custom')),
  sections     jsonb not null default '[]'::jsonb,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

insert into portal.report_templates (slug, label, description, type, sections)
values (
  'weekly_v1',
  'Informe semanal Hardware',
  'Plantilla estándar del informe semanal de Jota a Pablo — estructura W20/W21/W22.',
  'weekly',
  '["tesis","executive_summary","amber_red","highlights","blockers","decisions","configuraciones","envios","soporte","cajones","performance","next_focus","pablo_comments"]'::jsonb
)
on conflict (slug) do nothing;

-- =============================================================
-- TRIGGERS updated_at
-- =============================================================

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'reports',
      'report_kpi_definitions',
      'report_templates'
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
-- TRIGGER guard_published_report
-- Impide mutar content / kpi_snapshot / period_* de un informe
-- ya publicado. Para corregir: unpublish primero (→ draft).
-- =============================================================

create or replace function portal.guard_published_report()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'published' and new.status = 'published' then
    if old.content is distinct from new.content
      or old.kpi_snapshot is distinct from new.kpi_snapshot
      or old.period_key is distinct from new.period_key
      or old.period_from is distinct from new.period_from
      or old.period_to is distinct from new.period_to
    then
      raise exception 'No se puede modificar un informe publicado. Despublica primero (status=draft).';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_published_report on portal.reports;
create trigger guard_published_report
  before update on portal.reports
  for each row execute function portal.guard_published_report();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

-- ------- reports -------
alter table portal.reports enable row level security;

-- Viewers: solo informes publicados
create policy reports_viewer_read on portal.reports
  for select
  using (
    portal.is_authenticated_user()
    and (status = 'published' or portal.is_admin())
  );

-- Admins: CRUD completo
create policy reports_admin_write on portal.reports
  for all
  using (portal.is_admin())
  with check (portal.is_admin());

-- ------- report_authors -------
alter table portal.report_authors enable row level security;

create policy report_authors_read on portal.report_authors
  for select
  using (portal.is_authenticated_user());

create policy report_authors_admin_write on portal.report_authors
  for all
  using (portal.is_admin())
  with check (portal.is_admin());

-- Los admins también pueden insertar su propio audit trail
create policy report_authors_admin_insert on portal.report_authors
  for insert
  with check (portal.is_admin());

-- ------- report_kpi_definitions -------
alter table portal.report_kpi_definitions enable row level security;

create policy report_kpi_def_read on portal.report_kpi_definitions
  for select
  using (portal.is_authenticated_user());

create policy report_kpi_def_admin_write on portal.report_kpi_definitions
  for all
  using (portal.is_admin())
  with check (portal.is_admin());

-- ------- report_templates -------
alter table portal.report_templates enable row level security;

create policy report_templates_read on portal.report_templates
  for select
  using (portal.is_authenticated_user());

create policy report_templates_admin_write on portal.report_templates
  for all
  using (portal.is_admin())
  with check (portal.is_admin());

-- =============================================================
-- FIN DE 0002_reports.sql
-- =============================================================
