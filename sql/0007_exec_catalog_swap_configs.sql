-- =============================================================
-- HW Main Portal — Migración 0007
-- KPIs generales v3: sustituir "Configs (confirmadas)" por
-- "Total registros (HW Tool)" en el scorecard del resumen ejecutivo.
-- Desactiva el KPI de configs; total_sessions ya está activo.
--
-- Ejecutar como postgres en Supabase SQL Editor (o vía script).
-- =============================================================

UPDATE portal.report_kpi_definitions
SET active = false, updated_at = now()
WHERE kpi_key = 'hwtool.configs_confirmed';
