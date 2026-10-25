import Link from "next/link";
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
    // alumnos = cuentas con rol alumno (un admin puede tener ficha de alumno de antes)
    supabase.from("profiles").select("*", head).eq("role", "student"),
    supabase
      .from("students")
      .select("id, profiles!inner(role)", head)
      .eq("onboarding_completed", true)
      .eq("profiles.role", "student"),
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
    supabase.from("withdrawal_requests").select("*", head).eq("status", "pending"),
  ]);
  const [students, onboarded, teachers, classesToday, classesCompleted, cancelled, activeSubs, unreadNotifs, pendingWithdrawals] =
    results.map((r) => r.count ?? 0);

  const METRICS = [
    { label: "Alumnos", value: students, note: `${onboarded} completaron el registro` },
    { label: "Profesores activos", value: teachers },
    { label: "Clases hoy", value: classesToday },
    { label: "Clases completadas", value: classesCompleted },
    { label: "Cancelaciones", value: cancelled },
    { label: "Suscripciones activas", value: activeSubs },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Métricas</h1>
      {pendingWithdrawals > 0 && (
        <Link href="/admin/arrepentimientos" className="block rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          ⚠️ {pendingWithdrawals} solicitud(es) de arrepentimiento pendiente(s). Hay que responder dentro de las 24 horas.
        </Link>
      )}
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
              {"note" in m && <p className="mt-1 text-xs text-muted-foreground">{m.note}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
