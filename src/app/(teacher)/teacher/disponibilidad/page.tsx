import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOwnTeacher } from "@/lib/services/teachers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { removeAvailability } from "../actions";
import { AvailabilityForm } from "./availability-form";

export const metadata: Metadata = { title: "Disponibilidad" };

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function AvailabilityPage() {
  const { user } = await requireRole("teacher");
  const teacher = await getOwnTeacher();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const { data: slots } = teacher
    ? await supabase
        .from("teacher_availability")
        .select("id, day_of_week, start_time, end_time")
        .eq("teacher_id", teacher.id)
        .eq("is_active", true)
        .order("day_of_week")
        .order("start_time")
    : { data: [] };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Mi disponibilidad</h1>
        <p className="text-sm text-muted-foreground">
          Franjas semanales en tu zona horaria ({profile?.timezone}). Los alumnos reservan clases en
          punto dentro de estas franjas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar franja</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Franjas activas</CardTitle>
        </CardHeader>
        <CardContent>
          {slots?.length ? (
            <ul className="divide-y">
              {slots.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>
                    <span className="font-medium">{DAYS[s.day_of_week]}</span>{" "}
                    {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                  </span>
                  <form action={removeAvailability}>
                    <input type="hidden" name="id" value={s.id} />
                    <Button size="sm" variant="ghost" type="submit">
                      Quitar
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin franjas cargadas: los alumnos no pueden reservar clases con vos todavía.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
