import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { fmtInTz } from "@/lib/utils/dates";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForms } from "./student-forms";

export const metadata: Metadata = { title: "Ficha del alumno" };

const GOAL_LABEL: Record<string, string> = {
  work: "Trabajo y carrera",
  travel: "Viajes",
  exam: "Examen oficial",
  study: "Estudiar en el exterior",
  personal: "Crecimiento personal",
};

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireRole("teacher");
  const { id } = await params;
  const supabase = await createClient();

  // RLS garantiza que solo se vea si el alumno está asignado a este profesor
  const { data: student } = await supabase
    .from("students")
    .select("id, current_level, target_level, learning_goal, profiles:profile_id(first_name, last_name, email, country, timezone)")
    .eq("id", id)
    .maybeSingle();

  if (!student) notFound();

  const p = student.profiles as unknown as {
    first_name: string;
    last_name: string;
    email: string;
    country: string;
    timezone: string;
  };

  const { data: teacherProfile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();
  const tz = teacherProfile?.timezone ?? "UTC";

  const [{ data: classes }, { data: progress }, { data: assignments }, { data: levels }] =
    await Promise.all([
      supabase
        .from("classes")
        .select("id, scheduled_at, status, teacher_notes")
        .eq("student_id", id)
        .order("scheduled_at", { ascending: false })
        .limit(10),
      supabase
        .from("progress_records")
        .select("category, score, notes, created_at")
        .eq("student_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("assignments")
        .select("title, status, due_date")
        .eq("student_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("student_level_history")
        .select("level, evaluated_at, source")
        .eq("student_id", id)
        .order("evaluated_at", { ascending: false })
        .limit(5),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          {p.first_name} {p.last_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {p.email} · {p.country === "AR" ? "Argentina" : "España"} ·{" "}
          <Badge variant="secondary">{student.current_level ?? "—"}</Badge> →{" "}
          <Badge variant="outline">{student.target_level ?? "—"}</Badge> ·{" "}
          {GOAL_LABEL[student.learning_goal ?? ""] ?? "Sin objetivo definido"}
        </p>
      </div>

      <StudentForms studentId={student.id} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas clases</CardTitle>
          </CardHeader>
          <CardContent>
            {classes?.length ? (
              <ul className="divide-y text-sm">
                {classes.map((c) => (
                  <li key={c.id} className="py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="capitalize">{fmtInTz(c.scheduled_at, tz, "d MMM yyyy, HH:mm")}</span>
                      <Badge variant="secondary">{c.status}</Badge>
                    </div>
                    {c.teacher_notes && (
                      <p className="mt-1 text-xs text-muted-foreground">📝 {c.teacher_notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin clases todavía.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progreso reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {progress?.length ? (
              <ul className="divide-y text-sm">
                {progress.map((r, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5">
                    <span>{r.category}</span>
                    <span className="font-medium">{r.score}/100</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin registros todavía.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tareas</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments?.length ? (
              <ul className="divide-y text-sm">
                {assignments.map((a, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5">
                    <span>{a.title}</span>
                    <Badge variant="secondary">{a.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin tareas asignadas.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de nivel</CardTitle>
          </CardHeader>
          <CardContent>
            {levels?.length ? (
              <ul className="divide-y text-sm">
                {levels.map((l, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5">
                    <Badge>{l.level}</Badge>
                    <span className="text-muted-foreground">
                      {fmtInTz(l.evaluated_at, tz, "d MMM yyyy")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin evaluaciones.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
