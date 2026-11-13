-- Tarifas referenciales del cotizador, editables por la administradora desde el panel (Tarifas).
-- Si una fila ya existe no se sobrescribe, para no perder cambios hechos en el panel.

create table if not exists public.pricing_rates (
  id text primary key,
  kind text not null check (kind in ('mesh', 'pillar', 'deposit')),
  label text not null,
  unit text not null,
  amount numeric not null check (amount >= 0),
  sort integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default timezone('utc'::text, now()),
  updated_by text
);

insert into public.pricing_rates (id, kind, label, unit, amount, sort) values
  ('mesh_06', 'mesh', 'Malla de 0,6 mm', 'metro lineal', 6500, 1),
  ('mesh_07', 'mesh', 'Malla de 0,7 mm', 'metro lineal', 7200, 2),
  ('mesh_08', 'mesh', 'Malla de 0,8 mm', 'metro lineal', 7500, 3),
  ('mesh_09', 'mesh', 'Malla de 0,9 mm', 'metro lineal', 8800, 4),
  ('pillar', 'pillar', 'Pilar adicional', 'unidad', 12000, 10),
  ('deposit', 'deposit', 'Abono inicial', 'porcentaje', 30, 20)
on conflict (id) do nothing;

alter table public.pricing_rates enable row level security;
revoke all on table public.pricing_rates from anon, authenticated;
