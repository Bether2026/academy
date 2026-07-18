import { z } from "zod";
import { CEFR_LEVELS } from "@/lib/validators/student";

export const PROGRESS_CATEGORIES = [
  "speaking",
  "listening",
  "reading",
  "writing",
  "grammar",
  "vocabulary",
  "pronunciation",
] as const;

export const progressRecordSchema = z.object({
  studentId: z.string().uuid(),
  category: z.enum(PROGRESS_CATEGORIES),
  score: z.coerce.number().int().min(0).max(100),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const assignmentSchema = z.object({
  studentId: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
});

export const classUpdateSchema = z.object({
  classId: z.string().uuid(),
  status: z.enum(["confirmed", "completed", "no_show"]).optional(),
  teacherNotes: z.string().trim().max(4000).optional().or(z.literal("")),
  meetingUrl: z.string().url().optional().or(z.literal("")),
});

export const levelAssessmentSchema = z.object({
  studentId: z.string().uuid(),
  level: z.enum(CEFR_LEVELS),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const availabilitySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});
