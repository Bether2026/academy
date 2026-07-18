"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthState } from "../actions";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {});

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-bold">{t.auth.loginTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.auth.loginSubtitle}</p>
      </div>
      {next && <input type="hidden" name="next" value={next} />}
      <div className="space-y-2">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t.auth.password}</Label>
          <Link href="/forgot-password" className="text-xs text-sky-700 hover:underline">
            {t.auth.forgot}
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "…" : t.auth.loginCta}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="font-medium text-sky-700 hover:underline">
          {t.auth.registerCta}
        </Link>
      </p>
    </form>
  );
}
