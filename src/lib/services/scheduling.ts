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

/** Estados de suscripción que habilitan reservar (past_due = pago fallido: no). */
const BOOKABLE_SUBSCRIPTION = ["active", "trial"];
/** Clases que consumen cupo: todo lo reservado menos las canceladas a tiempo. */
const QUOTA_STATUSES = ["scheduled", "confirmed", "completed", "no_show"];

type QuotaWindow = { start: Date; end: Date; limit: number; used: number };

/**
 * Cupo de clases del alumno según su plan. Las clases cuentan en el período
 * en el que caen: el actual, o el siguiente si la suscripción se renueva.
 */
export type BookingAllowance =
  | { ok: false }
  | { ok: true; current: QuotaWindow; next: QuotaWindow | null };

export async function getBookingAllowance(studentId: string): Promise<BookingAllowance> {
  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("current_period_start, current_period_end, cancel_at_period_end, plan:plans(classes_per_period)")
    .eq("student_id", studentId)
    .in("status", BOOKABLE_SUBSCRIPTION)
    .gt("current_period_end", new Date().toISOString())
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub) return { ok: false };

  const limit = (sub.plan as unknown as { classes_per_period: number }).classes_per_period;
  const start = new Date(sub.current_period_start);
  const end = new Date(sub.current_period_end);
  // el período siguiente dura lo mismo que el actual
  const nextEnd = new Date(end.getTime() + (end.getTime() - start.getTime()));

  const { data: taken } = await admin
    .from("classes")
    .select("scheduled_at, status, cancellation_reason")
    .eq("student_id", studentId)
    .gte("scheduled_at", start.toISOString())
    .lt("scheduled_at", nextEnd.toISOString());

  // las cancelaciones tardías (< 24 h) también consumen la clase
  const counted = (taken ?? []).filter(
    (c) => QUOTA_STATUSES.includes(c.status) || c.cancellation_reason === "late_cancellation",
  );
  const usedIn = (from: Date, to: Date) =>
    counted.filter((c) => {
      const t = new Date(c.scheduled_at);
      return t >= from && t < to;
    }).length;

  return {
    ok: true,
    current: { start, end, limit, used: usedIn(start, end) },
    next: sub.cancel_at_period_end ? null : { start: end, end: nextEnd, limit, used: usedIn(end, nextEnd) },
  };
}

/** ¿El alumno puede reservar una clase que empieza en `at`? */
export function quotaAllows(allowance: BookingAllowance, at: Date): boolean {
  if (!allowance.ok) return false;
  const w = [allowance.current, allowance.next].find((w) => w && at >= w.start && at < w.end);
  return !!w && w.used < w.limit;
}

/**
 * Reserva una clase. Valida en servidor plan, cupo y disponibilidad; la
 * restricción de exclusión en Postgres es la garantía final contra carreras.
 */
export async function bookClass(params: {
  studentId: string;
  teacherId: string;
  startUtc: string;
}): Promise<{ ok: true; classId: string } | { ok: false; error: string }> {
  const start = new Date(params.startUtc);
  if (Number.isNaN(start.getTime())) return { ok: false, error: "Horario inválido." };
  if (isBefore(start, addMinutes(new Date(), CLASS_POLICY.minBookingLeadHours * 60))) {
    return {
      ok: false,
      error: `Las clases se reservan con al menos ${CLASS_POLICY.minBookingLeadHours} h de anticipación.`,
    };
  }

  const admin = createAdminClient();

  const { data: student } = await admin
    .from("students")
    .select("assigned_teacher_id")
    .eq("id", params.studentId)
    .single();
  if (!student || student.assigned_teacher_id !== params.teacherId) {
    return { ok: false, error: "Solo podés reservar con tu profesor asignado." };
  }

  // El turno tiene que ser uno de los ofrecidos (franja del profesor, libre, dentro de la ventana)
  const offered = await getAvailableSlots(params.teacherId, "UTC");
  if (!offered.some((s) => s.startUtc === start.toISOString())) {
    return { ok: false, error: "Ese horario no está disponible. Elegí otro." };
  }

  const allowance = await getBookingAllowance(params.studentId);
  if (!allowance.ok) {
    return { ok: false, error: "Necesitás un plan activo para reservar clases." };
  }
  if (!quotaAllows(allowance, start)) {
    return { ok: false, error: "Ya usaste todas las clases de tu plan para ese período." };
  }

  // La sala fija del profesor se copia a la clase (él puede cambiarla después)
  const { data: teacher } = await admin
    .from("teachers")
    .select("meeting_url")
    .eq("id", params.teacherId)
    .single();

  const { data: created, error } = await admin
    .from("classes")
    .insert({
      student_id: params.studentId,
      teacher_id: params.teacherId,
      scheduled_at: start.toISOString(),
      duration_minutes: CLASS_POLICY.classDurationMinutes,
      status: "scheduled",
      meeting_url: teacher?.meeting_url ?? null,
    })
    .select("id")
    .single();

  if (error || !created) {
    if (error?.code === "23P01") return { ok: false, error: "Ese turno acaba de ocuparse. Elegí otro." };
    return { ok: false, error: "No pudimos reservar la clase. Probá de nuevo." };
  }
  return { ok: true, classId: created.id };
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
