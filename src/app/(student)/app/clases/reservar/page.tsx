import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { requireOnboardedStudent } from "@/lib/services/students";
import { getAvailableSlots, getBookingAllowance, quotaAllows } from "@/lib/services/scheduling";
import { fmtInTz } from "@/lib/utils/dates";
import { CLASS_POLICY } from "@/lib/services/policy";
import { SlotPicker } from "./slot-picker";

export const metadata: Metadata = { title: "Reservar clase" };

export default async function BookPage() {
  const { user } = await requireRole("student");
  const student = await requireOnboardedStudent();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();
  const tz = profile?.timezone ?? "UTC";

  if (!student.assigned_teacher_id) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-heading text-2xl font-bold">Casi listo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Te estamos asignando un profesor según tu nivel y objetivo. En cuanto lo tengas vas a
          poder reservar tu primera clase. Te avisamos por email.
        </p>
        <Link href="/app" className="mt-4 inline-block text-sm text-sky-700 underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const allowance = await getBookingAllowance(student.id);
  if (!allowance.ok) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-heading text-2xl font-bold">Elegí tu plan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Para reservar clases necesitás un plan activo. Elegí la frecuencia que mejor te quede y
          empezá cuando quieras.
        </p>
        <Link href="/app/suscripcion" className="mt-4 inline-block text-sm font-medium text-sky-700 underline">
          Ver planes
        </Link>
      </div>
    );
  }

  // solo se ofrecen turnos que el plan permite (cupo del período en el que caen)
  const slots = (await getAvailableSlots(student.assigned_teacher_id, tz)).filter((s) =>
    quotaAllows(allowance, new Date(s.startUtc)),
  );
  const [current] = allowance.windows;
  const lastEnd = allowance.windows[allowance.windows.length - 1].end;
  const left = Math.max(current.limit - current.used, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Reservar clase</h1>
        <p className="text-sm text-muted-foreground">
          Horarios en tu zona horaria ({tz}). Clases de {CLASS_POLICY.classDurationMinutes} minutos.
        </p>
      </div>
      <p className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        Te quedan <strong>{left} de {current.limit}</strong> clases de tu plan hasta el{" "}
        {fmtInTz(current.end.toISOString(), tz, "d 'de' MMMM")}.
        {allowance.windows.length > 1
          ? ` También podés reservar a cuenta del período siguiente, hasta el ${fmtInTz(lastEnd.toISOString(), tz, "d 'de' MMMM")}.`
          : " Tu plan no tiene un período siguiente, así que solo se muestran turnos hasta esa fecha."}
      </p>
      {slots.length ? (
        <SlotPicker slots={slots} />
      ) : (
        <p className="rounded-lg border bg-card px-4 py-6 text-sm text-muted-foreground">
          No hay turnos disponibles para reservar en los próximos {CLASS_POLICY.bookingWindowDays}{" "}
          días: o tu profesor no tiene horarios libres, o ya usaste las clases de tu plan.
        </p>
      )}
    </div>
  );
}
