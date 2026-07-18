-- ============================================================
-- 0001 — Identidad: extensiones, enums, profiles, triggers base
-- Ver docs/01-modelo-de-datos.md
-- ============================================================

create extension if not exists btree_gist;

-- ---------- Enums ----------
create type public.user_role         as enum ('student','teacher','admin','super_admin');
create type public.cefr_level        as enum ('A1','A2','B1','B2','C1','C2');
create type public.class_status      as enum ('scheduled','confirmed','completed','cancelled','no_show','rescheduled');
create type public.cancelled_by      as enum ('student','teacher','admin','system');
create type public.assignment_status as enum ('pending','submitted','reviewed','overdue');
create type public.progress_category as enum ('speaking','listening','reading','writing','grammar','vocabulary','pronunciation');
create type public.material_type     as enum ('document','video','audio','link','exercise');
create type public.payment_provider  as enum ('mercadopago','stripe');
create type public.subscription_status as enum ('active','past_due','cancelled','expired','trial');
create type public.payment_status    as enum ('approved','pending','rejected','refunded');
create type public.billing_interval  as enum ('monthly','quarterly','yearly');

-- ---------- updated_at automático ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- profiles (1:1 con auth.users) ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        public.user_role not null default 'student',
  first_name  text not null default '',
  last_name   text not null default '',
  email       text not null,
  phone       text,
  avatar_url  text,
  country     text not null default 'AR',   -- ISO-3166-1 alpha-2
  timezone    text not null default 'America/Argentina/Buenos_Aires', -- IANA
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil al registrarse (lee metadata enviada por el formulario)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, country, timezone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'country', 'AR'),
    coalesce(new.raw_user_meta_data->>'timezone', 'America/Argentina/Buenos_Aires')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Sincroniza el rol al JWT (app_metadata) para que RLS no consulte tablas.
-- El cambio impacta en el próximo refresh del token.
create or replace function public.sync_role_to_jwt()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update auth.users
  set raw_app_meta_data = jsonb_set(
    coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb(new.role::text)
  )
  where id = new.id;
  return new;
end $$;

create trigger on_profile_role_sync
  after insert or update of role on public.profiles
  for each row execute function public.sync_role_to_jwt();

-- ---------- Helpers para RLS (leen el JWT, nunca tablas → sin recursión) ----------
create or replace function public.jwt_role()
returns text language sql stable
as $$ select coalesce(auth.jwt()->'app_metadata'->>'role', '') $$;

create or replace function public.is_admin()
returns boolean language sql stable
as $$ select public.jwt_role() in ('admin','super_admin') $$;

-- Nadie salvo admin cambia roles (defensa además de la política RLS)
create or replace function public.guard_role_change()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar roles';
  end if;
  return new;
end $$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_role_change();

-- ---------- RLS de profiles ----------
alter table public.profiles enable row level security;

create policy "profiles: ver propio o admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles: editar propio o admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- INSERT solo vía trigger handle_new_user (security definer); DELETE: nadie.
