"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { notifyTeacherAssigned } from "@/lib/services/notifications";
import { endManualPlan, grantManualMonth } from "@/lib/services/subscriptions";
import { updateWithdrawal } from "@/lib/services/withdrawals";
import { withdrawalUpdateSchema } from "@/lib/validators/withdrawal";
import { deleteTransferAccount, saveTransferAccount } from "@/lib/services/transfer-accounts";
import { transferAccountSchema } from "@/lib/validators/transfer-account";

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
  if (parsed.data.teacherId !== "none") after(() => notifyTeacherAssigned(parsed.data.studentId));

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

const grantPlanSchema = z.object({
  studentId: z.string().uuid(),
  planId: z.string().uuid(),
  mode: z.enum(["paid", "courtesy"]),
});

/** Activa (o suma) un mes de plan pagado en efectivo/transferencia o de cortesía. */
export async function grantPlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin", "super_admin");
  const parsed = grantPlanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Elegí un plan." };

  const result = await grantManualMonth(parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/usuarios");
  const until = new Date(result.until).toLocaleDateString("es-AR", { day: "numeric", month: "long" });
  return { message: `Plan activo hasta el ${until}.` };
}

export async function endPlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin", "super_admin");
  const parsed = z.object({ studentId: z.string().uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos inválidos." };

  if (!(await endManualPlan(parsed.data.studentId))) return { error: "No se pudo dar de baja." };
  revalidatePath("/admin/usuarios");
  return { message: "Plan dado de baja." };
}

const teachesSchema = z.object({
  profileId: z.string().uuid(),
  teaches: z.enum(["true", "false"]),
});

/** Un admin también puede dar clases: crea/activa o desactiva su ficha de profesor (nunca se borra). */
export async function setTeaches(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin", "super_admin");
  const parsed = teachesSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos inválidos." };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", parsed.data.profileId)
    .single();
  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { error: "Solo aplica a administradores." };
  }

  const isActive = parsed.data.teaches === "true";
  const { error } = await supabase
    .from("teachers")
    .upsert({ profile_id: parsed.data.profileId, is_active: isActive }, { onConflict: "profile_id" });
  if (error) return { error: "No se pudo actualizar." };

  revalidatePath("/admin", "layout");
  return {
    message: isActive
      ? "Listo: ya tiene panel de profesor (botón \"Mis clases\" arriba)."
      : "Ya no figura como profesor. Sus clases anteriores se conservan.",
  };
}

export async function updateWithdrawalAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireRole("admin", "super_admin");
  const parsed = withdrawalUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos inválidos." };

  if (!(await updateWithdrawal({ ...parsed.data, adminId: user.id }))) return { error: "No se pudo guardar." };
  revalidatePath("/admin/arrepentimientos");
  revalidatePath("/admin");
  return { message: "Guardado." };
}

export async function saveTransferAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin", "super_admin");
  const parsed = transferAccountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const { isActive, ...rest } = parsed.data;
  if (!(await saveTransferAccount({ ...rest, is_active: isActive }))) return { error: "No se pudo guardar." };
  revalidatePath("/admin/planes");
  revalidatePath("/app/suscripcion");
  return { message: "Guardado." };
}

export async function deleteTransferAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin", "super_admin");
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success || !(await deleteTransferAccount(id.data))) return { error: "No se pudo eliminar." };
  revalidatePath("/admin/planes");
  revalidatePath("/app/suscripcion");
  return { message: "Eliminada." };
}
