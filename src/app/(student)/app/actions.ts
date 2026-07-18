"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { completeOnboarding, getOwnStudent, requestTeacherChange } from "@/lib/services/students";
import { bookClass, cancelClass } from "@/lib/services/scheduling";
import {
  bookSlotSchema,
  onboardingSchema,
  profileUpdateSchema,
  teacherChangeSchema,
} from "@/lib/validators/student";

export type ActionState = { error?: string; message?: string };

export async function submitOnboarding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireRole("student");
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { ok } = await completeOnboarding({
    userId: user.id,
    estimatedLevel: parsed.data.estimatedLevel,
    targetLevel: parsed.data.targetLevel,
    learningGoal: parsed.data.learningGoal,
  });
  if (!ok) return { error: "No pudimos guardar tus datos. Probá de nuevo." };
  redirect("/app");
}

export async function bookSlot(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("student");
  const parsed = bookSlotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Elegí un horario." };

  const student = await getOwnStudent();
  if (!student?.assigned_teacher_id) {
    return { error: "Todavía no tenés profesor asignado. Te avisamos por email cuando lo tengas." };
  }

  const result = await bookClass({
    studentId: student.id,
    teacherId: student.assigned_teacher_id,
    startUtc: parsed.data.startUtc,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/app/clases");
  redirect("/app/clases?reservada=1");
}

export async function cancelOwnClass(formData: FormData): Promise<void> {
  await requireRole("student");
  const classId = formData.get("classId");
  if (typeof classId !== "string") return;

  const student = await getOwnStudent();
  if (!student) return;

  await cancelClass({ classId, studentId: student.id });
  revalidatePath("/app/clases");
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireRole("student", "teacher", "admin", "super_admin");
  const parsed = profileUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      phone: parsed.data.phone || null,
      timezone: parsed.data.timezone,
    })
    .eq("id", user.id);

  if (error) return { error: "No pudimos guardar los cambios." };
  revalidatePath("/app/perfil");
  return { message: "Datos actualizados." };
}

export async function submitTeacherChange(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireRole("student");
  const parsed = teacherChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await requestTeacherChange(user.id, parsed.data.reason);
  return { message: "Solicitud enviada. Te contactamos dentro de las próximas 48 h." };
}

export async function markAssignmentSubmitted(formData: FormData): Promise<void> {
  await requireRole("student");
  const id = formData.get("assignmentId");
  if (typeof id !== "string") return;
  const supabase = await createClient();
  await supabase.from("assignments").update({ status: "submitted" }).eq("id", id);
  revalidatePath("/app");
}
