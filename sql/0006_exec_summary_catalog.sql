-- =============================================================
-- 0006 — Resumen ejecutivo: catálogo curado de KPIs
-- -------------------------------------------------------------
-- Reemplaza los 12 KPIs crudos de conector por el scorecard de
-- negocio del informe semanal (KPI · Target · Owner). Los KPIs
-- con `source != manual` los rellena el autofill (actual + semana
-- anterior); los `manual` nacen como fila vacía editable.
--
-- Idempotente: re-ejecutable (UPDATE + INSERT ... ON CONFLICT).
-- DML puro (sin DDL) → aplicable con el role runtime del pooler.
-- =============================================================

-- 1) Desactivar los 12 KPIs crudos anteriores.
update portal.report_kpi_definitions
set active = false, updated_at = now()
where version = 1
  and kpi_key in (
    'mainops.total_orders', 'mainops.completed_orders', 'mainops.pending_orders',
    'mainops.sla_7d_pct', 'mainops.avg_delivery_days',
    'hwtool.total_configs', 'hwtool.success_rate_pct',
    'hsm.open_incidents', 'hsm.active_rmas', 'hsm.sla_compliance_pct',
    'hsm.avg_resolution_hours', 'hsm.reopen_rate_pct'
  );

-- 2) Sembrar el scorecard curado (section_key = 'executiveSummary').
insert into portal.report_kpi_definitions
  (kpi_key, label, unit, source, section_key, target, direction, owner)
values
  ('exec.margin',              'Margen (€ / %)',                 '€',         'manual',  'executiveSummary', 4000, 'higher-is-better', 'Guille / JJ'),
  ('hwtool.configs_confirmed', 'Configs (confirmadas)',          'configs',   'hwtool',  'executiveSummary', 24,   'higher-is-better', 'Guille'),
  ('hwtool.success_first_try', '% éxito 1º intento (excl. PnP)', '%',         'hwtool',  'executiveSummary', 80,   'higher-is-better', 'Guille'),
  ('exec.pnp_coverage',        'Cobertura PnP',                  '%',         'manual',  'executiveSummary', 100,  'higher-is-better', 'Guille'),
  ('mainops.total_shipments',  'Envíos totales (of.+prov.)',     'envíos',    'mainops', 'executiveSummary', 12,   'higher-is-better', 'Guille / Domi'),
  ('mainops.sla_7d',           'SLA <7d',                        '%',         'mainops', 'executiveSummary', 100,  'higher-is-better', 'Domi'),
  ('hsm.incidents_over_7d',    'Incidencias >7d',                '#',         'hsm',     'executiveSummary', 5,    'lower-is-better',  'Domi'),
  ('exec.rma_response_2h',     'Resp. RMA <2h',                  'h',         'manual',  'executiveSummary', 2,    'lower-is-better',  'Domi'),
  ('exec.delivery_rate',       'Tasa entrega',                   '%',         'manual',  'executiveSummary', 100,  'higher-is-better', 'Domi'),
  ('exec.cajones_mrr',         'Cajones — MRR nuevo',            '€',         'manual',  'executiveSummary', null, 'higher-is-better', 'JJ'),
  ('hwtool.total_sessions',    'Total registros (HW Tool)',      'registros', 'hwtool',  'executiveSummary', null, 'higher-is-better', 'Guille')
on conflict (kpi_key, version) do update set
  label       = excluded.label,
  unit        = excluded.unit,
  source      = excluded.source,
  section_key = excluded.section_key,
  target      = excluded.target,
  direction   = excluded.direction,
  owner       = excluded.owner,
  active      = true,
  updated_at  = now();
