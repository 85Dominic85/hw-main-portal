import { requireAdminPage } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Las páginas de laboratorio (comparadores de diseño) son solo-admin.
 * Gate server-side (además del middleware) para que la revocación de un admin
 * aplique al instante (redirect limpio), no tras expirar la cookie.
 */
export default async function LabLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage("/lab");
  return <>{children}</>;
}
