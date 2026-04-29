/**
 * Tipos compartidos por todos los connectors del HW Main Portal.
 *
 * Cada herramienta externa (MainOPS, HW Tool, HSM) implementa la
 * interfaz `Connector<TMetrics>` con su propio shape de métricas.
 *
 * Patrón de error uniforme: `Result<T>` discriminated union.
 * Patrón de cache: tags `<connector>-metrics`, revalidate 60s.
 *
 * Implementación pendiente — este archivo define solo los contratos.
 */

export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export type Period = "daily" | "weekly" | "biweekly" | "monthly" | "custom";

export interface PeriodFilter {
  period: Period;
  from?: Date;
  to?: Date;
}

export interface HotListItem {
  id: string;
  occurredAt: Date;
  severity: "info" | "warning" | "danger";
  title: string;
  description?: string;
  href?: string;
}

export interface ConnectorHealth {
  ok: boolean;
  latencyMs?: number;
  message?: string;
  checkedAt: Date;
}

/**
 * Cada connector retorna sus métricas en su propio shape.
 * El UI conoce el shape via tipos derivados del propio connector.
 */
export interface Connector<TMetrics> {
  /** Identificador estable del connector (`mainops`, `hwtool`, `hsm`). */
  readonly id: string;

  /** Nombre visible en UI. */
  readonly displayName: string;

  /** URL externa de la herramienta para botón "Abrir". */
  readonly externalUrl: string;

  getMetrics(filter: PeriodFilter): Promise<Result<TMetrics>>;

  getHotList(): Promise<Result<HotListItem[]>>;

  healthcheck(): Promise<ConnectorHealth>;
}
