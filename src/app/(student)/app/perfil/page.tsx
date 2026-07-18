import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { requireOnboardedStudent } from "@/lib/services/students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm, TeacherChangeForm } from "./profile-forms";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const { user } = await requireRole("student");
  const student = await requireOnboardedStudent();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, phone, timezone, country")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-heading text-2xl font-bold">Mi perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaults={{
              firstName: profile?.first_name ?? "",
              lastName: profile?.last_name ?? "",
              email: profile?.email ?? "",
              phone: profile?.phone ?? "",
              timezone: profile?.timezone ?? "America/Argentina/Buenos_Aires",
            }}
          />
        </CardContent>
      </Card>

      {student.assigned_teacher_id && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cambio de profesor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Si sentís que tu profesor no es el indicado, pedí el cambio sin vueltas. No hace falta
              justificarlo en detalle.
            </p>
            <TeacherChangeForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
