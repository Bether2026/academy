import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { requireOnboardedStudent } from "@/lib/services/students";
import { getMyMaterials } from "@/lib/services/materials";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Materiales" };

export default async function MaterialsPage() {
  await requireRole("student");
  await requireOnboardedStudent();
  const materials = await getMyMaterials();
  const m = t.materials;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{m.studentTitle}</h1>
        <p className="text-sm text-muted-foreground">{m.studentSubtitle}</p>
      </div>
      {materials.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {materials.map((x) => (
            <Card key={x.id}>
              <CardContent className="space-y-2 py-4">
                <div className="flex items-center gap-2">
                  {x.level && <Badge variant="outline">{x.level}</Badge>}
                  <Badge variant="secondary">{x.unit ? `${m.unit} ${x.unit}` : m.syllabus}</Badge>
                </div>
                <p className="font-medium">{x.title.replace(/ — .*$/, "")}</p>
                <a
                  href={`/api/materiales/${x.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm font-medium text-sky-700 underline"
                >
                  {m.open}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{m.studentEmpty}</p>
      )}
    </div>
  );
}
