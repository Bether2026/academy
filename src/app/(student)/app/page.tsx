import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { requireOnboardedStudent } from "@/lib/services/students";
import { fmtInTz } from "@/lib/utils/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { markAssignmentSubmitted } from "./actions";

export default async function StudentDashboard() {
  const { user } = await requireRole("student");
  const student = await requireOnboardedStudent();
  const supabase = await createClient();

  const [{ data: profile }, { data: nextClasses }, { data: assignments }, { data: teacher }] =
    await Promise.all([
      supabase.from("profiles").select("first_name, timezone").eq("id", user.id).single(),
      supabase
        .from("classes_student")
        .select("id, scheduled_at, status, meeting_url")
        .in("status", ["scheduled", "confirmed"])
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at")
        .limit(1),
      supabase
        .from("assignments")
        .select("id, title, due_date, status")
        .in("status", ["pending", "overdue"])
        .order("due_date", { ascending: true })
        .limit(5),
      student.assigned_teacher_id
        ? supabase
            .from("teachers_public")
            .select("first_name, last_name")
            .eq("id", student.assigned_teacher_id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

  const tz = profile?.timezone ?? "UTC";
  const next = nextClasses?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Hola{profile?.first_name ? `, ${profile.first_name}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Nivel actual <Badge variant="secondary">{student.current_level ?? "—"}</Badge>{" "}
            → objetivo <Badge variant="secondary">{student.target_level ?? "—"}</Badge>
          </p>
        </div>
        <Button render={<Link href="/app/clases/reservar" />}>Reservar clase</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className={next ? "border-sky-400" : ""}>
          <CardHeader>
            <CardTitle className="text-base">Próxima clase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {next ? (
              <>
                <p className="font-medium capitalize">{fmtInTz(next.scheduled_at, tz)}</p>
                {teacher && (
                  <p className="text-muted-foreground">
                    con {teacher.first_name} {teacher.last_name}
                  </p>
                )}
                {next.meeting_url ? (
                  <Button size="sm" render={<a href={next.meeting_url} target="_blank" />}>
                    Entrar a la clase
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    El enlace de videollamada aparece acá antes de la clase.
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">
                No tenés clases agendadas.{" "}
                <Link href="/app/clases/reservar" className="text-sky-700 underline">
                  Reservá tu próxima clase
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tu profesor</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {teacher ? (
              <p className="font-medium">
                {teacher.first_name} {teacher.last_name}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Te estamos asignando un profesor según tu nivel y objetivo. Te avisamos por email.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tareas pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments?.length ? (
            <ul className="divide-y">
              {assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    {a.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Entrega: {fmtInTz(a.due_date, tz, "d 'de' MMMM")}
                      </p>
                    )}
                  </div>
                  <form action={markAssignmentSubmitted}>
                    <input type="hidden" name="assignmentId" value={a.id} />
                    <Button size="sm" variant="outline" type="submit">
                      Marcar entregada
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sin tareas pendientes. 🎉</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
