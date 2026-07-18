"use client";

import { useActionState } from "react";
import { resetPassword, type AuthState } from "../actions";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(resetPassword, {});

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-bold">{t.auth.resetTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.auth.resetSubtitle}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t.auth.password}</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "…" : t.auth.resetCta}
      </Button>
    </form>
  );
}
