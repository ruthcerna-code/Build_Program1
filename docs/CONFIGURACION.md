# Configuración de Nydo Mallas

La administradora principal es **ruth.cerna@gmail.com** (clave local por defecto `123456`). El registro público no crea otra cuenta administradora.

El ingreso de equipo es **correo + contraseña**. Ya no se usa Google para entrar.

## Variables en Vercel (Production y Preview)

Cópialas desde `.env.local` (no subas ese archivo a git). En Vercel: **Settings → Environment Variables**. Marca **Production** y **Preview**. Las que empiezan con `VITE_` también se usan en el **build**; después de agregarlas hay que **Redeploy**.

| Variable | Obligatoria | Valor |
|---|---|---|
| `VITE_SUPABASE_URL` | Sí | Misma URL de Supabase que en develop |
| `VITE_SUPABASE_ANON_KEY` | Sí | Misma `anon` / publishable que en develop |
| `SUPABASE_URL` | Sí | Igual que `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí (Secret) | `service_role` de Supabase, no la anon |
| `SESSION_SECRET` | Sí (Secret) | El mismo texto largo de `.env.local` (mínimo 16 caracteres) |
| `ADMIN_EMAIL` | Sí | `ruth.cerna@gmail.com` |
| `ADMIN_PASSWORD` | Recomendada | La misma clave con la que entras en local (`123456` si no cambiaste nada) |
| `CONTACT_TO_EMAIL` | Sí | `nydo.mallas@gmail.com` |
| `QUOTE_COPY_EMAIL` | Sí | `nydo.mallas@gmail.com` |
| `FORMSUBMIT_COMPANY_ID` | Sí | El id de FormSubmit ya activado en local |
| `RESEND_API_KEY` | Sí (Secret) | La misma API key de Resend |
| `MAIL_FROM` | Sí | `Nydo Mallas <onboarding@resend.dev>` (hasta verificar dominio) |
| `APP_URL` | Sí | `https://build-program1.vercel.app` (o tu dominio) |

No hace falta `GOOGLE_CLIENT_ID` ni `VITE_GOOGLE_CLIENT_ID` para que el login y las cotizaciones funcionen como en develop.

`GEMINI_API_KEY` es opcional: el asistente público usa las preguntas frecuentes si no está.

## SQL en Supabase (mismo proyecto que develop)

En **Supabase → SQL → New query**, ejecuta en este orden si aún no están aplicadas (se pueden repetir; usan `if not exists`):

1. `supabase/migrations/20261001220000_init_mallas.sql`
2. `supabase/migrations/20261008030000_ops_permissions_sales.sql`
3. `supabase/migrations/20261008160000_guided_quotes.sql`
4. `supabase/migrations/20261008180000_internal_user_passwords.sql`

Si develop ya usa este mismo proyecto de Supabase, los datos son los mismos. Solo faltan las columnas nuevas si no corriste esos archivos.

## Correo en producción

- FormSubmit se activó para `http://localhost:3000`. En Vercel el origen es otro: la **primera cotización** desde el sitio publicado mandará otra vez **Activate Form**. Hay que pulsar ese botón.
- Resend en modo prueba **solo entrega a** `ruth.cerna@gmail.com`. El cliente genérico no recibe hasta verificar un dominio en [resend.com/domains](https://resend.com/domains) y cambiar `MAIL_FROM` a un correo de ese dominio.

## Después de cargar las variables

1. **Redeploy** de Production (o `npx vercel --prod`).
2. Entra con `ruth.cerna@gmail.com` y la misma clave de local.
3. Envía una cotización de prueba y confirma **Activate Form** si llega el aviso.
4. Revisa `nydo.mallas@gmail.com` (también spam).
