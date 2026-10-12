"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils/money";
import type { PlanCategory, PublicPlan } from "@/lib/services/plans";

const CATEGORIES: PlanCategory[] = ["adults", "kids", "exam"];
const EXAM_ORDER = ["B1", "B2", "C1", "C2", "IELTS", "APTIS"];

export function frequencyLabel(sessions: number | null) {
  if (!sessions) return "";
  return sessions === 1 ? t.plans.oncePerWeek : `${sessions} ${t.plans.timesPerWeek}`;
}

function planTitle(plan: PublicPlan) {
  return plan.track === "CAMBRIDGE" ? t.plans.cambridge : frequencyLabel(plan.sessionsPerWeek);
}

/** Precios de la landing: pestañas por categoría y, en exámenes, selector de examen. */
export function PlansExplorer({ plans }: { plans: PublicPlan[] }) {
  const categories = CATEGORIES.filter((c) => plans.some((p) => p.category === c));
  const exams = EXAM_ORDER.filter((e) => plans.some((p) => p.category === "exam" && p.track === e));
  const [category, setCategory] = useState<PlanCategory>(categories[0] ?? "adults");
  const [exam, setExam] = useState(exams[0] ?? "");

  if (!plans.length) {
    return <p className="mt-10 text-muted-foreground">{t.plans.empty}</p>;
  }

  const visible = plans
    .filter((p) => p.category === category && (category !== "exam" || p.track === exam))
    // por frecuencia; a igual frecuencia, primero las clases generales (Kids antes que Cambridge)
    .sort((a, b) => (a.sessionsPerWeek ?? 0) - (b.sessionsPerWeek ?? 0) || Number(!!a.track) - Number(!!b.track));
  // con tres frecuencias se destaca la del medio
  const highlighted = visible.length === 3 ? visible[1].name : null;

  return (
    <div className="mt-10 space-y-6">
      <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-full border bg-secondary/60 p-1">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={category === c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all",
              category === c
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.plans.categories[c]}
          </button>
        ))}
      </div>

      {category === "exam" && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t.plans.examPicker}
          </p>
          <div className="flex flex-wrap gap-2">
            {exams.map((e) => (
              <button
                key={e}
                type="button"
                aria-pressed={exam === e}
                onClick={() => setExam(e)}
                className={cn(
                  "min-w-14 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all",
                  exam === e
                    ? "border-sky-500 bg-sky-50 text-sky-700 shadow-sm"
                    : "hover:border-sky-200 hover:text-sky-700",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((plan) => {
          const isHighlighted = plan.name === highlighted;
          return (
            <div key={plan.name} className={cn("relative rounded-2xl", isHighlighted && "plan-card-glow")}>
              <Card
                className={cn(
                  "relative h-full overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                  isHighlighted ? "border-0 shadow-lg shadow-sky-200/50" : "hover:border-sky-200 hover:shadow-sky-50",
                )}
              >
                {isHighlighted && (
                  <div
                    className="absolute inset-x-0 top-0 h-px"
                    style={{ background: "linear-gradient(90deg, transparent, #38bdf8, #f59e0b, transparent)" }}
                  />
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="font-heading text-xl">{planTitle(plan)}</CardTitle>
                    {isHighlighted && (
                      <Badge className="bg-sky-500 text-xs text-white hover:bg-sky-500">{t.plans.recommended}</Badge>
                    )}
                  </div>
                  {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    {plan.prices.map((price) => (
                      <p key={price.currency} className="font-heading text-3xl font-bold">
                        {formatPrice(price.currency, price.amount)}
                        <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                          {price.currency} {t.plans.perMonth}
                        </span>
                      </p>
                    ))}
                    <p className="mt-1 text-sm font-medium text-sky-600">
                      {plan.classesPerPeriod} {t.plans.classesLabel} {t.plans.perMonth}
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {t.plans.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-600">
                          ✓
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn("w-full font-semibold transition-all hover:-translate-y-0.5", isHighlighted && "shadow-md shadow-sky-200")}
                    render={<Link href="/register" />}
                  >
                    {t.plans.cta}
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
