"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type UserRole } from "@/lib/auth/session";
import {
  COUNTRY_TIMEZONES,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth";

export type AuthState = { error?: string; message?: string };

function appUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${path}`;
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { email, password, firstName, lastName, country } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: appUrl("/auth/callback?next=/app"),
      data: {
        first_name: firstName,
        last_name: lastName,
        country,
        timezone: COUNTRY_TIMEZONES[country],
      },
    },
  });

  if (error) return { error: "No pudimos crear la cuenta. Probá de nuevo." };
  return { message: "Te enviamos un email para confirmar tu cuenta. Revisá tu bandeja." };
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email o contraseña incorrectos." };

  const role = (data.user.app_metadata?.role ?? "student") as UserRole;
  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/") ? next : (ROLE_HOME[role] ?? "/app"));
}

export async function forgotPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: appUrl("/auth/callback?next=/reset-password"),
  });
  // Siempre el mismo mensaje: no revelar si el email existe.
  return { message: "Si el email existe, te enviamos un enlace para restablecer la contraseña." };
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "El enlace expiró. Pedí uno nuevo desde “Olvidé mi contraseña”." };
  redirect("/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
