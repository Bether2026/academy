-- ============================================================
-- 0011 — Datos bancarios privados
-- El alumno ya no ve los datos de las cuentas: solo el nombre de cada
-- medio y, si existe, un link de pago. Los datos los pide por WhatsApp.
-- El servidor arma esa vista reducida con service_role.
-- ============================================================

alter table public.transfer_accounts add column pay_url text;

drop policy "transfer_accounts: logueados leen activas" on public.transfer_accounts;
