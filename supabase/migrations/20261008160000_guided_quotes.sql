-- Campos de la solicitud guiada de cotización (rangos, no precios).
alter table public.quotes add column if not exists quote_source text;
alter table public.quotes add column if not exists guided_quote jsonb;
