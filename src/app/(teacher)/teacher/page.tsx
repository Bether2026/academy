import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOwnTeacher } from "@/lib/services/teachers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClassRow } from "./class-row";

export default async function TeacherAgenda() {
  const { user } = await requireRole("teacher");
  const teacher = await getOwnTeacher();
  const supabase = await createClient();

  if (!teacher) {
    return (
      <p className="text-sm text-muted-foreground">
        Tu perfil de profesor todavía no está activado. Contactá a administración.
      </p>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, timezone")
    .eq("id", user.id)
    .single();
  const tz = profile?.timezone ?? "UTC";

  const { data: upcoming } = await supabase
    .from("classes")
    .select("id, scheduled_at, status, meeting_url, teacher_notes, student_id, students:student_id(id, profiles:profile_id(first_name, last_name))")
    .in("status", ["scheduled", "confirmed"])
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at")
    .limit(30);

  const { data: toClose } = await supabase
    .from("classes")
    .select("id, scheduled_at, status, teacher_notes, student_id, students:student_id(id, profiles:profile_id(first_name, last_name))")
    .in("status", ["scheduled", "confirmed"])
    .lt("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold">
        Agenda{profile?.first_name ? ` de ${profile.first_name}` : ""}
      </h1>

      {toClose?.length ? (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">
            Por cerrar <Badge variant="secondary">{toClose.length}</Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            Clases pasadas sin estado final: marcalas como completadas o ausencia y dejá tus notas.
          </p>
          {toClose.map((c) => (
            <ClassRow key={c.id} cls={JSON.parse(JSON.stringify(c))} tz={tz} closable />
          ))}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Próximas clases</h2>
        {upcoming?.length ? (
          upcoming.map((c) => <ClassRow key={c.id} cls={JSON.parse(JSON.stringify(c))} tz={tz} />)
        ) : (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No tenés clases agendadas. Verificá tu{" "}
              <Link href="/teacher/disponibilidad" className="text-sky-700 underline">
                disponibilidad
              </Link>{" "}
              para que los alumnos puedan reservar.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
