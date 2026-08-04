import "server-only";
import { mercadopagoProvider } from "./mercadopago";
import { stripeProvider } from "./stripe";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(country: string): PaymentProvider {
  return country === "ES" ? stripeProvider : mercadopagoProvider;
}

export type { PaymentProvider, CreateCheckoutParams, CancelParams, CheckoutSession } from "./types";
