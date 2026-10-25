-- ============================================================
-- 0010 — Cuentas para pagar por transferencia
-- Los datos bancarios viven en la base (no en el repo, que es público).
-- RLS: los usuarios logueados ven las cuentas activas; solo el admin gestiona.
-- ============================================================

create table public.transfer_accounts (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,                          -- p. ej. "Mercado Pago", "Transferencia SEPA"
  currency    text not null check (currency in ('ARS','EUR')),
  details     text not null,                          -- alias, CBU/CVU, IBAN, titular… (texto libre)
  position    int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.transfer_accounts enable row level security;

create policy "transfer_accounts: logueados leen activas" on public.transfer_accounts for select
  to authenticated using (is_active or public.is_admin());
create policy "transfer_accounts: admin gestiona" on public.transfer_accounts for all
  using (public.is_admin()) with check (public.is_admin());
