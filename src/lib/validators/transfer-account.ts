import { z } from "zod";

export const transferAccountSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  label: z.string().trim().min(2, "Poné un nombre (ej. Mercado Pago).").max(60),
  currency: z.enum(["ARS", "EUR"]),
  details: z.string().trim().min(5, "Completá los datos de la cuenta.").max(1000),
  position: z.coerce.number().int().min(0).max(99).default(0),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true"),
});
