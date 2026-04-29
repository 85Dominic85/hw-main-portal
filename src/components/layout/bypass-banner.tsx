import { ShieldAlert } from "lucide-react";

import { AUTH_BYPASS_ENABLED } from "@/lib/auth/bypass";

/**
 * Banner amarillo visible cuando PORTAL_AUTH_BYPASS=true.
 * Se renderiza en la parte superior del layout autenticado para que
 * nadie olvide que el portal está sin auth real.
 *
 * Si la env var no está activa, no renderiza nada.
 */
export function BypassBanner() {
  if (!AUTH_BYPASS_ENABLED) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-status-warn/40 bg-status-warn/15 px-4 py-1.5 text-xs font-medium text-status-warn"
    >
      <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
      <span>
        Modo bypass — autenticación desactivada (
        <code className="font-mono">PORTAL_AUTH_BYPASS=true</code>). Quitar la env
        var en Vercel para reactivar el login.
      </span>
    </div>
  );
}
