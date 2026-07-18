import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { requireOnboardedStudent } from "@/lib/services/students";
import { CLASS_POLICY } from "@/lib/services/policy";
import { fmtInTz } from "@/lib/utils/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cancelOwnClass } from "../actions";

export const metadata: Metadata = { title: "Mis clases" };

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "Ausente",
  rescheduled: "Reprogramada",
};

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ reservada?: string }>;
}) {
  const { user } = await requireRole("student");
  await requireOnboardedStudent();
  const { reservada } = await searchParams;
  const supabase = await createClient();

  const nowIso = new Date().toISOString();
  const [{ data: profile }, { data: upcoming }, { data: history }] = await Promise.all([
    supabase.from("profiles").select("timezone").eq("id", user.id).single(),
    supabase
      .from("classes_student")
      .select("id, scheduled_at, status, meeting_url")
      .in("status", ["scheduled", "confirmed"])
      .gte("scheduled_at", nowIso)
      .order("scheduled_at"),
    supabase
      .from("classes_student")
      .select("id, scheduled_at, status")
      .or(`scheduled_at.lt.${nowIso},status.in.(completed,cancelled,no_show)`)
      .order("scheduled_at", { ascending: false })
      .limit(20),
  ]);

  const tz = profile?.timezone ?? "UTC";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-2xl font-bold">Mis clases</h1>
        <Button render={<Link href="/app/clases/reservar" />}>Reservar clase</Button>
      </div>

      {reservada && (
        <p className="rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-900">
          ✈️ ¡Clase reservada! Te llega la confirmación por email.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Próximas</h2>
        {upcoming?.length ? (
          upcoming.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
                <div>
                  <p className="font-medium capitalize">{fmtInTz(c.scheduled_at, tz)}</p>
                  <Badge variant="secondary" className="mt-1">
                    {STATUS_LABEL[c.status] ?? c.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {c.meeting_url && (
                    <Button size="sm" render={<a href={c.meeting_url} target="_blank" />}>
                      Entrar
                    </Button>
                  )}
                  <form action={cancelOwnClass}>
                    <input type="hidden" name="classId" value={c.id} />
                    <Button size="sm" variant="outline" type="submit">
                      Cancelar
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No tenés clases agendadas.</p>
        )}
        <p className="text-xs text-muted-foreground">
          Cancelación sin costo hasta {CLASS_POLICY.freeCancellationHours} h antes. Con menos
          anticipación, la clase se considera tomada.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Historial</h2>
        {history?.length ? (
          <ul className="divide-y rounded-xl border bg-card">
            {history.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="capitalize">{fmtInTz(c.scheduled_at, tz, "d MMM yyyy, HH:mm")}</span>
                <Badge variant="secondary">{STATUS_LABEL[c.status] ?? c.status}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no tuviste clases.</p>
        )}
      </section>
    </div>
  );
}
