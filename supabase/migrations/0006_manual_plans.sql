-- ============================================================
-- 0006 — Planes activados a mano por la academia
-- Pagos en efectivo/transferencia y cortesías (clase de prueba, becas).
-- Cada mes activado es una fila de subscriptions con provider 'manual' y
-- cancel_at_period_end = true (no se renueva solo: el admin registra cada mes).
-- RLS: subscriptions y payments ya tienen RLS (0002) con lectura para el alumno
-- dueño y el admin. Se agregan altas/ediciones SOLO para admin; los webhooks
-- siguen escribiendo con service_role.
-- ============================================================

alter type public.payment_provider add value if not exists 'manual';

create policy "subscriptions: admin crea" on public.subscriptions for insert
  with check (public.is_admin());
create policy "subscriptions: admin edita" on public.subscriptions for update
  using (public.is_admin()) with check (public.is_admin());
create policy "payments: admin crea" on public.payments for insert
  with check (public.is_admin());
