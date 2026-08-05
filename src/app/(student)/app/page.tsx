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

  const [{ data: profile }, { data: nextClasses }, { data: assignments }, { data: teacher }, { count: completedCount }] =
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
      supabase
        .from("classes_student")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed"),
    ]);

  const tz = profile?.timezone ?? "UTC";
  const next = nextClasses?.[0];
  const firstName = profile?.first_name ?? "";
  const initials = firstName ? firstName[0].toUpperCase() : "A";

  return (
    <div className="space-y-6">

      {/* ── Greeting ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar initials */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #1d4ed8)" }}
          >
            {initials}
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold leading-tight">
              Hola{firstName ? `, ${firstName}` : ""} 👋
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>Nivel</span>
              <Badge variant="secondary" className="text-xs">{student.current_level ?? "—"}</Badge>
              <span>→ objetivo</span>
              <Badge variant="secondary" className="text-xs">{student.target_level ?? "—"}</Badge>
            </div>
          </div>
        </div>
        <Button
          className="font-semibold shadow-sm"
          render={<Link href="/app/clases/reservar" />}
        >
          Reservar clase
        </Button>
      </div>

      {/* ── Stats chips ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatChip
          label="Clases completadas"
          value={String(completedCount ?? 0)}
          accent="sky"
        />
        <StatChip
          label="Nivel actual"
          value={student.current_level ?? "—"}
          accent="indigo"
        />
        <StatChip
          label="Objetivo"
          value={student.target_level ?? "—"}
          accent="amber"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* ── Próxima clase + Profesor ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Próxima clase */}
        <Card className={`overflow-hidden ${next ? "border-sky-200" : ""}`}>
          {next && (
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #38bdf8, #1d4ed8)" }} />
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Próxima clase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {next ? (
              <>
                <p className="font-heading text-base font-bold capitalize">
                  {fmtInTz(next.scheduled_at, tz)}
                </p>
                {teacher && (
                  <p className="text-xs text-muted-foreground">
                    con {teacher.first_name} {teacher.last_name}
                  </p>
                )}
                {next.meeting_url ? (
                  <Button
                    size="sm"
                    className="w-full"
                    render={<a href={next.meeting_url} target="_blank" />}
                  >
                    Entrar a la clase →
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    El enlace aparece acá antes de la clase.
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">No tenés clases agendadas.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  render={<Link href="/app/clases/reservar" />}
                >
                  Reservar ahora
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profesor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Tu profesor
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {teacher ? (
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
                >
                  {teacher.first_name[0]}
                </div>
                <div>
                  <p className="font-semibold">
                    {teacher.first_name} {teacher.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">Tu profesor asignado</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Te estamos asignando un profesor según tu nivel y objetivo. Te avisamos por email.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Tareas pendientes ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Tareas pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments?.length ? (
            <ul className="divide-y">
              {assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.title}</p>
                    {a.due_date && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Entrega: {fmtInTz(a.due_date, tz, "d 'de' MMMM")}
                      </p>
                    )}
                  </div>
                  <form action={markAssignmentSubmitted}>
                    <input type="hidden" name="assignmentId" value={a.id} />
                    <Button size="sm" variant="outline" type="submit" className="shrink-0">
                      Entregada ✓
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <span className="text-base">🎉</span>
              <span>Sin tareas pendientes.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick links ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/app/clases", label: "Mis clases", icon: "📅" },
          { href: "/app/progreso", label: "Progreso", icon: "📈" },
          { href: "/app/practica", label: "Práctica IA", icon: "🤖" },
          { href: "/app/materiales", label: "Materiales", icon: "📚" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col items-center gap-1.5 rounded-xl border bg-card p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-50"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  accent,
  className = "",
}: {
  label: string;
  value: string;
  accent: "sky" | "indigo" | "amber";
  className?: string;
}) {
  const colors = {
    sky: "from-sky-50 border-sky-100 text-sky-700",
    indigo: "from-indigo-50 border-indigo-100 text-indigo-700",
    amber: "from-amber-50 border-amber-100 text-amber-700",
  };
  return (
    <div
      className={`rounded-xl border bg-gradient-to-br to-white p-3 ${colors[accent]} ${className}`}
    >
      <p className="font-heading text-xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs opacity-75">{label}</p>
    </div>
  );
}
