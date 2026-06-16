import { NextResponse, type NextRequest } from "next/server";
import { requireAdminBasicAuth } from "@/lib/auth/admin-basic-auth";

/**
 * Diagnóstico TEMPORAL — devuelve el JSON crudo del endpoint
 * `/api/external/metrics` del HSM, sin validar shape.
 *
 * Permite ver qué está devolviendo HSM tras el rework para diagnosticar
 * el fallo "Shape inesperado — current.reopen_rate_pct" del hero shield.
 *
 * Protegido por Basic Auth admin (misma cred que /admin/*).
 *
 * TODO: borrar este archivo tras el diagnóstico.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = requireAdminBasicAuth(req);
  if (authError) return authError;

  const baseUrl = process.env.HSM_BASE_URL;
  const apiKey = process.env.HSM_API_KEY;
  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      { error: "HSM_BASE_URL/HSM_API_KEY no configuradas en Vercel" },
      { status: 503 },
    );
  }

  const { searchParams } = req.nextUrl;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const params = new URLSearchParams();
  if (fromParam) params.set("from", fromParam);
  if (toParam) params.set("to", toParam);

  const url = `${baseUrl}/api/external/metrics${params.toString() ? `?${params}` : ""}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
        "content-type": "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    const bodyText = await res.text();
    let parsedBody: unknown = null;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch {
      // body no JSON
    }

    return NextResponse.json(
      {
        request: {
          url,
          method: "GET",
          headers: { "X-API-Key": "<redacted>" },
        },
        response: {
          status: res.status,
          ok: res.ok,
          headers: Object.fromEntries(res.headers.entries()),
          bodyJson: parsedBody,
          bodyTextSample: parsedBody ? null : bodyText.slice(0, 2000),
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Fetch HSM failed",
        detail: err instanceof Error ? err.message : String(err),
        url,
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}
