-- =============================================================
-- HW Main Portal — Migración 0005: cuentas de usuario propias
-- Cuentas del portal con contraseña individual (hash PBKDF2) y rol.
-- Sustituye al Basic Auth de contraseña compartida (que queda como
-- fallback de arranque mientras esta tabla esté vacía).
--
-- Ejecutar como `postgres` en el SQL Editor de Supabase.
-- =============================================================

create table portal.portal_accounts (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  name           text,
  -- Formato: pbkdf2$<iteraciones>$<saltB64url>$<hashB64url>
  password_hash  text not null,
  role           text not null default 'admin' check (role in ('admin', 'viewer')),
  active         boolean not null default true,
  -- Se incrementa al cambiar contraseña/rol/estado → invalida cookies previas.
  token_version  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index portal_accounts_email_idx on portal.portal_accounts (lower(email));

-- Solo se accede server-side vía el rol runtime `portal_app`. Con RLS activado
-- y sin políticas, la API pública (anon/PostgREST) no puede leer credenciales;
-- `portal_app` (BYPASSRLS) sí opera con normalidad.
alter table portal.portal_accounts enable row level security;
grant select, insert, update, delete on portal.portal_accounts to portal_app;

-- updated_at automático (reusa la función existente).
drop trigger if exists set_updated_at on portal.portal_accounts;
create trigger set_updated_at
  before update on portal.portal_accounts
  for each row execute function portal.set_updated_at();

-- =============================================================
-- FIN 0005_portal_accounts.sql
-- =============================================================
