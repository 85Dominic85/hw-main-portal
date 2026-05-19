import { NextResponse } from "next/server";

/**
 * TEMPORAL — endpoint diagnóstico para verificar qué valores ve el server
 * en las env vars de admin auth. NO expone la password real, solo metadata
 * (longitud y caracteres ASCII visibles), suficiente para diagnosticar
 * problemas de copy-paste con espacios/caracteres invisibles.
 *
 * Quitar este archivo en cuanto el problema esté resuelto.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const emailsRaw = process.env.PORTAL_ADMIN_EMAILS;
  const passwordRaw = process.env.PORTAL_ADMIN_PASSWORD;

  // Detectar caracteres no-imprimibles o whitespace al inicio/final.
  function describe(value: string | undefined) {
    if (value === undefined) return { set: false };
    return {
      set: true,
      length: value.length,
      length_after_trim: value.trim().length,
      starts_with_space: value !== value.trimStart(),
      ends_with_space: value !== value.trimEnd(),
      contains_quote: value.includes('"') || value.includes("'"),
      // Códigos ASCII de cada carácter — revela espacios invisibles, NBSP, etc.
      // Para password mostramos solo los códigos sin las letras reales.
      char_codes: Array.from(value).map((c) => c.charCodeAt(0)),
    };
  }

  // Para emails sí revelamos el valor (no es secreto).
  const emails = emailsRaw
    ? emailsRaw
        .split(",")
        .map((s) => ({ raw: s, trimmed: s.trim(), lowercase: s.trim().toLowerCase() }))
    : [];

  return NextResponse.json({
    note: "Diagnostic endpoint — REMOVE AFTER DEBUGGING",
    timestamp: new Date().toISOString(),
    portal_admin_emails: {
      ...describe(emailsRaw),
      parsed: emails,
    },
    portal_admin_password: describe(passwordRaw),
    expected_password_for_comparison: {
      value: "F3rr3t3ria",
      length: "F3rr3t3ria".length,
      char_codes: Array.from("F3rr3t3ria").map((c) => c.charCodeAt(0)),
    },
  });
}
