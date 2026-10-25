-- ============================================================
-- 0008 — Biblioteca de materiales
-- Material organizado por nivel/unidad. Las guías del profesor (audience
-- 'teacher') nunca son visibles para alumnos. El material de alumno se ve solo
-- si fue compartido con ese alumno o con su nivel (material_shares).
-- Los archivos (bucket privado 'materials') ya no se leen directo: el servidor
-- verifica permisos con RLS y entrega un link firmado de corta duración.
-- ============================================================

-- ---------- learning_materials: campos de biblioteca ----------
alter table public.learning_materials
  add column unit      smallint,                          -- null = material general del nivel
  add column audience  text not null default 'student' check (audience in ('student','teacher')),
  add column file_path text,                              -- ruta en el bucket 'materials'
  alter column url drop not null,
  add constraint materials_url_or_file check (url is not null or file_path is not null);

create index materials_level_unit_idx on public.learning_materials (level, unit);

-- ---------- material_shares ----------
create table public.material_shares (
  id          uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.learning_materials(id) on delete cascade,
  student_id  uuid references public.students(id) on delete cascade,
  level       public.cefr_level,
  shared_by   uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  check ((student_id is null) <> (level is null))          -- o un alumno o un nivel
);
create unique index shares_student_uniq on public.material_shares (material_id, student_id) where student_id is not null;
create unique index shares_level_uniq   on public.material_shares (material_id, level)      where level is not null;
create index shares_student_idx on public.material_shares (student_id);

alter table public.material_shares enable row level security;

-- Material compartido con el alumno logueado o con su nivel
create or replace function public.material_shared_with_me(mid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from material_shares sh
    join students s on s.profile_id = auth.uid()
    where sh.material_id = mid
      and (sh.student_id = s.id or sh.level = s.current_level)
  )
$$;

create or replace function public.is_staff() returns boolean language sql stable as $$ select public.jwt_role() in ('teacher','admin','super_admin') $$;

-- ---------- RLS learning_materials (reemplaza la lectura por "publicado") ----------
drop policy if exists "materials: publicados para autenticados" on public.learning_materials;

create policy "materials: staff lee todo" on public.learning_materials for select
  using (public.is_staff());
create policy "materials: alumno lee compartidos" on public.learning_materials for select
  using (audience = 'student' and public.material_shared_with_me(id));

-- ---------- RLS material_shares ----------
create policy "shares: staff lee" on public.material_shares for select
  using (public.is_staff());
create policy "shares: alumno lee los suyos" on public.material_shares for select
  using (student_id = public.current_student_id());
-- Admin comparte con cualquiera; un profesor, con sus alumnos asignados o con un nivel completo.
create policy "shares: staff crea" on public.material_shares for insert
  with check (
    shared_by = auth.uid()
    -- las guías del profesor nunca se comparten con alumnos
    and exists (select 1 from public.learning_materials m where m.id = material_id and m.audience = 'student')
    and (public.is_admin()
         or (public.jwt_role() = 'teacher' and (student_id is null or public.teaches_student(student_id))))
  );
create policy "shares: staff borra" on public.material_shares for delete
  using (public.is_admin() or shared_by = auth.uid());

-- ---------- Storage: el bucket deja de ser legible por cualquier autenticado ----------
drop policy if exists "materials: lectura autenticada" on storage.objects;
create policy "materials: staff lee" on storage.objects for select
  using (bucket_id = 'materials' and public.is_staff());
create policy "materials: staff borra" on storage.objects for delete
  using (bucket_id = 'materials' and public.is_staff());
