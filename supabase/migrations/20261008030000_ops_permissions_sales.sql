-- Cotizaciones: baja lógica, dueño, historial y pagos reales.
-- Conserva filas existentes. No borra datos.

alter table public.quotes add column if not exists deleted_at timestamptz;
alter table public.quotes add column if not exists owner_email text;
alter table public.quotes add column if not exists change_history jsonb default '[]'::jsonb;
alter table public.quotes add column if not exists payments jsonb default '[]'::jsonb;

update public.quotes
set owner_email = lower(client_email)
where owner_email is null and client_email is not null;

create index if not exists idx_quotes_deleted_at on public.quotes(deleted_at);
create index if not exists idx_quotes_owner_email on public.quotes(owner_email);

create table if not exists public.quote_payments (
  id text primary key,
  quote_id text not null references public.quotes(id) on delete cascade,
  amount numeric not null check (amount > 0),
  method text,
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  created_by text
);

create index if not exists idx_quote_payments_quote_id on public.quote_payments(quote_id);

create table if not exists public.internal_users (
  id text primary key,
  email text not null unique,
  full_name text not null,
  active boolean not null default true,
  can_view_quotes boolean not null default true,
  can_edit_quotes boolean not null default false,
  can_delete_quotes boolean not null default false,
  can_view_sales boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  created_by text,
  updated_at timestamptz
);

create index if not exists idx_internal_users_email on public.internal_users(email);

create table if not exists public.contact_messages (
  id text primary key,
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  delivered boolean default false
);

alter table public.quote_payments enable row level security;
alter table public.internal_users enable row level security;
alter table public.contact_messages enable row level security;

revoke all on table public.quote_payments from anon, authenticated;
revoke all on table public.internal_users from anon, authenticated;
revoke all on table public.contact_messages from anon, authenticated;

-- El cliente anónimo solo crea cotizaciones nuevas (flujo público).
-- Lectura, cambios, pagos y usuarios internos se hacen desde el servidor (service role).
grant insert on table public.quotes to anon;
