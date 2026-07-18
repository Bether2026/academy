import "server-only";
import { createClient } from "@/lib/supabase/server";

export type TeacherRecord = { id: string; profile_id: string };

/** Ficha de profesor del usuario logueado. */
export async function getOwnTeacher(): Promise<TeacherRecord | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("teachers")
    .select("id, profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();
  return (data as TeacherRecord) ?? null;
}
