# Modelo de Datos y Seguridad (RLS)

> FASE 0 — Esquema propuesto. Se materializará como migraciones SQL en `supabase/migrations/` durante la Fase 1.

## 1. Convenciones

- PK: `uuid` con `gen_random_uuid()` (salvo `profiles`, que usa el id de `auth.users`).
- Fechas: siempre `timestamptz` (UTC). La zona horaria del usuario vive en su perfil y se aplica solo al mostrar.
- `created_at` / `updated_at` en todas las tablas; `updated_at` mantenido por trigger.
- Enums de Postgres para valores cerrados (roles, estados, niveles, categorías).
- Índices en todas las FK y en columnas de búsqueda frecuente (`classes.scheduled_at`, etc.).
- Sin borrado físico de datos con valor histórico: `classes`, `payments` y `subscriptions` nunca se eliminan; cambian de estado.

## 2. Enums

```sql
create type user_role       as enum ('student','teacher','admin','super_admin');
create type cefr_level      as enum ('A1','A2','B1','B2','C1','C2');
create type class_status    as enum ('scheduled','confirmed','completed','cancelled','no_show','rescheduled');
create type cancelled_by    as enum ('student','teacher','admin','system');
create type assignment_status as enum ('pending','submitted','reviewed','overdue');
create type progress_category as enum ('speaking','listening','reading','writing','grammar','vocabulary','pronunciation');
create type material_type   as enum ('document','video','audio','link','exercise');
create type payment_provider as enum ('mercadopago','stripe');
create type subscription_status as enum ('active','past_due','cancelled','expired','trial');
create type payment_status  as enum ('approved','pending','rejected','refunded');
create type billing_interval as enum ('monthly','quarterly','yearly');
```

