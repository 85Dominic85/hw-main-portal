-- =============================================================
-- 0008 — Log de interacciones con los conectores externos
-- -------------------------------------------------------------
-- Registro histórico de CADA llamada real (cache-miss) a MainOps /
-- HW Tool / HSM: qué se pidió, de qué URL, con qué parámetros, si fue
-- bien, latencia y error. Alimenta la pestaña "Fuentes" (inspector).
--
-- Aplicar como `postgres` (DDL). `portal_app` hereda CRUD por las
-- default privileges del schema (0001) + grant explícito aquí; además
-- opera con BYPASSRLS, así que los inserts server-side no chocan con RLS.
-- =============================================================

create table if not exists portal.connector_fetch_log (
  id          uuid primary key default gen_random_uuid(),
  connector   text not null check (connector in ('mainops', 'hwtool', 'hsm')),
  url         text not null,
  params      jsonb not null default '{}'::jsonb,
  ok          boolean not null,
  status_code integer,
  latency_ms  integer not null,
  bytes       integer,
  error       text,
  created_at  timestamptz not null default now()
);

create index if not exists connector_fetch_log_connector_created_idx
  on portal.connector_fetch_log (connector, created_at desc);
create index if not exists connector_fetch_log_created_idx
  on portal.connector_fetch_log (created_at desc);

grant select, insert on portal.connector_fetch_log to portal_app;

-- RLS: lectura/escritura solo admin (el runtime portal_app va con BYPASSRLS).
alter table portal.connector_fetch_log enable row level security;

create policy connector_fetch_log_admin_read on portal.connector_fetch_log
  for select using (portal.is_admin());

create policy connector_fetch_log_admin_insert on portal.connector_fetch_log
  for insert with check (portal.is_admin());
