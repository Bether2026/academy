"use client";

import { useActionState, useState } from "react";
import { assignTeacher, setUserRole, type ActionState } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  country: string;
};

type Student = { id: string; assigned_teacher_id: string | null; current_level: string | null };

const selectClass =
  "border-input h-8 rounded-md border bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

const ROLE_LABEL: Record<string, string> = {
  student: "Alumno",
  teacher: "Profesor",
  admin: "Admin",
  super_admin: "Super admin",
};

export function UserRow({
  profile,
  student,
  teacherOptions,
}: {
  profile: Profile;
  student: Student | null;
  teacherOptions: { id: string; name: string }[];
}) {
  const [roleState, roleAction, rolePending] = useActionState<ActionState, FormData>(setUserRole, {});
  const [assignState, assignAction, assignPending] = useActionState<ActionState, FormData>(assignTeacher, {});
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardContent className="space-y-3 py-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">
              {profile.first_name} {profile.last_name}{" "}
              <span className="font-normal text-muted-foreground">· {profile.email}</span>
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <Badge variant="secondary">{ROLE_LABEL[profile.role] ?? profile.role}</Badge>
              <Badge variant="outline">{profile.country}</Badge>
              {student?.current_level && <Badge variant="outline">{student.current_level}</Badge>}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
            {open ? "Cerrar" : "Gestionar"}
          </Button>
        </div>

        {open && (
          <div className="flex flex-wrap gap-6 rounded-lg bg-muted/50 p-3">
            <form action={roleAction} className="flex items-end gap-2">
              <input type="hidden" name="profileId" value={profile.id} />
              <div className="space-y-1">
                <label className="text-xs font-medium">Rol</label>
                <select name="role" defaultValue={profile.role} className={selectClass}>
                  <option value="student">Alumno</option>
                  <option value="teacher">Profesor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button size="sm" disabled={rolePending}>
                Cambiar rol
              </Button>
              {roleState.error && <p className="text-xs text-destructive">{roleState.error}</p>}
              {roleState.message && <p className="text-xs text-sky-700">{roleState.message}</p>}
            </form>

            {student && (
              <form action={assignAction} className="flex items-end gap-2">
                <input type="hidden" name="studentId" value={student.id} />
                <div className="space-y-1">
                  <label className="text-xs font-medium">Profesor asignado</label>
                  <select
                    name="teacherId"
                    defaultValue={student.assigned_teacher_id ?? "none"}
                    className={selectClass}
                  >
                    <option value="none">Sin asignar</option>
                    {teacherOptions.map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button size="sm" disabled={assignPending}>
                  Asignar
                </Button>
                {assignState.error && <p className="text-xs text-destructive">{assignState.error}</p>}
                {assignState.message && <p className="text-xs text-sky-700">{assignState.message}</p>}
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
