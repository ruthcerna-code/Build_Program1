-- MallasSeguras: cotizaciones, usuarios de la app y logs de acceso.
-- Pensado para consultas SQL del curso (SELECT / UPDATE / JOIN).

create table if not exists public.quotes (
  id text primary key,
  folio text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  client_name text not null,
  client_rut text,
  client_email text not null,
  client_phone text,
  client_address text,
  client_city text,
  property_type text,
  client_comments text,
  tentative_date1 text,
  tentative_time1 text,
  tentative_date2 text,
  tentative_time2 text,
  total_area_m2 numeric default 0,
  status text not null default 'pendiente',
  accepted_at timestamptz,
  paid_amount numeric,
  payment_status text,
  payment_method text,
  payment_notes text,
  windows jsonb default '[]'::jsonb,
  admin_quote jsonb,
  installer_assignment jsonb,
  technician_execution jsonb,
  email_dispatch jsonb
);

alter table public.quotes add column if not exists client_rut text;
alter table public.quotes add column if not exists paid_amount numeric;
alter table public.quotes add column if not exists payment_status text;
alter table public.quotes add column if not exists payment_method text;
alter table public.quotes add column if not exists payment_notes text;
alter table public.quotes add column if not exists email_dispatch jsonb;

create index if not exists idx_quotes_client_email on public.quotes(client_email);
create index if not exists idx_quotes_client_rut on public.quotes(client_rut);
create index if not exists idx_quotes_status on public.quotes(status);
create index if not exists idx_quotes_folio on public.quotes(folio);

create table if not exists public.app_users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  role text not null default 'cliente',
  rut text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  provisional_password text,
  provisional_password_created_at timestamptz,
  must_change_password boolean default false
);

create index if not exists idx_app_users_email on public.app_users(email);
create index if not exists idx_app_users_role on public.app_users(role);

create table if not exists public.access_logs (
  id text primary key,
  user_id text,
  user_email text not null,
  user_name text,
  role text,
  connected_at timestamptz not null default timezone('utc'::text, now()),
  connectivity_timestamp bigint,
  action text not null,
  action_description text,
  quotes_count integer default 0,
  quote_folios jsonb default '[]'::jsonb,
  device_info text,
  ip_address text
);

create index if not exists idx_access_logs_user_email on public.access_logs(user_email);
create index if not exists idx_access_logs_connected_at on public.access_logs(connected_at desc);

alter table public.quotes enable row level security;
alter table public.app_users enable row level security;
alter table public.access_logs enable row level security;

drop policy if exists "Permitir acceso publico quotes" on public.quotes;
drop policy if exists "Permitir acceso publico app_users" on public.app_users;
drop policy if exists "Permitir acceso publico access_logs" on public.access_logs;

revoke all on table public.quotes from anon, authenticated;
revoke all on table public.app_users from anon, authenticated;
revoke all on table public.access_logs from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant insert on table public.quotes to anon;
grant select, insert, update on table public.quotes to authenticated;

drop policy if exists "anon_insert_quotes" on public.quotes;
create policy "anon_insert_quotes" on public.quotes
  for insert
  to anon
  with check (
    client_email is not null
    and position('@' in client_email) > 1
  );

drop policy if exists "authenticated_select_own_quotes" on public.quotes;
create policy "authenticated_select_own_quotes" on public.quotes
  for select
  to authenticated
  using (lower(client_email) = lower(coalesce(auth.email(), '')));

drop policy if exists "authenticated_insert_own_quotes" on public.quotes;
create policy "authenticated_insert_own_quotes" on public.quotes
  for insert
  to authenticated
  with check (lower(client_email) = lower(coalesce(auth.email(), '')));

drop policy if exists "authenticated_update_own_quotes" on public.quotes;
create policy "authenticated_update_own_quotes" on public.quotes
  for update
  to authenticated
  using (lower(client_email) = lower(coalesce(auth.email(), '')))
  with check (lower(client_email) = lower(coalesce(auth.email(), '')));

-- app_users y access_logs: sin GRANT ni políticas para anon/authenticated.
-- El visitante no puede leer ni escribir esas tablas.
