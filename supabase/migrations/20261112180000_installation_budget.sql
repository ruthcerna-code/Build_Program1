-- Parámetros de costo de la instalación. El margen no vive en esta tabla.
-- Si una fila ya existe no se sobrescribe, para no perder cambios del panel.

create table if not exists public.parametros_costo (
  clave text primary key,
  nombre text not null,
  valor numeric not null,
  unidad text not null,
  estado text not null,
  actualizado_por text,
  actualizado_en timestamptz not null default timezone('utc'::text, now())
);

insert into public.parametros_costo (clave, nombre, valor, unidad, estado) values
  ('malla_06', 'Malla 0,6 mm', 440, '$ por m²', 'Promedio mercado'),
  ('perdida_malla', 'Pérdida de malla', 20, '%', 'Supuesto'),
  ('fijaciones', 'Fijaciones (perfil, tornillos, tarugos, alambre)', 1125, '$ por metro de contorno', 'Estimado'),
  ('pilar', 'Pilar de aluminio', 5000, '$ por unidad', 'Por confirmar'),
  ('mano_obra', 'Mano de obra', 20000, '$ por trabajo', 'Por confirmar'),
  ('traslado', 'Traslado', 8000, '$ por trabajo', 'Por confirmar'),
  ('reserva', 'Reserva garantía y consumibles', 5, '% del subtotal', 'Supuesto'),
  ('minimo_trabajo', 'Mínimo por trabajo', 60000, '$ con IVA', 'Por definir'),
  ('iva', 'IVA', 19, '%', 'Fijo'),
  ('redondeo', 'Redondeo del total', 1000, '$ (hacia arriba)', 'Definido')
on conflict (clave) do nothing;

alter table public.parametros_costo enable row level security;
revoke all on table public.parametros_costo from anon, authenticated;

create table if not exists public.configuracion_comercial (
  clave text primary key,
  valor numeric not null,
  unidad text not null,
  descripcion text not null,
  actualizado_por text,
  actualizado_en timestamptz not null default timezone('utc'::text, now())
);

insert into public.configuracion_comercial (clave, valor, unidad, descripcion, actualizado_por) values
  (
    'margen_objetivo',
    30,
    '%',
    'Porcentaje del precio de venta que queda como margen. No es un recargo sobre el costo.',
    'sistema'
  )
on conflict (clave) do nothing;

alter table public.configuracion_comercial enable row level security;
revoke all on table public.configuracion_comercial from anon, authenticated;

create table if not exists public.configuracion_comercial_historial (
  id bigint generated always as identity primary key,
  clave text not null,
  valor_anterior numeric,
  valor_nuevo numeric not null,
  unidad text,
  actualizado_por text not null,
  actualizado_en timestamptz not null default timezone('utc'::text, now())
);

alter table public.configuracion_comercial_historial enable row level security;
revoke all on table public.configuracion_comercial_historial from anon, authenticated;
