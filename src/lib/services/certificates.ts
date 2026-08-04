import "server-only";
import { createClient } from "@/lib/supabase/server";

export const CLASSES_REQUIRED = 20;

export type CertificateEligibility = {
  eligible: boolean;
  completedClasses: number;
  required: number;
  studentName: string;
  level: string | null;
};

export async function getCertificateEligibility(userId: string): Promise<CertificateEligibility> {
  const supabase = await createClient();

  const [{ data: profile }, { data: student }] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name").eq("id", userId).single(),
    supabase.from("students").select("id, current_level").eq("profile_id", userId).single(),
  ]);

  if (!student) {
    return { eligible: false, completedClasses: 0, required: CLASSES_REQUIRED, studentName: "", level: null };
  }

  const { count } = await supabase
    .from("classes_student")
    .select("id", { count: "exact", head: true })
    .eq("status", "completed");

  const completedClasses = count ?? 0;
  const studentName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();

  return {
    eligible: completedClasses >= CLASSES_REQUIRED,
    completedClasses,
    required: CLASSES_REQUIRED,
    studentName,
    level: student.current_level ?? null,
  };
}
