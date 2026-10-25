"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/i18n";
import { submitWithdrawal, type WithdrawalState } from "./actions";

export function WithdrawalForm() {
  const [state, action, pending] = useActionState<WithdrawalState, FormData>(submitWithdrawal, {});
  const m = t.withdrawal;

  if (state.code) {
    return (
      <div className="space-y-3 rounded-2xl border border-sky-200 bg-sky-50 p-6 text-center">
        <h2 className="font-heading text-xl font-bold text-foreground">{m.successTitle}</h2>
        <p className="text-sm text-muted-foreground">{m.successBody}</p>
        <p className="font-mono text-2xl font-bold tracking-wider text-foreground">{state.code}</p>
        <p className="text-sm text-muted-foreground">{m.successNext}</p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="space-y-4 rounded-2xl border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">{m.fullName}</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">{m.email}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{m.phone}</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contractDate">{m.contractDate}</Label>
        <Input id="contractDate" name="contractDate" type="date" max={today} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="details">{m.details}</Label>
        <Textarea id="details" name="details" rows={3} />
      </div>
      {/* trampa para bots: oculta para personas */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "…" : m.submit}
      </Button>
    </form>
  );
}