Nota sobre el prompt original: `levels` como tabla se reemplaza por el enum `cefr_level` (estándar fijo, ver decisión #9 en `00-arquitectura.md`).

## 3. Tablas

### Identidad

**`profiles`** — 1:1 con `auth.users`. Creada por trigger al registrarse.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | `references auth.users(id) on delete cascade` |
| `role` | user_role | default `'student'`. Solo admin puede cambiarla. Trigger la copia a `app_metadata` del JWT. |
| `first_name`, `last_name` | text | |
| `email` | text | espejo de auth, para joins y listados |
| `phone` | text null | |
| `avatar_url` | text null | Storage |
| `country` | text | ISO-3166 (`AR`, `ES`) — decide proveedor de pago |
| `timezone` | text | IANA (`America/Argentina/Buenos_Aires`, `Europe/Madrid`) |
| `created_at`, `updated_at` | timestamptz | |

**`students`** — extensión académica del perfil (solo `role = 'student'`).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `profile_id` | uuid FK → profiles, unique | |
| `current_level` | cefr_level null | null hasta el test de nivel |
| `target_level` | cefr_level null | |
| `learning_goal` | text null | trabajo, viaje, examen, etc. |
| `preferred_language` | text | idioma de la UI, default `'es'` |
| `onboarding_completed` | boolean | default false |
| `assigned_teacher_id` | uuid FK → teachers, null | |
| `created_at`, `updated_at` | | |

**`teachers`** — extensión del perfil (solo `role = 'teacher'`).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `profile_id` | uuid FK → profiles, unique | |
| `bio` | text | visible para alumnos |
| `specialties` | text[] | `{'business','exams','conversation'}` |
| `languages` | text[] | idiomas que habla |
| `hourly_rate` | numeric(10,2) null | informativo v1; NO visible para alumnos |
| `is_active` | boolean | default true |
| `created_at`, `updated_at` | | |

### Académico

**`student_level_history`** — evolución de nivel; se inserta, nunca se edita.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `student_id` | uuid FK → students | |
| `level` | cefr_level | |
| `evaluated_at` | timestamptz | |
| `source` | text | `'placement_test'`, `'teacher_assessment'` |
| `notes` | text null | |

**`classes`** — núcleo del sistema.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `student_id` | uuid FK → students | |
| `teacher_id` | uuid FK → teachers | |
| `scheduled_at` | timestamptz | UTC |
| `duration_minutes` | int | default 50, check > 0 |
| `status` | class_status | default `'scheduled'` |
| `meeting_url` | text null | Meet/Zoom |
| `teacher_notes` | text null | **PRIVADA** — el alumno nunca la ve (RLS por columna vía vista, ver §5) |
| `student_feedback` | text null | visible para el alumno (renombrada de `student_notes` para claridad) |
| `cancelled_by` | cancelled_by null | auditoría de cancelaciones |
| `cancellation_reason` | text null | |
| `rescheduled_from_id` | uuid FK → classes, null | trazabilidad de reprogramaciones |
| `created_at`, `updated_at` | | |

Anti doble-reserva (garantía a nivel base de datos):

```sql
create extension if not exists btree_gist;
alter table classes add constraint no_teacher_overlap
  exclude using gist (
    teacher_id with =,
    tstzrange(scheduled_at, scheduled_at + make_interval(mins => duration_minutes)) with &&
  ) where (status in ('scheduled','confirmed'));
```

**`teacher_availability`** — plantilla semanal recurrente.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `teacher_id` | uuid FK → teachers | |
| `day_of_week` | smallint | 0–6, check |
| `start_time`, `end_time` | time | **en la TZ del profesor**; el servicio de scheduling la proyecta a UTC por fecha concreta (clave para el DST español) |
| `is_active` | boolean | |

(Excepciones puntuales — vacaciones, feriados — quedan para una tabla `availability_exceptions` cuando haga falta; no en v1.)

**`learning_materials`**

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `title`, `description` | text | |
| `type` | material_type | |
| `url` | text | Storage o enlace externo |
| `level` | cefr_level null | null = todos los niveles |
| `created_by` | uuid FK → profiles | |
| `is_published` | boolean | default false |
| `created_at`, `updated_at` | | |

**`assignments`** — tareas asignadas por el profesor.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `student_id` | uuid FK → students | |
| `teacher_id` | uuid FK → teachers | |
| `title`, `description` | text | |
| `due_date` | timestamptz null | |
| `status` | assignment_status | default `'pending'` |
| `created_at`, `updated_at` | | |

**`progress_records`** — evaluaciones por categoría.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `student_id` | uuid FK → students | |
| `teacher_id` | uuid FK → teachers | |
| `category` | progress_category | |
| `score` | smallint | check 0–100 |
| `notes` | text null | visible para el alumno |
| `created_at` | timestamptz | |

### Comercial

**`plans`**

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `name`, `description` | text | |
| `price` | numeric(10,2) | |
| `currency` | char(3) | `ARS` / `EUR` — un plan por moneda |
| `billing_interval` | billing_interval | |
| `classes_per_period` | int | |
| `is_active` | boolean | los planes no se borran, se desactivan (los históricos los referencian) |
| `created_at`, `updated_at` | | |

**`subscriptions`**

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `student_id` | uuid FK → students | |
| `plan_id` | uuid FK → plans | |
| `provider` | payment_provider | |
| `external_subscription_id` | text | id en MP/Stripe; unique junto a `provider` |
| `status` | subscription_status | |
| `current_period_start`, `current_period_end` | timestamptz | |
| `cancel_at_period_end` | boolean | default false |
| `created_at`, `updated_at` | | |

**`payments`** — solo referencias externas; **jamás datos de tarjeta**.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `student_id` | uuid FK → students | |
| `subscription_id` | uuid FK → subscriptions, null | null para pagos únicos futuros |
| `provider` | payment_provider | |
| `external_payment_id` | text | unique junto a `provider` |
| `amount` | numeric(10,2) | |
| `currency` | char(3) | |
| `status` | payment_status | |
| `paid_at` | timestamptz null | |
| `created_at` | timestamptz | |

**`webhook_events`** — idempotencia de webhooks (no estaba en el prompt original; ver riesgo "webhooks duplicados").

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `provider` | payment_provider | |
| `event_id` | text | unique junto a `provider` → un evento se procesa una sola vez |
| `event_type` | text | |
| `payload` | jsonb | |
| `processed_at` | timestamptz null | |
| `error` | text null | |
| `created_at` | timestamptz | |

### Transversal

**`notifications`**

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | |
| `type` | text | `'class_reminder'`, `'payment_failed'`, … |
| `title`, `message` | text | |
| `read_at` | timestamptz null | |
| `created_at` | timestamptz | |

## 4. Relaciones (resumen)

```
auth.users 1─1 profiles ──1─0..1 students ──1─N classes N─1 teachers 0..1─1 profiles
                                    │            │                │
                                    │            └── N─1 ─────────┘ (assigned_teacher)
                                    ├── 1─N student_level_history
                                    ├── 1─N progress_records (N─1 teachers)
                                    ├── 1─N assignments      (N─1 teachers)
                                    ├── 1─N subscriptions N─1 plans
                                    └── 1─N payments  N─0..1 subscriptions
teachers 1─N teacher_availability
profiles 1─N notifications
profiles 1─N learning_materials (created_by)
```

## 5. Políticas de seguridad (RLS)

Principios:

1. **RLS habilitado en el 100% de las tablas.** Sin excepciones. Deny by default.
2. El rol se lee del JWT (`auth.jwt()->'app_metadata'->>'role'`), nunca consultando `profiles` dentro de una política (evita recursión).
3. Chequeos cruzados ("¿este alumno es mío?") mediante funciones `SECURITY DEFINER` con `search_path` fijado.
4. El `service_role` (solo servidor: webhooks, tareas admin) bypasea RLS — por eso esa clave jamás llega al cliente.

Funciones auxiliares:

```sql
create function public.jwt_role() returns text
  language sql stable
  as $$ select coalesce(auth.jwt()->'app_metadata'->>'role','') $$;

create function public.is_admin() returns boolean
  language sql stable
  as $$ select public.jwt_role() in ('admin','super_admin') $$;

-- ids del alumno/profesor logueado (SECURITY DEFINER para no disparar RLS de esas tablas)
create function public.current_student_id() returns uuid ...
create function public.current_teacher_id() returns uuid ...
```

Matriz de acceso por tabla (S = alumno, T = profesor, A = admin):

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | propio; T: perfiles de sus alumnos (campos no sensibles vía vista); A: todos | trigger de registro | propio (**sin poder tocar `role`** — columna protegida por trigger/grant); A: todos | nadie (A vía soft-delete) |
| `students` | propio; T: solo asignados; A: todos | servidor (onboarding) | propio (campos limitados); A: todos | nadie |
| `teachers` | S: solo su profesor asignado y **sin `hourly_rate`** (vista `teachers_public`); T: propio; A: todos | A | T: propio (bio, specialties); A: todos | nadie |
| `classes` | S: propias **sin `teacher_notes`** (vista `classes_student`); T: propias; A: todas | servidor (servicio de reservas valida crédito y disponibilidad) | S: cancelar propias (transición de estado restringida); T: notas/estado de propias; A: todas | nadie — se cancela, no se borra |
| `teacher_availability` | S: la de su profesor; T: propia; A: todas | T: propia | T: propia | T: propia |
| `student_level_history` | S: propio; T: de sus alumnos; A: todos | T (sus alumnos) / servidor | nadie (histórico inmutable) | nadie |
| `progress_records` | S: propios; T: de sus alumnos | T (sus alumnos) | T: propios registros | nadie |
| `assignments` | S: propias; T: las que creó | T (sus alumnos) | S: marcar entregada; T: propias | T: propias |
| `learning_materials` | S/T: publicados (+T: propios borradores); A: todos | T, A | autor o A | autor o A |
| `plans` | público (los muestra la landing) | A | A | nadie (se desactivan) |
| `subscriptions` | S: propias; A: todas | solo servidor (webhooks) | solo servidor / A | nadie |
| `payments` | S: propios; A: todos | solo servidor (webhooks) | solo servidor | nadie |
| `webhook_events` | A | solo servidor | solo servidor | nadie |
| `notifications` | propias | servidor | propias (marcar leída) | propias |

Dos decisiones finas que salen de requisitos explícitos del producto:

- **`teacher_notes` invisible para el alumno**: RLS filtra filas, no columnas. Solución: los alumnos leen las clases a través de la vista `classes_student` (sin esa columna, `security_invoker = on`) y no tienen `SELECT` directo sobre las columnas privadas de `classes` (control por `GRANT` de columnas).
- **`hourly_rate` invisible para el alumno**: misma técnica con la vista `teachers_public`.

## 6. Storage

Buckets:

- `avatars` — público de lectura; escritura solo del dueño (path = `{user_id}/…`).
- `materials` — lectura autenticada según reglas de `learning_materials`; escritura de profesores/admin.
