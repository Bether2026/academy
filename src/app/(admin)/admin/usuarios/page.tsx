import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentPlanCoverage } from "@/lib/services/subscriptions";
import { UserRow } from "./user-row";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsersPage() {
  await requireRole("admin", "super_admin");
  const supabase = await createClient();

  const [{ data: profiles }, { data: students }, { data: teachers }, { data: plans }, coverage] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role, country, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("students").select("id, profile_id, assigned_teacher_id, current_level"),
    supabase
      .from("teachers")
      .select("id, profile_id, is_active, profiles:profile_id(first_name, last_name)"),
    supabase
      .from("plans")
      .select("id, name, price, currency")
      .eq("is_active", true)
      .order("category")
      .order("track")
      .order("sessions_per_week"),
    getStudentPlanCoverage(),
  ]);

  const studentByProfile = new Map(
    (students ?? []).map((s) => [s.profile_id, s]),
  );
  const activeTeacherProfiles = new Set(
    (teachers ?? []).filter((tr) => tr.is_active).map((tr) => tr.profile_id),
  );
  const teacherOptions = (teachers ?? []).filter((tr) => tr.is_active).map((tr) => {
    const p = tr.profiles as unknown as { first_name: string; last_name: string };
    return { id: tr.id, name: `${p.first_name} ${p.last_name}`.trim() || tr.id.slice(0, 8) };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          {profiles?.length ?? 0} usuarios. Cambios de rol aplican en el próximo inicio de sesión.
        </p>
      </div>
      <div className="space-y-2">
        {(profiles ?? []).map((p) => (
          <UserRow
            key={p.id}
            profile={p}
            student={studentByProfile.get(p.id) ?? null}
            teacherOptions={teacherOptions}
            teaches={activeTeacherProfiles.has(p.id)}
            plans={(plans ?? []).filter((pl) => pl.currency.trim() === (p.country === "ES" ? "EUR" : "ARS"))}
            coverage={coverage.get(studentByProfile.get(p.id)?.id ?? "") ?? null}
          />
        ))}
      </div>
    </div>
  );
}
