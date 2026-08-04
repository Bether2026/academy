import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SubscriptionWithPlan = {
  id: string;
  student_id: string;
  plan_id: string;
  provider: string;
  external_subscription_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  plan: {
    name: string;
    price: number;
    currency: string;
    billing_interval: string;
    classes_per_period: number;
  };
};

export type PaymentRecord = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
};

export type PlanRecord = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: string;
  classes_per_period: number;
  is_active: boolean;
};

export async function getActiveSubscription(): Promise<SubscriptionWithPlan | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select(
      `id, student_id, plan_id, provider, external_subscription_id, status,
       current_period_start, current_period_end, cancel_at_period_end, created_at,
       plan:plans(name, price, currency, billing_interval, classes_per_period)`,
    )
    .in("status", ["active", "trial", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as unknown as SubscriptionWithPlan) ?? null;
}

export async function getPaymentHistory(limit = 10): Promise<PaymentRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, amount, currency, status, paid_at, created_at")
    .in("status", ["approved"])
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as PaymentRecord[];
}

export async function getAvailablePlans(country: string): Promise<PlanRecord[]> {
  const supabase = await createClient();
  const currency = country === "ES" ? "EUR" : "ARS";
  const { data } = await supabase
    .from("plans")
    .select("id, name, description, price, currency, billing_interval, classes_per_period, is_active")
    .eq("is_active", true)
    .eq("currency", currency)
    .order("price");
  return (data ?? []) as PlanRecord[];
}

// ── Admin writes (called from webhooks & server actions) ──────────────────────

export async function upsertSubscription(data: {
  studentId: string;
  planId: string;
  provider: "mercadopago" | "stripe";
  externalSubscriptionId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
}) {
  const admin = createAdminClient();
  await admin
    .from("subscriptions")
    .upsert(
      {
        student_id: data.studentId,
        plan_id: data.planId,
        provider: data.provider,
        external_subscription_id: data.externalSubscriptionId,
        status: data.status,
        current_period_start: data.currentPeriodStart.toISOString(),
        current_period_end: data.currentPeriodEnd.toISOString(),
        cancel_at_period_end: data.cancelAtPeriodEnd ?? false,
      },
      { onConflict: "provider,external_subscription_id" },
    );
}

export async function recordPayment(data: {
  studentId: string;
  subscriptionId?: string;
  provider: "mercadopago" | "stripe";
  externalPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: Date;
}) {
  const admin = createAdminClient();
  await admin
    .from("payments")
    .upsert(
      {
        student_id: data.studentId,
        subscription_id: data.subscriptionId ?? null,
        provider: data.provider,
        external_payment_id: data.externalPaymentId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        paid_at: data.paidAt?.toISOString() ?? null,
      },
      { onConflict: "provider,external_payment_id" },
    );
}

export async function cancelSubscriptionInDb(externalSubscriptionId: string, atPeriodEnd: boolean) {
  const admin = createAdminClient();
  if (atPeriodEnd) {
    await admin
      .from("subscriptions")
      .update({ cancel_at_period_end: true })
      .eq("external_subscription_id", externalSubscriptionId);
  } else {
    await admin
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("external_subscription_id", externalSubscriptionId);
  }
}

export async function getStudentIdByProfileId(profileId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data?.id ?? null;
}
