-- ============================================================
-- 0003 — Guards de columnas para el rol student
-- RLS controla filas; estos triggers controlan columnas sensibles.
-- ============================================================

-- El alumno no puede autoasignarse profesor ni cambiarse el nivel evaluado.
create or replace function public.guard_student_self_update()
returns trigger language plpgsql as $$
begin
  if public.jwt_role() = 'student' then
    if tg_op = 'INSERT' and new.assigned_teacher_id is not null then
      raise exception 'El profesor lo asigna la academia';
    end if;
    if tg_op = 'UPDATE' then
      if new.assigned_teacher_id is distinct from old.assigned_teacher_id then
        raise exception 'El profesor lo asigna la academia';
      end if;
      if new.current_level is distinct from old.current_level then
        raise exception 'El nivel lo actualiza tu profesor';
      end if;
    end if;
  end if;
  return new;
end $$;

create trigger students_guard_self
  before insert or update on public.students
  for each row execute function public.guard_student_self_update();
