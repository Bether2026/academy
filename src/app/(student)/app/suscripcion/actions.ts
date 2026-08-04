"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/services/payments";
import { cancelSubscriptionInDb } from "@/lib/services/subscriptions";
import { checkoutSchema, cancelSchema } from "@/lib/validators/payments";

export type ActionState = { error?: string; message?: string };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function startCheckout(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireRole("student");
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Plan inválido." };

  const supabase = await createClient();

  const [{ data: profile }, { data: student }, { data: plan }] = await Promise.all([
    supabase.from("profiles").select("email, country").eq("id", user.id).single(),
    supabase.from("students").select("id").eq("profile_id", user.id).single(),
    supabase
      .from("plans")
      .select("id, name, price, currency, billing_interval")
      .eq("id", parsed.data.planId)
      .eq("is_active", true)
      .single(),
  ]);

  if (!profile || !student || !plan) return { error: "No pudimos iniciar el pago. Intentá de nuevo." };

  const provider = getPaymentProvider(profile.country);
  const session = await provider.createCheckout({
    planId: plan.id,
    planName: plan.name,
    amount: plan.price,
    currency: plan.currency,
    billingInterval: plan.billing_interval as "monthly" | "quarterly" | "yearly",
    studentId: student.id,
    studentEmail: profile.email,
    successUrl: `${APP_URL}/app/suscripcion?pago=ok`,
    cancelUrl: `${APP_URL}/app/suscripcion`,
  });

  redirect(session.url);
}

export async function cancelSubscription(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireRole("student");
  const parsed = cancelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos inválidos." };

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("country").eq("id", user.id).single();
  if (!profile) return { error: "No se pudo verificar tu cuenta." };

  const provider = getPaymentProvider(profile.country);
  await provider.cancelSubscription({
    externalSubscriptionId: parsed.data.externalSubscriptionId,
    atPeriodEnd: true,
  });

  await cancelSubscriptionInDb(parsed.data.externalSubscriptionId, true);
  return { message: "Tu suscripción se canceló. Seguís teniendo acceso hasta el final del período actual." };
}
