import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { fmtInTz } from "@/lib/utils/dates";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Clases" };

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "Ausente",
  rescheduled: "Reprogramada",
};

export default async function AdminClassesPage() {
  const { user } = await requireRole("admin", "super_admin");
  const supabase = await createClient();

  const [{ data: profile }, { data: classes }] = await Promise.all([
    supabase.from("profiles").select("timezone").eq("id", user.id).single(),
    supabase
      .from("classes")
      .select(
        "id, scheduled_at, status, students:student_id(profiles:profile_id(first_name, last_name)), teachers:teacher_id(profiles:profile_id(first_name, last_name))",
      )
      .order("scheduled_at", { ascending: false })
      .limit(100),
  ]);

  const tz = profile?.timezone ?? "UTC";

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Clases</h1>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Alumno</TableHead>
              <TableHead>Profesor</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(classes ?? []).map((c) => {
              const student = c.students as unknown as {
                profiles: { first_name: string; last_name: string };
              } | null;
              const teacher = c.teachers as unknown as {
                profiles: { first_name: string; last_name: string };
              } | null;
              return (
                <TableRow key={c.id}>
                  <TableCell className="capitalize">
                    {fmtInTz(c.scheduled_at, tz, "d MMM yyyy, HH:mm")}
                  </TableCell>
                  <TableCell>
                    {student ? `${student.profiles.first_name} ${student.profiles.last_name}` : "—"}
                  </TableCell>
                  <TableCell>
                    {teacher ? `${teacher.profiles.first_name} ${teacher.profiles.last_name}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{STATUS_LABEL[c.status] ?? c.status}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {!classes?.length && (
          <p className="px-4 py-6 text-sm text-muted-foreground">Sin clases registradas.</p>
        )}
      </div>
    </div>
  );
}
