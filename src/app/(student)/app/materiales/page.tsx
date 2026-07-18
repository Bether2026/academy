import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { requireOnboardedStudent } from "@/lib/services/students";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Materiales" };

const TYPE_LABEL: Record<string, string> = {
  document: "Documento",
  video: "Video",
  audio: "Audio",
  link: "Enlace",
  exercise: "Ejercicio",
};

export default async function MaterialsPage() {
  await requireRole("student");
  const student = await requireOnboardedStudent();
  const supabase = await createClient();

  let query = supabase
    .from("learning_materials")
    .select("id, title, description, type, url, level")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (student.current_level) {
    query = query.or(`level.eq.${student.current_level},level.is.null`);
  }
  const { data: materials } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Materiales</h1>
        <p className="text-sm text-muted-foreground">
          Recursos para tu nivel{student.current_level ? ` (${student.current_level})` : ""}.
        </p>
      </div>
      {materials?.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {materials.map((m) => (
            <Card key={m.id}>
              <CardContent className="space-y-2 py-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{TYPE_LABEL[m.type] ?? m.type}</Badge>
                  {m.level && <Badge variant="outline">{m.level}</Badge>}
                </div>
                <p className="font-medium">{m.title}</p>
                {m.description && (
                  <p className="text-sm text-muted-foreground">{m.description}</p>
                )}
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm font-medium text-sky-700 underline"
                >
                  Abrir material
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Todavía no hay materiales publicados para tu nivel.
        </p>
      )}
    </div>
  );
}
