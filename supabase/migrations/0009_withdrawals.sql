-- ============================================================
-- 0009 — Botón de arrepentimiento (Res. SCI 424/2020)
-- Solicitudes de revocación de la contratación dentro de los 10 días.
-- Se cargan sin registro desde un formulario público: el servidor valida y
-- guarda con service_role. RLS: solo el admin lee y gestiona.
-- ============================================================

create table public.withdrawal_requests (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,                 -- código que se entrega al solicitante
  full_name     text not null,
  email         text not null,
  phone         text,
  contract_date date not null,
  details       text not null default '',
  status        text not null default 'pending' check (status in ('pending','processed','rejected')),
  admin_notes   text not null default '',
  created_at    timestamptz not null default now(),
  processed_at  timestamptz,
  processed_by  uuid references public.profiles(id)
);
create index withdrawals_status_idx on public.withdrawal_requests (status, created_at desc);

alter table public.withdrawal_requests enable row level security;

create policy "withdrawals: admin lee" on public.withdrawal_requests for select
  using (public.is_admin());
create policy "withdrawals: admin gestiona" on public.withdrawal_requests for update
  using (public.is_admin()) with check (public.is_admin());
