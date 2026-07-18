"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { updateClass, type ActionState } from "./actions";
import { fmtInTz } from "@/lib/utils/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ClassData = {
  id: string;
  scheduled_at: string;
  status: string;
  meeting_url?: string | null;
  teacher_notes: string | null;
  students: { id: string; profiles: { first_name: string; last_name: string } } | null;
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
};

export function ClassRow({ cls, tz, closable = false }: { cls: ClassData; tz: string; closable?: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateClass, {});
  const [open, setOpen] = useState(false);
  const student = cls.students;

  return (
    <Card>
      <CardContent className="space-y-3 py-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium capitalize">{fmtInTz(cls.scheduled_at, tz)}</p>
            {student && (
              <Link href={`/teacher/alumnos/${student.id}`} className="text-sky-700 hover:underline">
                {student.profiles.first_name} {student.profiles.last_name}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{STATUS_LABEL[cls.status] ?? cls.status}</Badge>
            <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
              {open ? "Cerrar" : closable ? "Cerrar clase" : "Gestionar"}
            </Button>
          </div>
        </div>

        {open && (
          <form action={action} className="space-y-3 rounded-lg bg-muted/50 p-3">
            <input type="hidden" name="classId" value={cls.id} />
            {!closable && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Enlace de videollamada (Meet/Zoom)</label>
                <Input
                  name="meetingUrl"
                  type="url"
                  placeholder="https://meet.google.com/…"
                  defaultValue={cls.meeting_url ?? ""}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Notas privadas (el alumno no las ve)</label>
              <Textarea name="teacherNotes" rows={2} defaultValue={cls.teacher_notes ?? ""} />
            </div>
            {closable ? (
              <div className="flex gap-2">
                <Button size="sm" name="status" value="completed" disabled={pending}>
                  Completada
                </Button>
                <Button size="sm" variant="outline" name="status" value="no_show" disabled={pending}>
                  Ausente
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" disabled={pending}>
                  Guardar
                </Button>
                {cls.status === "scheduled" && (
                  <Button size="sm" variant="outline" name="status" value="confirmed" disabled={pending}>
                    Confirmar clase
                  </Button>
                )}
              </div>
            )}
            {state.error && <p className="text-xs text-destructive">{state.error}</p>}
            {state.message && <p className="text-xs text-sky-700">{state.message}</p>}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
