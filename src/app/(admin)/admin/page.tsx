import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
  await requireRole("admin", "super_admin");
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const head = { count: "exact" as const, head: true };
  const results = await Promise.all([
    supabase.from("students").select("*", head),
    supabase.from("teachers").select("*", head).eq("is_active", true),
    supabase
      .from("classes")
      .select("*", head)
      .gte("scheduled_at", todayStart.toISOString())
      .lt("scheduled_at", todayEnd.toISOString()),
    supabase.from("classes").select("*", head).eq("status", "completed"),
    supabase.from("classes").select("*", head).eq("status", "cancelled"),
    supabase.from("subscriptions").select("*", head).eq("status", "active"),
    supabase
      .from("notifications")
      .select("*", head)
      .eq("type", "teacher_change_request")
      .is("read_at", null),
  ]);
  const [students, teachers, classesToday, classesCompleted, cancelled, activeSubs, unreadNotifs] =
    results.map((r) => r.count ?? 0);

  const METRICS = [
    { label: "Alumnos", value: students },
    { label: "Profesores activos", value: teachers },
    { label: "Clases hoy", value: classesToday },
    { label: "Clases completadas", value: classesCompleted },
    { label: "Cancelaciones", value: cancelled },
    { label: "Suscripciones activas", value: activeSubs },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Métricas</h1>
      {unreadNotifs > 0 && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚠️ {unreadNotifs} solicitud(es) de cambio de profesor sin atender.
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {METRICS.map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-bold">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Ingresos y retención se habilitan con la integración de pagos (Fase 6).
      </p>
    </div>
  );
}
