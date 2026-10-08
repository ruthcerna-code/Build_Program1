-- Contraseñas de cuentas internas creadas en administración.
-- La administradora principal no se guarda aquí: se valida en el servidor.

alter table public.internal_users add column if not exists password_hash text;
