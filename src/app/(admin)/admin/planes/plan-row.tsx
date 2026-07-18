"use client";

import { useActionState } from "react";
import { updatePlan, type ActionState } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: string;
  classes_per_period: number;
  is_active: boolean;
};

export function PlanRow({ plan }: { plan: Plan }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updatePlan, {});

  return (
    <Card>
      <CardContent className="py-4">
        <form action={action} className="flex flex-wrap items-end justify-between gap-3 text-sm">
          <input type="hidden" name="planId" value={plan.id} />
          <div>
            <p className="font-medium">
              {plan.name} <Badge variant="outline">{plan.currency}</Badge>{" "}
              {!plan.is_active && <Badge variant="secondary">Inactivo</Badge>}
            </p>
            <p className="text-xs text-muted-foreground">
              {plan.classes_per_period} clases / {plan.billing_interval === "monthly" ? "mes" : plan.billing_interval}
            </p>
          </div>
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Precio</label>
              <Input name="price" type="number" step="0.01" defaultValue={plan.price} className="w-28" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Estado</label>
              <select
                name="isActive"
                defaultValue={String(plan.is_active)}
                className="border-input h-9 rounded-md border bg-transparent px-2 text-sm shadow-xs outline-none"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
            <Button size="sm" disabled={pending}>
              Guardar
            </Button>
          </div>
          {state.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
          {state.message && <p className="w-full text-xs text-sky-700">{state.message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
