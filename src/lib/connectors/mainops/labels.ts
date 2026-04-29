/**
 * Mapping de claves canónicas de MainOps a etiquetas en español
 * + colores semánticos para los pies y badges.
 */

export const PURCHASE_TYPE_LABELS: Record<string, string> = {
  kit_digital: "Kit Digital",
  hardware_one_off: "Hardware",
  hardware_financiacion: "Hardware financiación",
  transferencias_saas: "Transferencias SaaS",
  otro: "Otro",
};

export function labelForPurchaseType(key: string): string {
  return PURCHASE_TYPE_LABELS[key] ?? key.replace(/_/g, " ");
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  pendiente: "Pendiente",
  enviado_proveedor: "Enviado a proveedor",
  enviado: "Enviado",
  pagado: "Pagado",
  falta_informacion: "Falta info",
  bloqueado: "Bloqueado",
  completado: "Completado",
};

export function labelForOrderStatus(key: string): string {
  return ORDER_STATUS_LABELS[key] ?? key.replace(/_/g, " ");
}

/**
 * Colores para los pie charts. Los estados "buenos" usan verde,
 * los pendientes ámbar, los bloqueados rojo.
 */
export const PURCHASE_TYPE_COLORS: Record<string, string> = {
  kit_digital: "hsl(220 70% 60%)", // azul
  hardware_one_off: "hsl(var(--status-ok))",
  hardware_financiacion: "hsl(280 70% 60%)", // morado
  transferencias_saas: "hsl(195 70% 55%)", // cian
  otro: "hsl(var(--muted-foreground))",
};

export function colorForPurchaseType(key: string): string {
  return PURCHASE_TYPE_COLORS[key] ?? "hsl(var(--muted-foreground))";
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  nuevo: "hsl(220 70% 60%)",
  pendiente: "hsl(var(--status-warn))",
  enviado_proveedor: "hsl(280 70% 60%)",
  enviado: "hsl(195 70% 55%)",
  pagado: "hsl(var(--status-ok))",
  falta_informacion: "hsl(var(--status-warn))",
  bloqueado: "hsl(var(--status-danger))",
  completado: "hsl(var(--status-ok))",
};

export function colorForOrderStatus(key: string): string {
  return ORDER_STATUS_COLORS[key] ?? "hsl(var(--muted-foreground))";
}
