"use client";

import { useActionState, useState } from "react";
import { addAssignment, addProgressRecord, assessLevel, type ActionState } from "../../actions";
import { PROGRESS_CATEGORIES } from "@/lib/validators/teacher";
import { CEFR_LEVELS } from "@/lib/validators/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  speaking: "Conversación",
  listening: "Comp. oral",
  reading: "Lectura",
  writing: "Escritura",
  grammar: "Gramática",
  vocabulary: "Vocabulario",
  pronunciation: "Pronunciación",
};

const selectClass =
  "border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

function ProgressForm({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addProgressRecord, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="studentId" value={studentId} />
      <div className="grid grid-cols-2 gap-3">
        <select name="category" className={selectClass} required>
          {PROGRESS_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <Input name="score" type="number" min={0} max={100} placeholder="Puntaje 0-100" required />
      </div>
      <Textarea name="notes" rows={2} placeholder="Comentario para el alumno (opcional)" />
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state.message && <p className="text-xs text-sky-700">{state.message}</p>}
      <Button size="sm" disabled={pending}>
        Registrar progreso
      </Button>
    </form>
  );
}

function AssignmentForm({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addAssignment, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="studentId" value={studentId} />
      <Input name="title" placeholder="Título de la tarea" required />
      <Textarea name="description" rows={2} placeholder="Consigna (opcional)" />
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Fecha de entrega (opcional)</label>
        <Input name="dueDate" type="date" />
      </div>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state.message && <p className="text-xs text-sky-700">{state.message}</p>}
      <Button size="sm" disabled={pending}>
        Asignar tarea
      </Button>
    </form>
  );
}

function LevelForm({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(assessLevel, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="studentId" value={studentId} />
      <select name="level" className={selectClass} required>
        {CEFR_LEVELS.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      <Textarea name="notes" rows={2} placeholder="Justificación (opcional)" />
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state.message && <p className="text-xs text-sky-700">{state.message}</p>}
      <Button size="sm" disabled={pending}>
        Actualizar nivel
      </Button>
    </form>
  );
}

const TABS = [
  { key: "progress", label: "Progreso" },
  { key: "assignment", label: "Tarea" },
  { key: "level", label: "Nivel" },
] as const;

export function StudentForms({ studentId }: { studentId: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("progress");

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-4 flex gap-1">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              tab === item.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "progress" && <ProgressForm studentId={studentId} />}
      {tab === "assignment" && <AssignmentForm studentId={studentId} />}
      {tab === "level" && <LevelForm studentId={studentId} />}
    </div>
  );
}
