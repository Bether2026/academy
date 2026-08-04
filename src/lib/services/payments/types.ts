export type BillingInterval = "monthly" | "quarterly" | "yearly";
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "expired" | "trial";

export interface CreateCheckoutParams {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  billingInterval: BillingInterval;
  studentId: string;
  studentEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CancelParams {
  externalSubscriptionId: string;
  atPeriodEnd: boolean;
}

export interface CheckoutSession {
  url: string;
}

export interface PaymentProvider {
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutSession>;
  cancelSubscription(params: CancelParams): Promise<void>;
}
