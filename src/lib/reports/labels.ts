import type { RmaCaseStatus, BlockerRow } from "./schema";

/**
 * Etiquetas legibles de estados, fuente única para las 4 superficies
 * (editor, visor, PDF, markdown) → mismo texto en todas.
 */
export const RMA_ESTADO_LABEL: Record<RmaCaseStatus, string> = {
  abierto: "Abierto",
  en_progreso: "En progreso",
  esperando_proveedor: "Esperando proveedor",
  escalada: "Escalada",
  cerrada: "Cerrada",
};

export const BLOCKER_STATUS_LABEL: Record<BlockerRow["status"], string> = {
  abierto: "Abierto",
  en_progreso: "En progreso",
  bloqueado: "Bloqueado",
};
