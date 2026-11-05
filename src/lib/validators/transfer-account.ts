import { z } from "zod";

export const transferAccountSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  label: z.string().trim().min(2, "Poné un nombre (ej. Mercado Pago).").max(60),
  currency: z.enum(["ARS", "EUR"]),
  details: z.string().trim().max(1000).default(""),
  payUrl: z
    .string()
    .trim()
    .url("El link de pago tiene que empezar con https://")
    .startsWith("https://", "El link de pago tiene que empezar con https://")
    .or(z.literal("").transform(() => null)),
  position: z.coerce.number().int().min(0).max(99).default(0),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true"),
});
