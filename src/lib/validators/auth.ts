import { z } from "zod";

/** Zonas horarias por país soportado (v1: AR y ES). */
export const COUNTRY_TIMEZONES: Record<string, string> = {
  AR: "America/Argentina/Buenos_Aires",
  ES: "Europe/Madrid",
};

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, "Ingresá tu nombre").max(60),
  lastName: z.string().trim().min(2, "Ingresá tu apellido").max(60),
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  country: z.enum(["AR", "ES"], { message: "Elegí tu país" }),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email inválido"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
