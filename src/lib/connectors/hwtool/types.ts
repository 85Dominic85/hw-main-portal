/**
 * Tipos del connector HW Tool — shape interno del portal.
 * Convención: camelCase. El mapper traduce la API externa (snake_case)
 * a estos tipos.
 */

export interface HwToolBreakdown {
  configOk: { count: number; percentOfTotal: number };
  configPnp: { count: number; percentOfTotal: number };
  configRequires2nd: { count: number; percentOfTotal: number };
  auditoria: { count: number; percentOfTotal: number };
  noshow: { count: number; percentOfTotal: number };
}

export interface HwToolPrincipal {
  totalSessions: number;
  configuracion: number; // suma de los 3 tipos de config
  auditoria: number;
  noshow: number;
}

export interface HwToolProblem {
  /** Clave canónica (`no_problem`, `hardware_problem`, etc.). */
  key: string;
  /** Etiqueta legible en español. */
  label: string;
  count: number;
}

export interface HwToolEquipment {
  own: { count: number; percent: number };
  external: { count: number; percent: number };
  totalItems: number;
}

export interface HwToolCrmTestMotivo {
  motivo: string;
  count: number;
}

export interface HwToolCrmTest {
  count: number;
  percentOfTotal: number;
  withMotivo: number;
  breakdownByType: {
    configuracion: number;
    auditoria: number;
    noshow: number;
  };
  motivos: HwToolCrmTestMotivo[];
}

export interface HwToolMetrics {
  generatedAt: Date;
  schemaVersion: string;
  filters: {
    from: Date | null;
    to: Date | null;
    technician: string | null;
    crmTest: boolean | null;
  };
  principal: HwToolPrincipal;
  detailed: HwToolBreakdown;
  problems: HwToolProblem[];
  equipment: HwToolEquipment;
  /** Solo presente si la API devuelve `additional.crm_test` (v1.1.0+). */
  crmTest: HwToolCrmTest | null;
  /** Derivado: % configs OK a 1ª (config_ok + config_pnp) / configuracion. */
  successRateFirstTry: number; // 0..100
  /** % de configs que requieren 2ª visita / configuracion. */
  secondConfigRate: number; // 0..100
}

export interface HwToolPeriodFilter {
  from?: Date;
  to?: Date;
  technician?: string;
  /** Si se pasa, filtra el endpoint por sesiones marcadas (true) o no (false)
   *  como CRM test. Si se omite, devuelve todas. */
  crmTest?: boolean;
}
