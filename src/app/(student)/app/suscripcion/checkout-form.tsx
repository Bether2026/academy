"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export function CheckoutForm({ plans }: { plans: PlanRecord[] }) {
  const [state, action, pending] = useActionState(startCheckout, {});

  if (!plans.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay planes disponibles por el momento. Contactanos para más información.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{state.error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const symbol = CURRENCY_SYMBOL[plan.currency] ?? plan.currency;
          const interval = INTERVAL_LABEL[plan.billing_interval] ?? plan.billing_interval;
          return (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-3xl font-bold">
                    {symbol}
                    {plan.price.toLocaleString("es-AR")}
                    <span className="text-sm font-normal text-muted-foreground">/{interval}</span>
                  </p>
                  <Badge variant="secondary">
                    {plan.classes_per_period} clase{plan.classes_per_period !== 1 ? "s" : ""} individuales
                  </Badge>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {["Profesor asignado", "Seguimiento de progreso", "Material incluido", "Cancelás cuando quieras"].map(
                    (f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="text-green-600">✓</span> {f}
                      </li>
                    ),
                  )}
                </ul>
                <form action={action}>
                  <input type="hidden" name="planId" value={plan.id} />
                  <Button type="submit" className="w-full" disabled={pending}>
                    {pending ? "Procesando…" : "Suscribirme"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
