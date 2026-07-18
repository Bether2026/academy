-- ============================================================
-- 0002 — Dominio: académico + comercial + RLS completo
-- Ver docs/01-modelo-de-datos.md (matriz de acceso en §5)
-- ============================================================

-- ---------- Tablas académicas ----------

create table public.teachers (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null unique references public.profiles(id) on delete cascade,
  bio         text not null default '',
  specialties text[] not null default '{}',
  languages   text[] not null default '{}',
  hourly_rate numeric(10,2),                -- informativo v1; NUNCA visible al alumno
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.students (
  id                   uuid primary key default gen_random_uuid(),
  profile_id           uuid not null unique references public.profiles(id) on delete cascade,
  current_level        public.cefr_level,
  target_level         public.cefr_level,
  learning_goal        text,
  preferred_language   text not null default 'es',
  onboarding_completed boolean not null default false,
  assigned_teacher_id  uuid references public.teachers(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index students_assigned_teacher_idx on public.students (assigned_teacher_id);

create table public.student_level_history (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students(id) on delete cascade,
  level        public.cefr_level not null,
  evaluated_at timestamptz not null default now(),
  source       text not null,               -- 'placement_test' | 'teacher_assessment'
  notes        text
);
create index slh_student_idx on public.student_level_history (student_id);

create table public.classes (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references public.students(id),
  teacher_id          uuid not null references public.teachers(id),
  scheduled_at        timestamptz not null,  -- SIEMPRE UTC
  duration_minutes    int not null default 50 check (duration_minutes > 0),
  status              public.class_status not null default 'scheduled',
  meeting_url         text,
  teacher_notes       text,                  -- PRIVADA: el alumno lee vía classes_student
  student_feedback    text,
  cancelled_by        public.cancelled_by,
  cancellation_reason text,
  rescheduled_from_id uuid references public.classes(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index classes_student_idx  on public.classes (student_id, scheduled_at);
create index classes_teacher_idx  on public.classes (teacher_id, scheduled_at);

-- Garantía física contra doble reserva de un profesor
alter table public.classes add constraint no_teacher_overlap
  exclude using gist (
    teacher_id with =,
    tstzrange(scheduled_at, scheduled_at + make_interval(mins => duration_minutes)) with &&
  ) where (status in ('scheduled','confirmed'));

create table public.teacher_availability (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.teachers(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time  time not null,                 -- en la TZ del profesor (ver docs)
  end_time    time not null,
  is_active   boolean not null default true,
  check (start_time < end_time)
);
create index availability_teacher_idx on public.teacher_availability (teacher_id);

create table public.learning_materials (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null default '',
  type         public.material_type not null,
  url          text not null,
  level        public.cefr_level,            -- null = todos los niveles
  created_by   uuid not null references public.profiles(id),
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.assignments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(id) on delete cascade,
  teacher_id  uuid not null references public.teachers(id),
  title       text not null,
  description text not null default '',
  due_date    timestamptz,
  status      public.assignment_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index assignments_student_idx on public.assignments (student_id);
create index assignments_teacher_idx on public.assignments (teacher_id);

create table public.progress_records (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id),
  category   public.progress_category not null,
  score      smallint not null check (score between 0 and 100),
  notes      text,
  created_at timestamptz not null default now()
);
create index progress_student_idx on public.progress_records (student_id);

-- ---------- Tablas comerciales ----------

create table public.plans (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  description        text not null default '',
  price              numeric(10,2) not null,
  currency           char(3) not null,        -- 'ARS' | 'EUR'
  billing_interval   public.billing_interval not null default 'monthly',
  classes_per_period int not null,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  student_id               uuid not null references public.students(id),
  plan_id                  uuid not null references public.plans(id),
  provider                 public.payment_provider not null,
  external_subscription_id text not null,
  status                   public.subscription_status not null,
  current_period_start     timestamptz not null,
  current_period_end       timestamptz not null,
  cancel_at_period_end     boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (provider, external_subscription_id)
);
create index subscriptions_student_idx on public.subscriptions (student_id);

create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references public.students(id),
  subscription_id     uuid references public.subscriptions(id),
  provider            public.payment_provider not null,
  external_payment_id text not null,
  amount              numeric(10,2) not null,
  currency            char(3) not null,
  status              public.payment_status not null,
  paid_at             timestamptz,
  created_at          timestamptz not null default now(),
  unique (provider, external_payment_id)
);
create index payments_student_idx on public.payments (student_id);

create table public.webhook_events (
  id           uuid primary key default gen_random_uuid(),
  provider     public.payment_provider not null,
  event_id     text not null,
  event_type   text not null,
  payload      jsonb not null,
  processed_at timestamptz,
  error        text,
  created_at   timestamptz not null default now(),
  unique (provider, event_id)                -- idempotencia
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  message    text not null default '',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, read_at);

-- updated_at en todas las tablas que lo tienen
do $$
declare t text;
begin
  foreach t in array array['teachers','students','classes','learning_materials','assignments','plans','subscriptions']
  loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------- Helpers de identidad (SECURITY DEFINER → sin recursión RLS) ----------

create or replace function public.current_student_id()
returns uuid language sql stable
security definer set search_path = public
as $$ select id from students where profile_id = auth.uid() $$;

create or replace function public.current_teacher_id()
returns uuid language sql stable
security definer set search_path = public
as $$ select id from teachers where profile_id = auth.uid() $$;

-- ¿El alumno X está asignado al profesor logueado?
create or replace function public.teaches_student(sid uuid)
returns boolean language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from students s
    where s.id = sid and s.assigned_teacher_id = public.current_teacher_id()
  )
$$;

-- ---------- RLS ----------
alter table public.teachers              enable row level security;
alter table public.students              enable row level security;
alter table public.student_level_history enable row level security;
alter table public.classes               enable row level security;
alter table public.teacher_availability  enable row level security;
alter table public.learning_materials    enable row level security;
alter table public.assignments           enable row level security;
alter table public.progress_records      enable row level security;
alter table public.plans                 enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.payments              enable row level security;
alter table public.webhook_events        enable row level security;
alter table public.notifications         enable row level security;

-- profiles: el profesor ve los perfiles de sus alumnos (política adicional a 0001)
create policy "profiles: profesor ve perfiles de sus alumnos"
  on public.profiles for select
  using (
    public.jwt_role() = 'teacher'
    and id in (select s.profile_id from public.students s
               where s.assigned_teacher_id = public.current_teacher_id())
  );

-- students
create policy "students: propio"          on public.students for select using (profile_id = auth.uid());
create policy "students: profesor asignado" on public.students for select using (public.teaches_student(id));
create policy "students: admin"           on public.students for all    using (public.is_admin()) with check (public.is_admin());
create policy "students: editar propio"   on public.students for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid() );
create policy "students: crear propio"    on public.students for insert
  with check (profile_id = auth.uid());  -- onboarding

-- teachers (el alumno NO lee la tabla: usa la vista teachers_public sin hourly_rate)
create policy "teachers: propio"  on public.teachers for select using (profile_id = auth.uid());
create policy "teachers: editar propio" on public.teachers for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "teachers: admin"   on public.teachers for all using (public.is_admin()) with check (public.is_admin());

-- student_level_history (inmutable: sin update/delete)
create policy "slh: alumno propio"   on public.student_level_history for select using (student_id = public.current_student_id());
create policy "slh: profesor asignado" on public.student_level_history for select using (public.teaches_student(student_id));
create policy "slh: admin"           on public.student_level_history for select using (public.is_admin());
create policy "slh: inserta profesor asignado" on public.student_level_history for insert
  with check (public.teaches_student(student_id) or public.is_admin());

-- classes: el alumno lee SOLO vía vista classes_student (oculta teacher_notes).
-- Reservas y cancelaciones pasan por el servicio de scheduling (service_role) que
-- valida crédito, disponibilidad y reglas de negocio.
create policy "classes: profesor propias" on public.classes for select using (teacher_id = public.current_teacher_id());
create policy "classes: profesor edita propias" on public.classes for update
  using (teacher_id = public.current_teacher_id())
  with check (teacher_id = public.current_teacher_id());
create policy "classes: admin" on public.classes for all using (public.is_admin()) with check (public.is_admin());

-- teacher_availability
create policy "availability: profesor gestiona propia" on public.teacher_availability for all
  using (teacher_id = public.current_teacher_id())
  with check (teacher_id = public.current_teacher_id());
create policy "availability: alumno ve la de su profesor" on public.teacher_availability for select
  using (teacher_id in (select assigned_teacher_id from public.students where profile_id = auth.uid()));
create policy "availability: admin" on public.teacher_availability for all
  using (public.is_admin()) with check (public.is_admin());

-- learning_materials
create policy "materials: publicados para autenticados" on public.learning_materials for select
  using (is_published or created_by = auth.uid() or public.is_admin());
create policy "materials: crea profesor o admin" on public.learning_materials for insert
  with check (public.jwt_role() in ('teacher','admin','super_admin') and created_by = auth.uid());
create policy "materials: edita autor o admin" on public.learning_materials for update
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());
create policy "materials: borra autor o admin" on public.learning_materials for delete
  using (created_by = auth.uid() or public.is_admin());

-- assignments
create policy "assignments: alumno propias" on public.assignments for select using (student_id = public.current_student_id());
create policy "assignments: profesor propias" on public.assignments for select using (teacher_id = public.current_teacher_id());
create policy "assignments: admin" on public.assignments for select using (public.is_admin());
create policy "assignments: crea profesor asignado" on public.assignments for insert
  with check (teacher_id = public.current_teacher_id() and public.teaches_student(student_id));
create policy "assignments: edita profesor" on public.assignments for update
  using (teacher_id = public.current_teacher_id()) with check (teacher_id = public.current_teacher_id());
create policy "assignments: alumno marca entregada" on public.assignments for update
  using (student_id = public.current_student_id())
  with check (student_id = public.current_student_id());
create policy "assignments: borra profesor" on public.assignments for delete
  using (teacher_id = public.current_teacher_id());

-- El alumno solo puede cambiar status (a 'submitted'); el resto de columnas, no.
create or replace function public.guard_assignment_student_update()
returns trigger language plpgsql as $$
begin
  if public.jwt_role() = 'student' then
    if (new.title, new.description, new.due_date, new.student_id, new.teacher_id)
       is distinct from
       (old.title, old.description, old.due_date, old.student_id, old.teacher_id)
       or new.status not in ('submitted','pending') then
      raise exception 'El alumno solo puede marcar la tarea como entregada';
    end if;
  end if;
  return new;
end $$;
create trigger assignments_guard_student
  before update on public.assignments
  for each row execute function public.guard_assignment_student_update();

-- progress_records
create policy "progress: alumno propios" on public.progress_records for select using (student_id = public.current_student_id());
create policy "progress: profesor de sus alumnos" on public.progress_records for select using (public.teaches_student(student_id));
create policy "progress: admin" on public.progress_records for select using (public.is_admin());
create policy "progress: inserta profesor asignado" on public.progress_records for insert
  with check (teacher_id = public.current_teacher_id() and public.teaches_student(student_id));
create policy "progress: edita autor" on public.progress_records for update
  using (teacher_id = public.current_teacher_id()) with check (teacher_id = public.current_teacher_id());

-- plans: públicos (landing), gestiona admin. No se borran: se desactivan.
create policy "plans: lectura pública" on public.plans for select using (true);
create policy "plans: admin crea"  on public.plans for insert with check (public.is_admin());
create policy "plans: admin edita" on public.plans for update using (public.is_admin()) with check (public.is_admin());

-- subscriptions / payments: lectura del dueño y admin; escritura SOLO service_role (webhooks)
create policy "subscriptions: alumno propias" on public.subscriptions for select using (student_id = public.current_student_id());
create policy "subscriptions: admin" on public.subscriptions for select using (public.is_admin());
create policy "payments: alumno propios" on public.payments for select using (student_id = public.current_student_id());
create policy "payments: admin" on public.payments for select using (public.is_admin());

-- webhook_events: solo admin lee; escribe service_role
create policy "webhooks: admin lee" on public.webhook_events for select using (public.is_admin());

-- notifications
create policy "notifications: propias" on public.notifications for select using (user_id = auth.uid());
create policy "notifications: marcar leida" on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Vistas de exposición segura ----------
-- RLS filtra filas, no columnas. Estas vistas (owner: postgres, bypass RLS)
-- filtran filas en el WHERE y omiten columnas privadas.

create view public.teachers_public
with (security_barrier) as
  select t.id, t.bio, t.specialties, t.languages, t.is_active,
         p.first_name, p.last_name, p.avatar_url
  from public.teachers t
  join public.profiles p on p.id = t.profile_id
  where t.is_active;                          -- sin hourly_rate ni profile_id

create view public.classes_student
with (security_barrier) as
  select c.id, c.student_id, c.teacher_id, c.scheduled_at, c.duration_minutes,
         c.status, c.meeting_url, c.student_feedback,
         c.cancelled_by, c.cancellation_reason, c.rescheduled_from_id, c.created_at
  from public.classes c
  where c.student_id = public.current_student_id(); -- sin teacher_notes

grant select on public.teachers_public to anon, authenticated;
grant select on public.classes_student to authenticated;

-- ---------- Storage ----------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('materials', 'materials', false)
  on conflict (id) do nothing;

create policy "avatars: lectura pública" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars: escribe dueño" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: actualiza dueño" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "materials: lectura autenticada" on storage.objects for select
  using (bucket_id = 'materials' and auth.role() = 'authenticated');
create policy "materials: escribe profesor o admin" on storage.objects for insert
  with check (bucket_id = 'materials' and public.jwt_role() in ('teacher','admin','super_admin'));
