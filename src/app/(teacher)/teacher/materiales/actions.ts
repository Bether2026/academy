"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { shareMaterial, unshareMaterial } from "@/lib/services/materials";

export type ActionState = { error?: string; message?: string };

const shareSchema = z.object({
  materialId: z.string().uuid(),
  target: z.string().regex(/^(student:[0-9a-f-]{36}|level:(A1|A2|B1|B2|C1|C2))$/),
});

/** Comparte un material con un alumno o un nivel. RLS decide si el usuario puede hacerlo. */
export async function shareMaterialAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireRole("teacher", "admin", "super_admin");
  const parsed = shareSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Elegí con quién compartir." };

  const [kind, value] = parsed.data.target.split(":");
  const result = await shareMaterial({
    materialId: parsed.data.materialId,
    userId: user.id,
    ...(kind === "student" ? { studentId: value } : { level: value }),
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/teacher/materiales");
  revalidatePath("/admin/materiales");
  return { message: "Compartido." };
}

export async function unshareMaterialAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("teacher", "admin", "super_admin");
  const parsed = z.object({ shareId: z.string().uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success || !(await unshareMaterial(parsed.data.shareId))) return { error: "No se pudo quitar." };

  revalidatePath("/teacher/materiales");
  revalidatePath("/admin/materiales");
  return {};
}
