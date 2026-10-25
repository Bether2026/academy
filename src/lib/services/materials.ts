import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnTeacher } from "@/lib/services/teachers";

export type MaterialShare = { id: string; student_id: string | null; level: string | null };

export type LibraryMaterial = {
  id: string;
  title: string;
  level: string | null;
  unit: number | null;
  audience: "student" | "teacher";
  shares: MaterialShare[];
};

export type ShareableStudent = { id: string; name: string; level: string | null };

const LINK_SECONDS = 120;

/** Biblioteca completa (profesores y admins). RLS: solo staff lee todo. */
export async function getLibrary(): Promise<LibraryMaterial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("learning_materials")
    .select("id, title, level, unit, audience, shares:material_shares(id, student_id, level)")
    .order("level")
    .order("unit")
    .order("audience");
  return (data ?? []) as unknown as LibraryMaterial[];
}

/** Material visible para el alumno logueado (RLS: solo lo compartido con él o su nivel). */
export async function getMyMaterials() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("learning_materials")
    .select("id, title, level, unit")
    .order("level")
    .order("unit");
  return (data ?? []) as { id: string; title: string; level: string | null; unit: number | null }[];
}

/**
 * Link para abrir un material. Primero se lee la fila con la sesión del usuario
 * (si RLS no la devuelve, no tiene permiso); recién ahí se firma la URL del archivo.
 */
export async function getMaterialLink(materialId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: material } = await supabase
    .from("learning_materials")
    .select("url, file_path")
    .eq("id", materialId)
    .maybeSingle();
  if (!material) return null;
  if (!material.file_path) return material.url;

  const { data } = await createAdminClient().storage.from("materials").createSignedUrl(material.file_path, LINK_SECONDS);
  return data?.signedUrl ?? null;
}

/** Alumnos con los que el usuario puede compartir: el admin, todos; el profesor, sus asignados. */
export async function getShareableStudents(isAdmin: boolean): Promise<ShareableStudent[]> {
  const supabase = await createClient();
  let query = supabase
    .from("students")
    .select("id, current_level, profiles:profile_id!inner(first_name, last_name, role)")
    .eq("profiles.role", "student");
  if (!isAdmin) {
    const teacher = await getOwnTeacher();
    if (!teacher) return [];
    query = query.eq("assigned_teacher_id", teacher.id);
  }
  const { data } = await query;
  return (data ?? [])
    .map((s) => {
      const p = s.profiles as unknown as { first_name: string; last_name: string };
      return { id: s.id, name: `${p.first_name} ${p.last_name}`.trim(), level: s.current_level };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Comparte con un alumno o con un nivel completo. RLS valida quién puede compartir con quién. */
export async function shareMaterial(params: { materialId: string; userId: string; studentId?: string; level?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from("material_shares").insert({
    material_id: params.materialId,
    shared_by: params.userId,
    student_id: params.studentId ?? null,
    level: params.level ?? null,
  });
  if (error?.code === "23505") return { ok: false as const, error: "Ya estaba compartido." };
  if (error) return { ok: false as const, error: "No se pudo compartir." };
  return { ok: true as const };
}

export async function unshareMaterial(shareId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("material_shares").delete().eq("id", shareId);
  return !error;
}
