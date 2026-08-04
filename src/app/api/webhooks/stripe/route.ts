import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeInstance } from "@/lib/services/payments/stripe";
import { upsertSubscription, recordPayment } from "@/lib/services/subscriptions";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const stripe = getStripeInstance();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency: skip if unique constraint fires (code 23505)
  const { error: insertError } = await admin.from("webhook_events").insert({
    provider: "stripe",
    event_id: event.id,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });

  if (insertError?.code === "23505") return new Response("Already processed", { status: 200 });
  if (insertError) return new Response("DB error", { status: 500 });

  const markDone = (error?: string) =>
    admin
      .from("webhook_events")
      .update({ processed_at: new Date().toISOString(), error: error ?? null })
      .eq("provider", "stripe")
      .eq("event_id", event.id);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const planId = session.metadata?.plan_id;
      const studentId = session.metadata?.student_id;
      const stripeSubId = session.subscription as string | null;

      if (!planId || !studentId || !stripeSubId) {
        await markDone("Missing metadata");
        return new Response("Missing metadata", { status: 200 });
      }

      const sub = await stripe.subscriptions.retrieve(stripeSubId, { expand: ["items"] });
      const item = sub.items.data[0] as Stripe.SubscriptionItem & {
        current_period_start: number;
        current_period_end: number;
      };

      await upsertSubscription({
        studentId,
        planId,
        provider: "stripe",
        externalSubscriptionId: stripeSubId,
        status: sub.status === "active" ? "active" : "trial",
        currentPeriodStart: new Date(item.current_period_start * 1000),
        currentPeriodEnd: new Date(item.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      });
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const subDetails = (invoice.parent as { subscription_details?: { subscription?: string | { id: string } } } | null)
        ?.subscription_details;
      const stripeSubId =
        typeof subDetails?.subscription === "string"
          ? subDetails.subscription
          : subDetails?.subscription?.id;
      const customerEmail = invoice.customer_email;

      if (stripeSubId) {
        const sub = await stripe.subscriptions.retrieve(stripeSubId, { expand: ["items"] });
        const item = sub.items.data[0] as Stripe.SubscriptionItem & {
          current_period_start: number;
          current_period_end: number;
        };
        const meta = sub.metadata as { student_id?: string; plan_id?: string };

        // Try metadata first, fall back to looking up by email
        let studentId = meta?.student_id;
        if (!studentId && customerEmail) {
          const { data: profile } = await admin
            .from("profiles")
            .select("id")
            .eq("email", customerEmail)
            .maybeSingle();
          if (profile) {
            const { data: student } = await admin
              .from("students")
              .select("id")
              .eq("profile_id", profile.id)
              .maybeSingle();
            studentId = student?.id;
          }
        }

        if (studentId && meta?.plan_id) {
          await upsertSubscription({
            studentId,
            planId: meta.plan_id,
            provider: "stripe",
            externalSubscriptionId: stripeSubId,
            status: "active",
            currentPeriodStart: new Date(item.current_period_start * 1000),
            currentPeriodEnd: new Date(item.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          });

          await recordPayment({
            studentId,
            provider: "stripe",
            externalPaymentId: invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency.toUpperCase(),
            status: "approved",
            paidAt: new Date(invoice.created * 1000),
          });
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      await admin
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("provider", "stripe")
        .eq("external_subscription_id", sub.id);
    }

    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const item = sub.items.data[0] as Stripe.SubscriptionItem & {
        current_period_start: number;
        current_period_end: number;
      };
      const statusMap: Record<string, string> = {
        active: "active",
        past_due: "past_due",
        canceled: "cancelled",
        unpaid: "past_due",
        trialing: "trial",
      };
      await admin
        .from("subscriptions")
        .update({
          status: statusMap[sub.status] ?? "past_due",
          current_period_start: new Date(item.current_period_start * 1000).toISOString(),
          current_period_end: new Date(item.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        })
        .eq("provider", "stripe")
        .eq("external_subscription_id", sub.id);
    }

    await markDone();
    return new Response("OK", { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markDone(msg);
    return new Response("Internal error", { status: 500 });
  }
}
