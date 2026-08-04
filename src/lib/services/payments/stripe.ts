import "server-only";
import Stripe from "stripe";
import type { BillingInterval, CancelParams, CheckoutSession, CreateCheckoutParams, PaymentProvider } from "./types";

function getStripe(): Stripe {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (Stripe as any)(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-07-29.dahlia",
  }) as Stripe;
}

function stripeInterval(interval: BillingInterval): { interval: "month" | "year"; interval_count: number } {
  switch (interval) {
    case "monthly":   return { interval: "month", interval_count: 1 };
    case "quarterly": return { interval: "month", interval_count: 3 };
    case "yearly":    return { interval: "year",  interval_count: 1 };
  }
}

export const stripeProvider: PaymentProvider = {
  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutSession> {
    const stripe = getStripe();
    const { interval, interval_count } = stripeInterval(params.billingInterval);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: params.studentEmail,
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: { name: params.planName },
            unit_amount: Math.round(params.amount * 100),
            recurring: { interval, interval_count },
          },
          quantity: 1,
        },
      ],
      metadata: { student_id: params.studentId, plan_id: params.planId },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
    return { url: session.url! };
  },

  async cancelSubscription({ externalSubscriptionId, atPeriodEnd }: CancelParams): Promise<void> {
    const stripe = getStripe();
    if (atPeriodEnd) {
      await stripe.subscriptions.update(externalSubscriptionId, { cancel_at_period_end: true });
    } else {
      await stripe.subscriptions.cancel(externalSubscriptionId);
    }
  },
};

export function getStripeInstance(): Stripe {
  return getStripe();
}
