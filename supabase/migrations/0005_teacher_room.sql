-- ============================================================
-- 0005 — Sala de videollamada fija por profesor
-- Cada profesor guarda su link personal (Meet/Zoom/etc.) y se copia a cada
-- clase al reservarla; el profesor puede seguir pisándolo clase por clase.
-- RLS: teachers ya tiene RLS (0002). El profesor edita su fila ("teachers:
-- editar propio"), el admin todo. El alumno NO lee teachers (usa la vista
-- teachers_public, que no incluye esta columna): el link le llega solo en sus
-- clases vía classes_student.
-- ============================================================

alter table public.teachers
  add column meeting_url text check (meeting_url is null or meeting_url ~ '^https://');
