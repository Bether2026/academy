import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOwnTeacher } from "@/lib/services/teachers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Mis alumnos" };

export default async function TeacherStudentsPage() {
  await requireRole("teacher");
  const teacher = await getOwnTeacher();
  const supabase = await createClient();

  const { data: students } = teacher
    ? await supabase
        .from("students")
        .select("id, current_level, target_level, learning_goal, profiles:profile_id(first_name, last_name, country)")
        .eq("assigned_teacher_id", teacher.id)
        .order("created_at")
    : { data: [] };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Mis alumnos</h1>
      {students?.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {students.map((s) => {
            const p = s.profiles as unknown as { first_name: string; last_name: string; country: string };
            return (
              <Link key={s.id} href={`/teacher/alumnos/${s.id}`}>
                <Card className="transition-colors hover:border-sky-300">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.country === "AR" ? "Argentina" : p.country === "ES" ? "España" : p.country}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant="secondary">{s.current_level ?? "—"}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="outline">{s.target_level ?? "—"}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no tenés alumnos asignados.</p>
      )}
    </div>
  );
}
