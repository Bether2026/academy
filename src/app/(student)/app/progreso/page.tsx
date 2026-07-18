import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { requireOnboardedStudent } from "@/lib/services/students";
import { fmtInTz } from "@/lib/utils/dates";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Mi progreso" };

const CATEGORY_LABEL: Record<string, string> = {
  speaking: "Conversación",
  listening: "Comprensión oral",
  reading: "Lectura",
  writing: "Escritura",
  grammar: "Gramática",
  vocabulary: "Vocabulario",
  pronunciation: "Pronunciación",
};

export default async function ProgressPage() {
  const { user } = await requireRole("student");
  const student = await requireOnboardedStudent();
  const supabase = await createClient();

  const [{ data: profile }, { data: records }, { data: levelHistory }] = await Promise.all([
    supabase.from("profiles").select("timezone").eq("id", user.id).single(),
    supabase
      .from("progress_records")
      .select("id, category, score, notes, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("student_level_history")
      .select("level, evaluated_at, source")
      .order("evaluated_at", { ascending: false }),
  ]);

  const tz = profile?.timezone ?? "UTC";

  // Último puntaje por categoría
  const latestByCategory = new Map<string, { score: number; date: string }>();
  for (const r of records ?? []) {
    if (!latestByCategory.has(r.category)) {
      latestByCategory.set(r.category, { score: r.score, date: r.created_at });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Mi progreso</h1>
        <p className="text-sm text-muted-foreground">
          Nivel actual <Badge variant="secondary">{student.current_level ?? "—"}</Badge> → objetivo{" "}
          <Badge variant="secondary">{student.target_level ?? "—"}</Badge>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por habilidad</CardTitle>
        </CardHeader>
        <CardContent>
          {latestByCategory.size ? (
            <div className="space-y-3">
              {[...latestByCategory.entries()].map(([category, { score }]) => (
                <div key={category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{CATEGORY_LABEL[category] ?? category}</span>
                    <span className="text-muted-foreground">{score}/100</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tu profesor va a registrar tu avance por habilidad después de las primeras clases.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de nivel</CardTitle>
        </CardHeader>
        <CardContent>
          {levelHistory?.length ? (
            <ul className="divide-y">
              {levelHistory.map((h, i) => (
                <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <Badge>{h.level}</Badge>
                  <span className="text-muted-foreground">
                    {fmtInTz(h.evaluated_at, tz, "d 'de' MMMM yyyy")} ·{" "}
                    {h.source === "self_assessment" ? "autoevaluación" : "evaluación del profesor"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sin evaluaciones registradas todavía.</p>
          )}
        </CardContent>
      </Card>

      {records?.some((r) => r.notes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comentarios de tu profesor</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {records
                .filter((r) => r.notes)
                .slice(0, 10)
                .map((r) => (
                  <li key={r.id} className="rounded-lg bg-muted/60 p-3 text-sm">
                    <p>{r.notes}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {CATEGORY_LABEL[r.category] ?? r.category} ·{" "}
                      {fmtInTz(r.created_at, tz, "d MMM yyyy")}
                    </p>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
