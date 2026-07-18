"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; message?: string };

const setRoleSchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(["student", "teacher", "admin"]),
});

export async function setUserRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin", "super_admin");
  const parsed = setRoleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.profileId);
  if (error) return { error: "No se pudo cambiar el rol." };

  // Si pasa a profesor, crear su ficha si no existe
  if (parsed.data.role === "teacher") {
    const { data: existing } = await supabase
      .from("teachers")
      .select("id")
      .eq("profile_id", parsed.data.profileId)
      .maybeSingle();
    if (!existing) {
      await supabase.from("teachers").insert({ profile_id: parsed.data.profileId });
    }
  }

  revalidatePath("/admin/usuarios");
  return { message: "Rol actualizado. El usuario debe volver a iniciar sesión." };
}

const assignTeacherSchema = z.object({
  studentId: z.string().uuid(),
  teacherId: z.string().uuid().or(z.literal("none")),
});

export async function assignTeacher(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin", "super_admin");
  const parsed = assignTeacherSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ assigned_teacher_id: parsed.data.teacherId === "none" ? null : parsed.data.teacherId })
    .eq("id", parsed.data.studentId);
  if (error) return { error: "No se pudo asignar el profesor." };

  revalidatePath("/admin/usuarios");
  return { message: "Profesor asignado." };
}

const planUpdateSchema = z.object({
  planId: z.string().uuid(),
  price: z.coerce.number().positive(),
  isActive: z.enum(["true", "false"]),
});

export async function updatePlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin", "super_admin");
  const parsed = planUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .update({ price: parsed.data.price, is_active: parsed.data.isActive === "true" })
    .eq("id", parsed.data.planId);
  if (error) return { error: "No se pudo actualizar el plan." };

  revalidatePath("/admin/planes");
  return { message: "Plan actualizado." };
}
