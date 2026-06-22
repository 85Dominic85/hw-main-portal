import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/session";
import { listAccounts } from "@/lib/auth/accounts";
import { UsersManager, type AccountRow } from "@/components/admin/users-manager";

export const dynamic = "force-dynamic";

export default async function UsersAdminPage() {
  const admin = await requireAdminPage("/admin/users");

  let accounts: AccountRow[] = [];
  let loadError: string | null = null;
  try {
    const rows = await listAccounts();
    accounts = rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role === "viewer" ? "viewer" : "admin",
      active: r.active,
    }));
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Cuentas del portal — crear, permisos (admin/viewer), contraseñas y activar/desactivar.
          </p>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-border bg-card p-4 text-sm">
          <p className="font-semibold text-destructive">No se pudo cargar la lista de cuentas.</p>
          <p className="mt-1 text-muted-foreground">
            Probablemente falta aplicar la migración <code>sql/0005_portal_accounts.sql</code> en el
            SQL Editor de Supabase. Hasta entonces, los 3 emails del departamento siguen entrando con
            la contraseña compartida (fallback de arranque).
          </p>
          <pre className="mt-2 overflow-auto text-xs text-muted-foreground">{loadError}</pre>
        </div>
      ) : (
        <UsersManager accounts={accounts} currentEmail={admin.email} />
      )}
    </div>
  );
}
