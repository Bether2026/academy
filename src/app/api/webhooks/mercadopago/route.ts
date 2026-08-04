import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertSubscription, recordPayment } from "@/lib/services/subscriptions";

export const runtime = "nodejs";

function verifySignature(signature: string, requestId: string, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  const parts: Record<string, string> = {};
  for (const part of signature.split(",")) {
    const [k, v] = part.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  }
  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const data = `id:${dataId};request-id:${requestId};ts:${ts}`;
  const expected = createHmac("sha256", secret).update(data).digest("hex");
  return expected === v1;
}

async function mpGet(path: string): Promise<unknown> {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
  });
  return res.json();
}

export async function POST(request: Request) {
  const body = await request.json() as {
    id?: string;
    type?: string;
    data?: { id?: string };
  };

  const signature = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const dataId = body.data?.id ?? "";

  if (!verifySignature(signature, requestId, dataId)) {
    return new Response("Invalid signature", { status: 400 });
  }

  const eventId = String(body.id ?? dataId);
  const eventType = body.type ?? "unknown";

  const admin = createAdminClient();
  const { error: insertError } = await admin
    .from("webhook_events")
    .insert({
      provider: "mercadopago",
      event_id: eventId,
      event_type: eventType,
      payload: body as Record<string, unknown>,
    });

  if (insertError?.code === "23505") return new Response("Already processed", { status: 200 });
  if (insertError) return new Response("DB error", { status: 500 });

  try {
    if (eventType === "subscription_preapproval" && dataId) {
      const preapproval = await mpGet(`/preapproval/${dataId}`) as {
        id: string;
        status: string;
        external_reference?: string;
        auto_recurring?: {
          start_date?: string;
          end_date?: string;
          transaction_amount?: number;
          currency_id?: string;
        };
      };

      const [studentId, planId] = (preapproval.external_reference ?? "").split(":");
      if (studentId && planId) {
        const statusMap: Record<string, string> = {
          authorized: "active",
          pending: "trial",
          paused: "past_due",
          cancelled: "cancelled",
        };
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await upsertSubscription({
          studentId,
          planId,
          provider: "mercadopago",
          externalSubscriptionId: preapproval.id,
          status: statusMap[preapproval.status] ?? "past_due",
          currentPeriodStart: now,
          currentPeriodEnd: new Date(preapproval.auto_recurring?.end_date ?? periodEnd),
          cancelAtPeriodEnd: preapproval.status === "cancelled",
        });
      }
    }

    if (eventType === "subscription_authorized_payment" && dataId) {
      const payment = await mpGet(`/subscription_authorized_payment/${dataId}`) as {
        id: string;
        subscription_id?: string;
        payer_id?: string;
        status?: string;
        transaction_amount?: number;
        currency_id?: string;
        date_approved?: string;
      };

      // Look up subscription to get student_id
      if (payment.subscription_id) {
        const { data: sub } = await admin
          .from("subscriptions")
          .select("student_id, id")
          .eq("provider", "mercadopago")
          .eq("external_subscription_id", payment.subscription_id)
          .maybeSingle();

        if (sub) {
          await recordPayment({
            studentId: sub.student_id,
            subscriptionId: sub.id,
            provider: "mercadopago",
            externalPaymentId: String(payment.id),
            amount: payment.transaction_amount ?? 0,
            currency: payment.currency_id ?? "ARS",
            status: payment.status === "processed" ? "approved" : "pending",
            paidAt: payment.date_approved ? new Date(payment.date_approved) : undefined,
          });
        }
      }
    }

    await admin
      .from("webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("provider", "mercadopago")
      .eq("event_id", eventId);

    return new Response("OK", { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await admin
      .from("webhook_events")
      .update({ error: msg })
      .eq("provider", "mercadopago")
      .eq("event_id", eventId);
    return new Response("Internal error", { status: 500 });
  }
}
