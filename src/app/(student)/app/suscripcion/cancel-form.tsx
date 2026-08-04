"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { cancelSubscription } from "./actions";

export function CancelForm({
  externalSubscriptionId,
  provider,
}: {
  externalSubscriptionId: string;
  provider: string;
}) {
  const [state, action, pending] = useActionState(cancelSubscription, {});

  if (state.message) {
    return <p className="text-sm text-green-700">{state.message}</p>;
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="externalSubscriptionId" value={externalSubscriptionId} />
      <input type="hidden" name="provider" value={provider} />
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Cancelando…" : "Cancelar suscripción"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Seguís teniendo acceso hasta el final del período actual. Sin cargos adicionales.
      </p>
    </form>
  );
}
