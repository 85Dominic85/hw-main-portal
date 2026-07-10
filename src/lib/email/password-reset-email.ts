/**
 * Plantilla del email de restablecimiento de contraseña.
 * HTML inline (los clientes de correo no soportan <style> externos ni clases).
 */

export function passwordResetEmail(resetUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Restablece tu contraseña — HW Main Portal";

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="padding:28px 32px 8px;">
                <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:15px;color:#71717a;letter-spacing:-0.02em;">Qamarero / HW</p>
                <h1 style="margin:12px 0 0;font-size:20px;color:#18181b;">Restablece tu contraseña</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px;">
                <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#3f3f46;">
                  Has solicitado restablecer la contraseña de tu cuenta del HW Main Portal.
                  Pulsa el botón para elegir una nueva. El enlace caduca en <strong>30 minutos</strong>.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="border-radius:8px;background:#18181b;">
                      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
                        Restablecer contraseña
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#71717a;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:
                </p>
                <p style="margin:0 0 20px;font-size:12px;line-height:1.6;word-break:break-all;">
                  <a href="${resetUrl}" style="color:#2563eb;">${resetUrl}</a>
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;">
                  Si no has solicitado este cambio, ignora este correo: tu contraseña seguirá siendo la misma.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "Restablece tu contraseña — HW Main Portal",
    "",
    "Has solicitado restablecer la contraseña de tu cuenta del HW Main Portal.",
    "Abre este enlace para elegir una nueva (caduca en 30 minutos):",
    "",
    resetUrl,
    "",
    "Si no has solicitado este cambio, ignora este correo.",
  ].join("\n");

  return { subject, html, text };
}
