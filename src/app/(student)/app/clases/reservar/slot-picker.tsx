"use client";

import { useActionState, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { bookSlot, type ActionState } from "../../actions";
import type { Slot } from "@/lib/services/scheduling";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SlotPicker({ slots }: { slots: Slot[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(bookSlot, {});
  const [selected, setSelected] = useState<string>("");

  const byDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      map.set(s.labelDate, [...(map.get(s.labelDate) ?? []), s]);
    }
    return [...map.entries()];
  }, [slots]);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="startUtc" value={selected} />
      <div className="space-y-5">
        {byDate.map(([date, daySlots]) => (
          <div key={date}>
            <h2 className="mb-2 font-heading text-sm font-semibold capitalize">
              {format(parseISO(date), "EEEE d 'de' MMMM", { locale: es })}
            </h2>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((slot) => (
                <button
                  key={slot.startUtc}
                  type="button"
                  onClick={() => setSelected(slot.startUtc)}
                  className={cn(
                    "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                    selected === slot.startUtc
                      ? "border-sky-500 bg-sky-500 text-white"
                      : "bg-card hover:border-sky-300",
                  )}
                >
                  {slot.labelTime}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={!selected || pending} size="lg">
        {pending ? "Reservando…" : "Confirmar reserva"}
      </Button>
    </form>
  );
}
