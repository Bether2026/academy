import { z } from "zod";

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const LEARNING_GOALS = [
  { value: "work", label: "Trabajo y carrera" },
  { value: "travel", label: "Viajes" },
  { value: "exam", label: "Un examen oficial" },
  { value: "study", label: "Estudiar en el exterior" },
  { value: "personal", label: "Crecimiento personal" },
] as const;

export const onboardingSchema = z.object({
  estimatedLevel: z.enum(CEFR_LEVELS, { message: "Elegí tu nivel estimado" }),
  targetLevel: z.enum(CEFR_LEVELS, { message: "Elegí tu nivel objetivo" }),
  learningGoal: z.enum(
    LEARNING_GOALS.map((g) => g.value) as [string, ...string[]],
    { message: "Elegí tu objetivo" },
  ),
});

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  timezone: z.string().min(3).max(50),
});

export const teacherChangeSchema = z.object({
  reason: z.string().trim().min(10, "Contanos brevemente el motivo").max(500),
});

export const bookSlotSchema = z.object({
  startUtc: z.string().datetime(),
});
