"use client";

import { useActionState } from "react";
import { submitTeacherChange, updateProfile, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TIMEZONES = [
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (Buenos Aires)" },
  { value: "Europe/Madrid", label: "España (Madrid)" },
  { value: "Atlantic/Canary", label: "España (Canarias)" },
];

export function ProfileForm({
  defaults,
}: {
  defaults: { firstName: string; lastName: string; email: string; phone: string; timezone: string };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, {});

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre</Label>
          <Input id="firstName" name="firstName" defaultValue={defaults.firstName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido</Label>
          <Input id="lastName" name="lastName" defaultValue={defaults.lastName} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={defaults.email} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono (opcional)</Label>
        <Input id="phone" name="phone" defaultValue={defaults.phone} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone">Zona horaria</Label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={defaults.timezone}
          className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Todos los horarios de clases se muestran en esta zona.
        </p>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.message && <p className="text-sm text-sky-700">{state.message}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "…" : "Guardar cambios"}
      </Button>
    </form>
  );
}

export function TeacherChangeForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(submitTeacherChange, {});

  if (state.message) return <p className="text-sm text-sky-700">{state.message}</p>;

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="reason">Motivo</Label>
        <Textarea id="reason" name="reason" rows={3} placeholder="Contanos brevemente qué buscás…" required />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "…" : "Solicitar cambio"}
      </Button>
    </form>
  );
}
