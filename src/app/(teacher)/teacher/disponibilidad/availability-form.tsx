"use client";

import { useActionState } from "react";
import { addAvailability, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export function AvailabilityForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(addAvailability, {});

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium">Día</label>
        <select
          name="dayOfWeek"
          className="border-input h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          required
        >
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Desde</label>
        <Input name="startTime" type="time" step={3600} defaultValue="09:00" required className="w-28" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Hasta</label>
        <Input name="endTime" type="time" step={3600} defaultValue="12:00" required className="w-28" />
      </div>
      <Button disabled={pending}>{pending ? "…" : "Agregar"}</Button>
      {state.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
      {state.message && <p className="w-full text-xs text-sky-700">{state.message}</p>}
    </form>
  );
}
