"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { frequencyLabel } from "@/components/features/plans-explorer";
import { t } from "@/lib/i18n";
import { startCheckout } from "./actions";
import type { PlanRecord } from "@/lib/services/subscriptions";

const INTERVAL_LABEL: Record<string, string> = {
  monthly: "mes",
  quarterly: "trimestre",
  yearly: "año",
};

const CURRENCY_SYMBOL: Record<string, string> = {
  ARS: "$",
  EUR: "€",
};

const EXAM_ORDER = ["B1", "B2", "C1", "C2", "IELTS", "APTIS"];

function priceLabel(plan: PlanRecord) {
  const symbol = CURRENCY_SYMBOL[plan.currency] ?? plan.currency;
  const interval = INTERVAL_LABEL[plan.billing_interval] ?? plan.billing_interval;
  return { amount: `${symbol}${plan.price.toLocaleString("es-AR")}`, interval };
}

export function CheckoutForm({ plans }: { plans: PlanRecord[] }) {
  const [state, action, pending] = useActionState(startCheckout, {});

  if (!plans.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay planes disponibles por el momento. Contactanos para más información.
      </p>
    );
  }

  const subscribe = (plan: PlanRecord, label = "Suscribirme", size?: "sm") => (
    <form action={action}>
      <input type="hidden" name="planId" value={plan.id} />
      <Button type="submit" size={size} className={size ? undefined : "w-full"} disabled={pending}>
        {pending ? "Procesando…" : label}
      </Button>
    </form>
  );

  const classPlans = (["adults", "kids"] as const).map((c) => ({
    category: c,
    items: plans.filter((p) => p.category === c),
  }));
  const exams = EXAM_ORDER.map((track) => ({
    track,
    items: plans.filter((p) => p.category === "exam" && p.track === track),
  })).filter((g) => g.items.length);

  return (
    <div className="space-y-8">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{state.error}</p>
      )}

      {classPlans.map(
        ({ category, items }) =>
          items.length > 0 && (
            <section key={category} className="space-y-3">
              <h3 className="font-heading text-lg font-semibold">{t.plans.categories[category]}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((plan) => {
                  const { amount, interval } = priceLabel(plan);
                  return (
                    <Card key={plan.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {plan.track === "CAMBRIDGE" ? t.plans.cambridge : frequencyLabel(plan.sessions_per_week)}
                        </CardTitle>
                        {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <p className="text-3xl font-bold">
                            {amount}
                            <span className="text-sm font-normal text-muted-foreground">/{interval}</span>
                          </p>
                          <Badge variant="secondary">{plan.classes_per_period} clases individuales</Badge>
                        </div>
                        {subscribe(plan)}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ),
      )}

      {exams.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-heading text-lg font-semibold">{t.plans.categories.exam}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map(({ track, items }) => (
              <Card key={track}>
                <CardHeader>
                  <CardTitle className="text-lg">{track}</CardTitle>
                  <p className="text-sm text-muted-foreground">{items[0].description}</p>
                </CardHeader>
                <CardContent className="divide-y">
                  {items.map((plan) => {
                    const { amount, interval } = priceLabel(plan);
                    return (
                      <div key={plan.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium">{frequencyLabel(plan.sessions_per_week)}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{amount}</span>/{interval}
                          </p>
                        </div>
                        {subscribe(plan, "Elegir", "sm")}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Todos los planes incluyen profesor asignado, seguimiento de progreso y material. Cancelás cuando quieras.
      </p>
    </div>
  );
}
