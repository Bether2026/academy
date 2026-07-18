import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { requireOnboardedStudent } from "@/lib/services/students";
import { getAvailableSlots } from "@/lib/services/scheduling";
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

  const slots = await getAvailableSlots(student.assigned_teacher_id, tz);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Reservar clase</h1>
        <p className="text-sm text-muted-foreground">
          Horarios en tu zona horaria ({tz}). Clases de {CLASS_POLICY.classDurationMinutes} minutos.
        </p>
      </div>
      {slots.length ? (
        <SlotPicker slots={slots} />
      ) : (
        <p className="rounded-lg border bg-card px-4 py-6 text-sm text-muted-foreground">
          Tu profesor no tiene turnos disponibles en los próximos {CLASS_POLICY.bookingWindowDays}{" "}
          días. Escribinos y lo resolvemos.
        </p>
      )}
    </div>
  );
}
