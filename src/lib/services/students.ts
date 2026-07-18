import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type StudentRecord = {
  id: string;
  profile_id: string;
  current_level: string | null;
  target_level: string | null;
  learning_goal: string | null;
  onboarding_completed: boolean;
  assigned_teacher_id: string | null;
};

/** Ficha de alumno del usuario logueado (o null si aún no hizo onboarding). */
export async function getOwnStudent(): Promise<StudentRecord | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("students")
    .select("id, profile_id, current_level, target_level, learning_goal, onboarding_completed, assigned_teacher_id")
    .eq("profile_id", user.id)
    .maybeSingle();
  return (data as StudentRecord) ?? null;
}

/** Exige onboarding completo; si falta, redirige a /app/onboarding. */
export async function requireOnboardedStudent(): Promise<StudentRecord> {
  const student = await getOwnStudent();
  if (!student?.onboarding_completed) redirect("/app/onboarding");
  return student;
}

/** Crea/actualiza la ficha del alumno al completar el onboarding. */
export async function completeOnboarding(input: {
  userId: string;
  estimatedLevel: string;
  targetLevel: string;
  learningGoal: string;
}): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const existing = await getOwnStudent();

  if (existing) {
    const { error } = await supabase
      .from("students")
      .update({
        target_level: input.targetLevel,
        learning_goal: input.learningGoal,
        onboarding_completed: true,
      })
      .eq("id", existing.id);
    return { ok: !error };
  }

  const { data: created, error } = await supabase
    .from("students")
    .insert({
      profile_id: input.userId,
      current_level: input.estimatedLevel,
      target_level: input.targetLevel,
      learning_goal: input.learningGoal,
      onboarding_completed: true,
    })
    .select("id")
    .single();

  if (error || !created) return { ok: false };

  // Historial de nivel: fuente autoevaluación (inserta el servicio, no el alumno)
  const admin = createAdminClient();
  await admin.from("student_level_history").insert({
    student_id: created.id,
    level: input.estimatedLevel,
    source: "self_assessment",
  });

  return { ok: true };
}

/** Solicitud de cambio de profesor → notifica a los admins. */
export async function requestTeacherChange(studentProfileId: string, reason: string) {
  const admin = createAdminClient();
  const { data: admins } = await admin.from("profiles").select("id").in("role", ["admin", "super_admin"]);
  if (!admins?.length) return;
  await admin.from("notifications").insert(
    admins.map((a: { id: string }) => ({
      user_id: a.id,
      type: "teacher_change_request",
      title: "Solicitud de cambio de profesor",
      message: `El alumno ${studentProfileId} solicita cambio de profesor. Motivo: ${reason}`,
    })),
  );
}
