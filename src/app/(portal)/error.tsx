"use client";

import { useEffect } from "react";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PortalError]", error.message, error.stack, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-lg font-semibold">Error en el portal</h2>
      <pre className="max-w-2xl overflow-auto rounded-md bg-muted p-4 text-xs text-muted-foreground">
        {error.message}
        {"\n\n"}
        {error.digest ? `Digest: ${error.digest}` : ""}
      </pre>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Reintentar
      </button>
    </div>
  );
}
