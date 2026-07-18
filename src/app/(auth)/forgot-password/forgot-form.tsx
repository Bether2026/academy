"use client";

import { useActionState } from "react";
import { forgotPassword, type AuthState } from "../actions";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(forgotPassword, {});

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-bold">{t.auth.forgotTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.auth.forgotSubtitle}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.message && <p className="text-sm text-muted-foreground">{state.message}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "…" : t.auth.forgotCta}
      </Button>
    </form>
  );
}
