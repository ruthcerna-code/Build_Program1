-- Reemplaza las tarifas referenciales vigentes. Si la fila ya existe, actualiza monto y etiqueta.
insert into public.pricing_rates (id, kind, label, unit, amount, sort, active) values
  ('mesh_06', 'mesh', 'Malla de 0,6 mm', 'metro lineal', 6500, 1, true),
  ('mesh_07', 'mesh', 'Malla de 0,7 mm', 'metro lineal', 7200, 2, true),
  ('mesh_08', 'mesh', 'Malla de 0,8 mm', 'metro lineal', 7500, 3, true),
  ('mesh_09', 'mesh', 'Malla de 0,9 mm', 'metro lineal', 8800, 4, true),
  ('pillar', 'pillar', 'Pilar adicional', 'unidad', 12000, 10, true),
  ('deposit', 'deposit', 'Abono inicial', 'porcentaje', 30, 20, true)
on conflict (id) do update set
  kind = excluded.kind,
  label = excluded.label,
  unit = excluded.unit,
  amount = excluded.amount,
  sort = excluded.sort,
  active = true;
