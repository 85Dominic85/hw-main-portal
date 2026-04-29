# ADR-0002: Supabase Auth con magic link (no Google Workspace SSO)

## Estado
Aceptado — 2026-04-28.

## Contexto

El portal necesita autenticación. La audiencia es:
- 3 admins que gestionan datos propios y exportan: jj.gallego@qamarero.com, guillermo.mateos@qamarero.com, domingo.bueno@qamarero.com.
- Resto del dpto (`@qamarero.com`) como viewers.

Las 3 herramientas existentes usan auths distintas:
- HSM: NextAuth v5 con credenciales propias (sin Google).
- MainOPS: Google Workspace `@qamarero.com` (Supabase Auth + Google OAuth).
- HW Tool: Supabase Auth (session-based).

## Decisión

Usar **Supabase Auth con magic link** + allowlist `@qamarero.com` en el callback de signup.

- Los 3 admins se identifican por email (lista en env var `PORTAL_ADMIN_EMAILS`).
- Cualquier email `@qamarero.com` puede registrarse como `viewer`.
- El rol vive en `portal_users.role` y se inyecta en el JWT via Supabase Auth Hook para uso en RLS.

## Consecuencias

**Positivas**
- Sin password que mantener — cero superficie de ataque por credenciales débiles.
- Implementación simple: `supabase.auth.signInWithOtp({ email })` y listo.
- Coherente con HW Tool (también Supabase Auth) y compatible con cómo MainOPS gestiona sesiones.
- El usuario propietario del portal lo prefirió explícitamente por simplicidad.

**Negativas**
- No es SSO real con las demás herramientas — un usuario tiene que loguearse en cada una por separado. Aceptable porque el portal es read-only y los saltos son ocasionales.
- Si Google Workspace cambia algo en el dominio, no se refleja automáticamente.
- Magic link puede ser molesto para usuarios que entran muy a menudo (mitigable con sesiones largas).

**Neutras**
- En v2 se podría añadir Google OAuth como segunda opción sin romper magic link (Supabase soporta múltiples providers).

## Alternativas consideradas

### A — Google Workspace SSO via Supabase Auth + Google OAuth (descartada)
Login con cuenta corporativa Google. Coherente con MainOPS.
**Por qué no**: requiere configurar OAuth Client en Google Cloud, registrar redirect URIs, y MainOPS no comparte la app — habría que crear una nueva. El usuario lo descartó por "más fricción al setup".

### B — NextAuth v5 con credenciales propias (como HSM) (descartada)
Tabla de usuarios con email + password.
**Por qué no**: replicar gestión de passwords es responsabilidad innecesaria. Reset, hashing, lockouts. Magic link evita todo eso.

### C — Sin auth — IP whitelist o token de oficina (descartada)
**Por qué no**: el portal contiene métricas sensibles del dpto. Auth real es no negociable. Y el equipo trabaja también desde fuera de la oficina.

## Implementación

- `src/lib/auth/` — Supabase Auth client server/client.
- `src/lib/auth/allowlist.ts` — verificación de dominio en el callback.
- Trigger en Supabase: al insertar en `auth.users`, validar dominio y crear `portal_users` con rol según email.
- Custom JWT claim `role` para RLS.

## Referencias

- [Supabase Auth — Email + OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- ADR-0001 — patrón de conectores (independiente del SSO).
