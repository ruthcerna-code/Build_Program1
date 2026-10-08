# Configuración de Nydo Mallas

La administradora principal es **ruth.cerna@gmail.com**. El registro público nunca crea otra cuenta administradora.

## Variables en Vercel (Production y Preview)

Agrega estas claves en **Settings → Environment Variables**:

| Variable | Dónde | Para qué |
|---|---|---|
| `VITE_SUPABASE_URL` | Cliente | Conectar el navegador a Supabase |
| `VITE_SUPABASE_ANON_KEY` | Cliente | Crear cotizaciones públicas |
| `SUPABASE_URL` | Servidor | Igual que la URL de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor (Secret) | Consultar y guardar cotizaciones, ventas y equipo |
| `GOOGLE_CLIENT_ID` | Servidor | Validar el ingreso con Google |
| `VITE_GOOGLE_CLIENT_ID` | Cliente | Mostrar el botón de Google (mismo valor) |
| `SESSION_SECRET` | Servidor (Secret) | Firmar la sesión. Usa un texto largo al azar |
| `ADMIN_EMAIL` | Servidor | `ruth.cerna@gmail.com` |
| `CONTACT_TO_EMAIL` | Servidor | `nydo.mallas@gmail.com` |
| `RESEND_API_KEY` | Servidor (Secret) | Envío real de Contáctanos |
| `MAIL_FROM` | Servidor | Remitente autorizado en Resend |

## Pasos

1. En [Google Cloud](https://console.cloud.google.com/) crea un ID de cliente OAuth (aplicación web).
2. Autoriza orígenes: `http://localhost:3000` y `https://build-program1.vercel.app` (y tu dominio).
3. En Supabase → SQL, ejecuta las migraciones de la carpeta `supabase/migrations`.
4. Copia la **service_role** (no la anon) a `SUPABASE_SERVICE_ROLE_KEY`.
5. Crea una API key en [Resend](https://resend.com) y un remitente verificado para `MAIL_FROM`.
6. Vuelve a publicar (`vercel --prod` o Redeploy).

## Qué no está operativo sin esas claves

- Ingreso con Google: falta `GOOGLE_CLIENT_ID`.
- Sincronizar datos, equipo y ventas desde el servidor: falta `SUPABASE_SERVICE_ROLE_KEY`.
- Contáctanos con envío real: falta `RESEND_API_KEY`.

No se muestra como exitoso un envío o un login que el servidor no pudo completar.
