import { z } from "zod";

export const checkoutSchema = z.object({
  planId: z.string().uuid("Plan inválido"),
});

export const cancelSchema = z.object({
  externalSubscriptionId: z.string().min(1),
  provider: z.enum(["mercadopago", "stripe"]),
});
