-- ============================================================
-- 0004 — Catálogo de planes por categoría y frecuencia
-- Clases (adultos / kids) y preparación de exámenes internacionales,
-- 1 a 3 veces por semana. Precios mensuales en EUR y ARS (euro oficial BNA,
-- billete venta $1.765 al 09/10/2026, redondeado a miles). Los ARS se
-- actualizan a mano desde el panel admin.
-- RLS: la tabla plans ya tiene RLS (0002); las columnas nuevas quedan cubiertas
-- por las mismas políticas (lectura pública, escritura solo admin).
-- ============================================================

create type public.plan_category as enum ('adults','kids','exam');

alter table public.plans
  add column category          public.plan_category not null default 'adults',
  add column track             text,      -- examen o programa: B1, B2, C1, C2, IELTS, APTIS, CAMBRIDGE
  add column sessions_per_week smallint check (sessions_per_week between 1 and 7);

-- Planes de lanzamiento: se desactivan (no se borran: pueden tener suscripciones)
update public.plans set is_active = false where name in ('Despegue', 'Vuelo');

insert into public.plans
  (name, description, price, currency, billing_interval, classes_per_period, category, track, sessions_per_week)
select
  v.name, v.description, p.price, p.currency, 'monthly'::public.billing_interval, v.spw * 4, v.category::public.plan_category, v.track, v.spw
from (values
  -- name,                             description,                                         category, track,       spw, eur,  ars
  ('Adultos · 1 vez por semana',   'Clases individuales de inglés para adultos',             'adults', null,        1,  80, 141000),
  ('Adultos · 2 veces por semana', 'Clases individuales de inglés para adultos',             'adults', null,        2, 110, 194000),
  ('Adultos · 3 veces por semana', 'Clases individuales de inglés para adultos',             'adults', null,        3, 150, 265000),
  ('Kids · 2 veces por semana',    'Clases de inglés para chicos',                           'kids',   null,        2,  90, 159000),
  ('Kids · Cambridge',             'Preparación de exámenes de Cambridge para chicos',       'kids',   'CAMBRIDGE', 2, 100, 177000),
  ('B1 · 1 vez por semana',        'Preparación del examen internacional B1',                'exam',   'B1',        1,  90, 159000),
  ('B1 · 2 veces por semana',      'Preparación del examen internacional B1',                'exam',   'B1',        2, 125, 221000),
  ('B1 · 3 veces por semana',      'Preparación del examen internacional B1',                'exam',   'B1',        3, 160, 282000),
  ('B2 · 1 vez por semana',        'Preparación del examen internacional B2',                'exam',   'B2',        1,  90, 159000),
  ('B2 · 2 veces por semana',      'Preparación del examen internacional B2',                'exam',   'B2',        2, 125, 221000),
  ('B2 · 3 veces por semana',      'Preparación del examen internacional B2',                'exam',   'B2',        3, 160, 282000),
  ('C1 · 1 vez por semana',        'Preparación del examen internacional C1',                'exam',   'C1',        1,  90, 159000),
  ('C1 · 2 veces por semana',      'Preparación del examen internacional C1',                'exam',   'C1',        2, 125, 221000),
  ('C1 · 3 veces por semana',      'Preparación del examen internacional C1',                'exam',   'C1',        3, 160, 282000),
  ('C2 · 1 vez por semana',        'Preparación del examen internacional C2',                'exam',   'C2',        1,  99, 175000),
  ('C2 · 2 veces por semana',      'Preparación del examen internacional C2',                'exam',   'C2',        2, 135, 238000),
  ('C2 · 3 veces por semana',      'Preparación del examen internacional C2',                'exam',   'C2',        3, 175, 309000),
  ('IELTS · 1 vez por semana',     'Preparación del examen IELTS',                           'exam',   'IELTS',     1,  90, 159000),
  ('IELTS · 2 veces por semana',   'Preparación del examen IELTS',                           'exam',   'IELTS',     2, 125, 221000),
  ('IELTS · 3 veces por semana',   'Preparación del examen IELTS',                           'exam',   'IELTS',     3, 160, 282000),
  ('APTIS · 1 vez por semana',     'Preparación del examen APTIS',                           'exam',   'APTIS',     1,  90, 159000),
  ('APTIS · 2 veces por semana',   'Preparación del examen APTIS',                           'exam',   'APTIS',     2, 125, 221000),
  ('APTIS · 3 veces por semana',   'Preparación del examen APTIS',                           'exam',   'APTIS',     3, 160, 282000)
) as v(name, description, category, track, spw, eur, ars)
cross join lateral (values (v.eur::numeric, 'EUR'), (v.ars::numeric, 'ARS')) as p(price, currency);
