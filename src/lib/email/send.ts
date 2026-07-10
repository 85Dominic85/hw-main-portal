import "server-only";

/**
 * Envío de email transaccional vía Resend (REST, sin dependencia npm).
 *
 * Config:
 *   - RESEND_API_KEY  → clave de la API de Resend.
 *   - RESEND_FROM     → remitente, p.ej. "HW Portal <noreply@qamarero.com>".
 *                       Requiere dominio verificado en Resend. Sin él se usa
 *                       "onboarding@resend.dev" (solo entrega al dueño de la
 *                       cuenta Resend — suficiente para pruebas).
 *
 * Si RESEND_API_KEY no está, devuelve { ok:false, error:"not-configured" }
 * para que el caller aplique su fallback (loguear el enlace en servidor).
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;

export type SendResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string; notConfigured: boolean };

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY no configurada", notConfigured: true };
  }
  const from = process.env.RESEND_FROM ?? "HW Portal <onboarding@resend.dev>";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        ...(args.text ? { text: args.text } : {}),
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      let detail = "";
      try {
        const body = (await res.json()) as { message?: string; name?: string };
        detail = body?.message ?? body?.name ?? "";
      } catch {
        /* body no JSON */
      }
      return {
        ok: false,
        error: `Resend HTTP ${res.status}${detail ? ` — ${detail}` : ""}`,
        notConfigured: false,
      };
    }

    const body = (await res.json()) as { id?: string };
    return { ok: true, id: body?.id ?? null };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "Timeout al enviar el email (>10s)", notConfigured: false };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
      notConfigured: false,
    };
  } finally {
    clearTimeout(timer);
  }
}
