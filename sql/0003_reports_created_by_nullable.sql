-- =============================================================
-- HW Main Portal — Migración 0003
-- Hace `reports.created_by` nullable para soportar bypass mode
-- (cuando PORTAL_AUTH_REQUIRED != "true", no hay auth.users reales).
--
-- Ejecutar como `postgres` en Supabase SQL Editor.
-- =============================================================

ALTER TABLE portal.reports
  ALTER COLUMN created_by DROP NOT NULL;
