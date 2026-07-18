import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentDashboard() {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Hola{profile?.first_name ? `, ${profile.first_name}` : ""} 👋
        </h1>
        <p className="text-muted-foreground">Tu espacio de aprendizaje.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próxima clase</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            El onboarding y la reserva de clases llegan en la Fase 3.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tu progreso</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Acá vas a ver tu nivel y tu avance por habilidad.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
