"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnTeacher } from "@/lib/services/teachers";
import {
  assignmentSchema,
  availabilitySchema,
  classUpdateSchema,
  levelAssessmentSchema,
  progressRecordSchema,
} from "@/lib/validators/teacher";

export type ActionState = { error?: string; message?: string };

export async function addProgressRecord(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("teacher");
  const parsed = progressRecordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revisá los datos del registro." };

  const teacher = await getOwnTeacher();
  if (!teacher) return { error: "Perfil de profesor no encontrado." };

  const supabase = await createClient();
  const { error } = await supabase.from("progress_records").insert({
    student_id: parsed.data.studentId,
    teacher_id: teacher.id,
    category: parsed.data.category,
    score: parsed.data.score,
    notes: parsed.data.notes || null,
  });
  if (error) return { error: "No se pudo guardar (¿el alumno está asignado a vos?)." };
  revalidatePath(`/teacher/alumnos/${parsed.data.studentId}`);
  return { message: "Progreso registrado." };
}

export async function addAssignment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("teacher");
  const parsed = assignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revisá los datos de la tarea." };

  const teacher = await getOwnTeacher();
  if (!teacher) return { error: "Perfil de profesor no encontrado." };

  const supabase = await createClient();
  const { error } = await supabase.from("assignments").insert({
    student_id: parsed.data.studentId,
    teacher_id: teacher.id,
    title: parsed.data.title,
    description: parsed.data.description || "",
    due_date: parsed.data.dueDate ? new Date(parsed.data.dueDate).toISOString() : null,
  });
  if (error) return { error: "No se pudo crear la tarea." };
  revalidatePath(`/teacher/alumnos/${parsed.data.studentId}`);
  return { message: "Tarea asignada." };
}

export async function updateClass(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("teacher");
  const parsed = classUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos inválidos." };

  const updates: Record<string, unknown> = {};
  if (parsed.data.status) updates.status = parsed.data.status;
  if (parsed.data.teacherNotes !== undefined) updates.teacher_notes = parsed.data.teacherNotes || null;
  if (parsed.data.meetingUrl !== undefined) updates.meeting_url = parsed.data.meetingUrl || null;
  if (!Object.keys(updates).length) return { error: "Nada para actualizar." };

  const supabase = await createClient();
  const { error } = await supabase.from("classes").update(updates).eq("id", parsed.data.classId);
  if (error) return { error: "No se pudo actualizar la clase." };
  revalidatePath("/teacher");
  return { message: "Clase actualizada." };
}

export async function assessLevel(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("teacher");
  const parsed = levelAssessmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos inválidos." };

  const teacher = await getOwnTeacher();
  if (!teacher) return { error: "Perfil de profesor no encontrado." };

  const supabase = await createClient();
  // Historial (RLS valida que el alumno sea del profesor)
  const { error: historyError } = await supabase.from("student_level_history").insert({
    student_id: parsed.data.studentId,
    level: parsed.data.level,
    source: "teacher_assessment",
    notes: parsed.data.notes || null,
  });
  if (historyError) return { error: "No se pudo registrar la evaluación." };

  // Nivel actual del alumno: lo actualiza el servicio (el guard bloquea al alumno, no al servicio)
  const admin = createAdminClient();
  await admin
    .from("students")
    .update({ current_level: parsed.data.level })
    .eq("id", parsed.data.studentId);

  revalidatePath(`/teacher/alumnos/${parsed.data.studentId}`);
  return { message: "Nivel actualizado." };
}

export async function addAvailability(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("teacher");
  const parsed = availabilitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revisá el horario." };
  if (parsed.data.startTime >= parsed.data.endTime) {
    return { error: "La hora de inicio debe ser anterior a la de fin." };
  }

  const teacher = await getOwnTeacher();
  if (!teacher) return { error: "Perfil de profesor no encontrado." };

  const supabase = await createClient();
  const { error } = await supabase.from("teacher_availability").insert({
    teacher_id: teacher.id,
    day_of_week: parsed.data.dayOfWeek,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
  });
  if (error) return { error: "No se pudo agregar la franja." };
  revalidatePath("/teacher/disponibilidad");
  return { message: "Franja agregada." };
}

export async function removeAvailability(formData: FormData): Promise<void> {
  await requireRole("teacher");
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await createClient();
  await supabase.from("teacher_availability").delete().eq("id", id);
  revalidatePath("/teacher/disponibilidad");
}
