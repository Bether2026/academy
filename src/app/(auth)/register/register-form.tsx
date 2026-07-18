"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, type AuthState } from "../actions";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(register, {});

  if (state.message) {
    return (
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-bold">✈️</h1>
        <p className="text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-bold">{t.auth.registerTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.auth.registerSubtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t.auth.firstName}</Label>
          <Input id="firstName" name="firstName" autoComplete="given-name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t.auth.lastName}</Label>
          <Input id="lastName" name="lastName" autoComplete="family-name" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t.auth.password}</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">{t.auth.country}</Label>
        <select
          id="country"
          name="country"
          required
          defaultValue="AR"
          className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="AR">{t.auth.argentina}</option>
          <option value="ES">{t.auth.spain}</option>
        </select>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "…" : t.auth.registerCta}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t.auth.hasAccount}{" "}
        <Link href="/login" className="font-medium text-sky-700 hover:underline">
          {t.auth.loginCta}
        </Link>
      </p>
    </form>
  );
}
