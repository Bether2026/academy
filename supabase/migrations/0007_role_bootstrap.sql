-- ============================================================
-- 0007 — Permitir crear el primer admin
-- guard_role_change (0001) exigía un admin para cambiar roles, incluso desde
-- el SQL Editor o con service_role: nunca se podía crear el primero.
-- Ahora también pueden cambiar roles el service_role y las sesiones directas
-- a la base (sin JWT: SQL Editor), que ya tienen control total. Para usuarios
-- de la app (anon/authenticated) la regla no cambia: solo un admin.
-- ============================================================

create or replace function public.guard_role_change()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role
     and not public.is_admin()
     and coalesce(auth.role(), '') <> 'service_role'
     and auth.jwt() is not null
  then
    raise exception 'Solo un administrador puede cambiar roles';
  end if;
  return new;
end $$;
