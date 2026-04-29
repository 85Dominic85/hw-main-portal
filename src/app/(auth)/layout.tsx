/**
 * Layout para rutas no autenticadas (login, callback, error).
 * No tiene sidebar ni topbar — solo un fondo neutro centrado.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}
