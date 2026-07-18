-- Datos de desarrollo: planes iniciales (un plan por moneda, ver docs/00-arquitectura.md)
insert into public.plans (name, description, price, currency, billing_interval, classes_per_period) values
  ('Despegue',  '4 clases individuales por mes con tu profesor asignado', 48000, 'ARS', 'monthly', 4),
  ('Vuelo',     '8 clases individuales por mes + seguimiento intensivo',  88000, 'ARS', 'monthly', 8),
  ('Despegue',  '4 clases individuales por mes con tu profesor asignado',    59, 'EUR', 'monthly', 4),
  ('Vuelo',     '8 clases individuales por mes + seguimiento intensivo',    109, 'EUR', 'monthly', 8);
