import "server-only";
import { addDays, addMinutes, format, isBefore } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { createAdminClient } from "@/lib/supabase/admin";
import { CLASS_POLICY } from "@/lib/services/policy";

export type Slot = { startUtc: string; labelDate: string; labelTime: string };

type AvailabilityRow = { day_of_week: number; start_time: string; end_time: string };
type BusyRow = { scheduled_at: string; duration_minutes: number };

/**
 * Turnos disponibles del profesor para los próximos días.
 * La disponibilidad está guardada en la TZ del profesor; los turnos se
 * calculan en UTC y se etiquetan en la TZ del alumno.
 */
export async function getAvailableSlots(
  teacherId: string,
  studentTimezone: string,
): Promise<Slot[]> {
  const admin = createAdminClient();

  const [{ data: availability }, { data: teacherProfile }, { data: busy }] = await Promise.all([
    admin
      .from("teacher_availability")
      .select("day_of_week, start_time, end_time")
      .eq("teacher_id", teacherId)
      .eq("is_active", true),
    admin
      .from("teachers")
      .select("profile_id, profiles!inner(timezone)")
      .eq("id", teacherId)
      .single(),
    admin
      .from("classes")
      .select("scheduled_at, duration_minutes")
      .eq("teacher_id", teacherId)
      .in("status", ["scheduled", "confirmed"])
      .gte("scheduled_at", new Date().toISOString()),
  ]);

  if (!availability?.length || !teacherProfile) return [];
  const teacherTz =
    (teacherProfile as unknown as { profiles: { timezone: string } }).profiles.timezone ?? "UTC";

  const busyRanges = ((busy ?? []) as BusyRow[]).map((b) => {
    const start = new Date(b.scheduled_at);
    return { start, end: addMinutes(start, b.duration_minutes) };
  });

  const now = new Date();
  const minStart = addMinutes(now, CLASS_POLICY.minBookingLeadHours * 60);
  const slots: Slot[] = [];

  for (let d = 0; d <= CLASS_POLICY.bookingWindowDays; d++) {
    // "Hoy + d" visto desde la TZ del profesor
    const dayInTeacherTz = toZonedTime(addDays(now, d), teacherTz);
    const weekday = dayInTeacherTz.getDay();
    const dateStr = format(dayInTeacherTz, "yyyy-MM-dd");

    for (const a of (availability as AvailabilityRow[]).filter((a) => a.day_of_week === weekday)) {
      // Clases en punto, cada hora, dentro de la franja
      const startHour = parseInt(a.start_time.slice(0, 2), 10);
      const endHour = parseInt(a.end_time.slice(0, 2), 10);
      for (let h = startHour; h < endHour; h++) {
        const startUtc = fromZonedTime(`${dateStr} ${String(h).padStart(2, "0")}:00:00`, teacherTz);
        const endUtc = addMinutes(startUtc, CLASS_POLICY.classDurationMinutes);

        if (isBefore(startUtc, minStart)) continue;
        if (busyRanges.some((b) => startUtc < b.end && endUtc > b.start)) continue;

        const inStudentTz = toZonedTime(startUtc, studentTimezone);
        slots.push({
          startUtc: startUtc.toISOString(),
          labelDate: format(inStudentTz, "yyyy-MM-dd"),
          labelTime: format(inStudentTz, "HH:mm"),
        });
      }
    }
  }

  return slots.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}

/**
 * Reserva una clase. Valida en servidor; la restricción de exclusión en
 * Postgres es la garantía final contra carreras.
 */
export async function bookClass(params: {
  studentId: string;
  teacherId: string;
  startUtc: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const start = new Date(params.startUtc);
  if (Number.isNaN(start.getTime())) return { ok: false, error: "Horario inválido." };
  if (isBefore(start, addMinutes(new Date(), CLASS_POLICY.minBookingLeadHours * 60))) {
    return {
      ok: false,
      error: `Las clases se reservan con al menos ${CLASS_POLICY.minBookingLeadHours} h de anticipación.`,
    };
  }

  const admin = createAdminClient();

  // El turno debe seguir estando dentro de la disponibilidad ofrecida
  const { data: student } = await admin
    .from("students")
    .select("assigned_teacher_id, profiles:profile_id(timezone)")
    .eq("id", params.studentId)
    .single();
  if (!student || student.assigned_teacher_id !== params.teacherId) {
    return { ok: false, error: "Solo podés reservar con tu profesor asignado." };
  }

  const { error } = await admin.from("classes").insert({
    student_id: params.studentId,
    teacher_id: params.teacherId,
    scheduled_at: start.toISOString(),
    duration_minutes: CLASS_POLICY.classDurationMinutes,
    status: "scheduled",
  });

  if (error) {
    if (error.code === "23P01") return { ok: false, error: "Ese turno acaba de ocuparse. Elegí otro." };
    return { ok: false, error: "No pudimos reservar la clase. Probá de nuevo." };
  }
  return { ok: true };
}

/** Cancela una clase aplicando la política de 24 h. */
export async function cancelClass(params: {
  classId: string;
  studentId: string;
}): Promise<{ ok: true; late: boolean } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const { data: cls } = await admin
    .from("classes")
    .select("id, student_id, scheduled_at, status")
    .eq("id", params.classId)
    .single();

  if (!cls || cls.student_id !== params.studentId) return { ok: false, error: "Clase no encontrada." };
  if (!["scheduled", "confirmed"].includes(cls.status)) {
    return { ok: false, error: "Esta clase ya no se puede cancelar." };
  }

  const hoursUntil = (new Date(cls.scheduled_at).getTime() - Date.now()) / 3_600_000;
  const late = hoursUntil < CLASS_POLICY.freeCancellationHours;

  const { error } = await admin
    .from("classes")
    .update({
      status: "cancelled",
      cancelled_by: "student",
      cancellation_reason: late ? "late_cancellation" : "free_cancellation",
    })
    .eq("id", params.classId);

  if (error) return { ok: false, error: "No pudimos cancelar. Probá de nuevo." };
  return { ok: true, late };
}
