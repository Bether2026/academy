"use client";

import { useActionState, useState } from "react";
import { submitOnboarding, type ActionState } from "../actions";
import { CEFR_LEVELS, LEARNING_GOALS } from "@/lib/validators/student";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LEVEL_HELP: Record<string, string> = {
  A1: "Recién empiezo",
  A2: "Entiendo frases simples",
  B1: "Me defiendo en conversaciones",
  B2: "Hablo con fluidez razonable",
  C1: "Me expreso con precisión",
  C2: "Dominio casi nativo",
};

function OptionGrid({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; help?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-xl border p-3 text-left transition-colors",
            value === opt.value
              ? "border-sky-500 bg-sky-50 ring-2 ring-sky-200"
              : "hover:border-sky-300",
          )}
        >
          <span className="block font-heading font-bold">{opt.label}</span>
          {opt.help && <span className="mt-0.5 block text-xs text-muted-foreground">{opt.help}</span>}
        </button>
      ))}
    </div>
  );
}

export function OnboardingForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(submitOnboarding, {});
  const [step, setStep] = useState(0);
  const [estimatedLevel, setEstimatedLevel] = useState("");
  const [targetLevel, setTargetLevel] = useState("");
  const [learningGoal, setLearningGoal] = useState("");

  const steps = [
    {
      title: "¿Cuál es tu nivel actual?",
      valid: !!estimatedLevel,
      body: (
        <OptionGrid
          options={CEFR_LEVELS.map((l) => ({ value: l, label: l, help: LEVEL_HELP[l] }))}
          value={estimatedLevel}
          onChange={setEstimatedLevel}
        />
      ),
    },
    {
      title: "¿A qué nivel querés llegar?",
      valid: !!targetLevel,
      body: (
        <OptionGrid
          options={CEFR_LEVELS.map((l) => ({ value: l, label: l, help: LEVEL_HELP[l] }))}
          value={targetLevel}
          onChange={setTargetLevel}
        />
      ),
    },
    {
      title: "¿Para qué querés el inglés?",
      valid: !!learningGoal,
      body: (
        <OptionGrid
          options={LEARNING_GOALS.map((g) => ({ value: g.value, label: g.label }))}
          value={learningGoal}
          onChange={setLearningGoal}
        />
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <form action={action} className="space-y-6">
      {/* inputs ocultos siempre presentes para que lleguen al submit */}
      <input type="hidden" name="estimatedLevel" value={estimatedLevel} />
      <input type="hidden" name="targetLevel" value={targetLevel} />
      <input type="hidden" name="learningGoal" value={learningGoal} />

      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-sky-500" : "bg-muted")}
          />
        ))}
      </div>

      <h2 className="font-heading text-lg font-semibold">{current.title}</h2>
      {current.body}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          Atrás
        </Button>
        {isLast ? (
          <Button type="submit" disabled={!current.valid || pending}>
            {pending ? "…" : "Completar"}
          </Button>
        ) : (
          <Button type="button" disabled={!current.valid} onClick={() => setStep((s) => s + 1)}>
            Siguiente
          </Button>
        )}
      </div>
    </form>
  );
}
