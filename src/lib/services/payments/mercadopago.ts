import "server-only";
import type { BillingInterval, CancelParams, CheckoutSession, CreateCheckoutParams, PaymentProvider } from "./types";

function mpInterval(interval: BillingInterval): { frequency: number; frequency_type: "days" | "months" } {
  switch (interval) {
    case "monthly":   return { frequency: 1,  frequency_type: "months" };
    case "quarterly": return { frequency: 3,  frequency_type: "months" };
    case "yearly":    return { frequency: 12, frequency_type: "months" };
  }
}

async function mpFetch(path: string, method: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`MercadoPago ${method} ${path}: ${JSON.stringify(json)}`);
  return json;
}

export const mercadopagoProvider: PaymentProvider = {
  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutSession> {
    const { frequency, frequency_type } = mpInterval(params.billingInterval);
    const data = await mpFetch("/preapproval", "POST", {
      reason: params.planName,
      external_reference: `${params.studentId}:${params.planId}`,
      payer_email: params.studentEmail,
      auto_recurring: {
        frequency,
        frequency_type,
        transaction_amount: params.amount,
        currency_id: params.currency,
      },
      back_url: params.successUrl,
      status: "pending",
    }) as { init_point: string };
    return { url: data.init_point };
  },

  async cancelSubscription({ externalSubscriptionId }: CancelParams): Promise<void> {
    await mpFetch(`/preapproval/${externalSubscriptionId}`, "PUT", { status: "cancelled" });
  },
};
