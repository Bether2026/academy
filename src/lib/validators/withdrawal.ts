import { z } from "zod";

export const withdrawalSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresá tu nombre y apellido.").max(120),
  email: z.string().trim().email("Ingresá un email válido.").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  contractDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresá la fecha de contratación.")
    .refine((d) => new Date(d) <= new Date(), "La fecha no puede ser futura."),
  details: z.string().trim().max(1000).optional().or(z.literal("")),
  // campo trampa: los humanos no lo ven; si viene completo, es un bot
  website: z.literal("").optional(),
});

export const withdrawalUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "processed", "rejected"]),
  adminNotes: z.string().trim().max(1000).optional().or(z.literal("")),
});
