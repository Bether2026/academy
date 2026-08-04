import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOwnStudent } from "@/lib/services/students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatPractice } from "./chat";

export default async function PracticaPage() {
  await requireRole("student");
  const student = await getOwnStudent();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("first_name").eq("id", user.id).single()
    : { data: null };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold">Práctica de conversación</h1>
          <p className="text-sm text-muted-foreground">
            Practicá inglés en tiempo real con tu asistente IA.
          </p>
        </div>
        {student?.current_level && (
          <Badge variant="secondary">Nivel {student.current_level}</Badge>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChatPractice level={student?.current_level ?? undefined} />
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm">Cómo aprovechar la práctica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>💬 Escribí en inglés, sin miedo a equivocarte.</p>
            <p>📝 El tutor corregirá tus errores de forma constructiva.</p>
            <p>🎯 Pedile que te explique grammatica, vocabulario o pronunciación.</p>
            <p>✈️ Practicá situaciones reales: trabajo, viajes, entrevistas.</p>
            <p>🔄 Usá &ldquo;Nueva conversación&rdquo; para cambiar de tema.</p>
            <hr className="my-2" />
            <p className="text-xs">
              Esta práctica complementa tus clases con{" "}
              {profile?.first_name ? `tu profesor, ${profile.first_name}` : "tu profesor"}. No reemplaza la interacción humana.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
