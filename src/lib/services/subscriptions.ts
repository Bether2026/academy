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
  category: "adults" | "kids" | "exam";
  track: string | null;
  sessions_per_week: number | null;
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
    .gt("current_period_end", new Date().toISOString())
    // con meses manuales hay una fila por período: se muestra la vigente
    .order("current_period_start")
    .limit(1)
    .maybeSingle();
  return (data as unknown as SubscriptionWithPlan) ?? null;
}

/** Hasta cuándo tiene plan cada alumno (vigente o ya pagado por adelantado). Para el panel admin. */
export async function getStudentPlanCoverage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("student_id, provider, status, current_period_end, plan:plans(name)")
    .in("status", ["active", "trial", "past_due"])
    .gt("current_period_end", new Date().toISOString())
    .order("current_period_end");
  const byStudent = new Map<string, { provider: string; status: string; until: string; planName: string }>();
  for (const s of data ?? []) {
    byStudent.set(s.student_id, {
      provider: s.provider,
      status: s.status,
      until: s.current_period_end,
      planName: (s.plan as unknown as { name: string }).name,
    });
  }
  return byStudent;
}

/**
 * Activa un mes de plan registrado por la academia (efectivo/transferencia o
 * cortesía). Se encadena al último mes ya cubierto. Corre con la sesión del
 * admin: RLS (0006) solo deja crear suscripciones y pagos a admins.
 */
export async function grantManualMonth(params: {
  studentId: string;
  planId: string;
  mode: "paid" | "courtesy";
}): Promise<{ ok: true; until: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const now = new Date();

  const [{ data: plan }, { data: covering }] = await Promise.all([
    supabase.from("plans").select("id, price, currency").eq("id", params.planId).eq("is_active", true).single(),
    supabase
      .from("subscriptions")
      .select("provider, current_period_end")
      .eq("student_id", params.studentId)
      .in("status", ["active", "trial", "past_due"])
      .gt("current_period_end", now.toISOString())
      .order("current_period_end", { ascending: false }),
  ]);
  if (!plan) return { ok: false, error: "Plan no encontrado." };
  if (covering?.some((s) => s.provider !== "manual")) {
    return { ok: false, error: "Este alumno ya paga online (MercadoPago/Stripe). Gestionalo desde ahí." };
  }

  const start = covering?.length ? new Date(covering[0].current_period_end) : now;
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const { data: sub, error } = await supabase
    .from("subscriptions")
    .insert({
      student_id: params.studentId,
      plan_id: plan.id,
      provider: "manual",
      external_subscription_id: `manual-${crypto.randomUUID()}`,
      status: params.mode === "paid" ? "active" : "trial",
      current_period_start: start.toISOString(),
      current_period_end: end.toISOString(),
      cancel_at_period_end: true,
    })
    .select("id")
    .single();
  if (error || !sub) return { ok: false, error: "No se pudo activar el plan." };

  if (params.mode === "paid") {
    const { error: payError } = await supabase.from("payments").insert({
      student_id: params.studentId,
      subscription_id: sub.id,
      provider: "manual",
      external_payment_id: `manual-${crypto.randomUUID()}`,
      amount: plan.price,
      currency: plan.currency,
      status: "approved",
      paid_at: now.toISOString(),
    });
    if (payError) return { ok: false, error: "Plan activado, pero no se pudo registrar el pago." };
  }
  return { ok: true, until: end.toISOString() };
}

/** Da de baja ya los meses manuales vigentes o futuros del alumno (las clases reservadas no se tocan). */
export async function endManualPlan(studentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("student_id", studentId)
    .eq("provider", "manual")
    .in("status", ["active", "trial"])
    .gt("current_period_end", new Date().toISOString());
  return !error;
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
    .select(
      "id, name, description, price, currency, billing_interval, classes_per_period, category, track, sessions_per_week, is_active",
    )
    .eq("is_active", true)
    .eq("currency", currency)
    .order("category")
    .order("track")
    .order("sessions_per_week");
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
