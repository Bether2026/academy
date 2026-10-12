import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { CLASS_POLICY } from "@/lib/services/policy";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/services/email";
import { fmtInTz } from "@/lib/utils/dates";
import es from "../../../messages/es.json";

const m = es.emails;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type Person = { first_name: string; last_name: string; email: string; timezone: string };
type ClassForEmail = {
  id: string;
  scheduled_at: string;
  meeting_url: string | null;
  student: { profile: Person };
  teacher: { profile: Person };
};

const CLASS_SELECT = `id, scheduled_at, meeting_url,
  student:student_id(profile:profile_id(first_name, last_name, email, timezone)),
  teacher:teacher_id(profile:profile_id(first_name, last_name, email, timezone))`;

/** Reemplaza {clave} por su valor escapado. */
function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => escapeHtml(vars[k] ?? ""));
}

const fullName = (p: Person) => `${p.first_name} ${p.last_name}`.trim();
const when = (iso: string, p: Person) => fmtInTz(iso, p.timezone, "EEEE d 'de' MMMM, HH:mm 'h'");
const tzLabel = (p: Person) => p.timezone.split("/").pop()?.replace(/_/g, " ") ?? p.timezone;

async function loadClass(classId: string) {
  const { data } = await createAdminClient().from("classes").select(CLASS_SELECT).eq("id", classId).single();
  return data as unknown as ClassForEmail | null;
}

/** Arma y envía el email de una clase a una de las partes. */
function sendClassEmail(
  cls: ClassForEmail,
  to: "student" | "teacher",
  texts: { subject: string; body: string; extra?: string },
  withJoin: boolean,
) {
  const recipient = cls[to].profile;
  const vars = {
    name: recipient.first_name,
    student: fullName(cls.student.profile),
    teacher: fullName(cls.teacher.profile),
    when: when(cls.scheduled_at, recipient),
    tz: tzLabel(recipient),
    hours: String(CLASS_POLICY.freeCancellationHours),
  };
  const paragraphs = [fill(m.greeting, vars), fill(texts.body, vars)];
  if (texts.extra) paragraphs.push(fill(texts.extra, vars));
  if (withJoin && !cls.meeting_url && to === "student") paragraphs.push(escapeHtml(m.noRoom));

  const panel = to === "student" ? "/app/clases" : "/teacher";
  const cta =
    withJoin && cls.meeting_url
      ? { label: m.joinCta, url: cls.meeting_url }
      : { label: m.openCta, url: `${APP_URL}${panel}` };

  // el asunto no es HTML: sin escapar
  const subject = texts.subject.replace(/\{(\w+)\}/g, (_, k: string) => vars[k as keyof typeof vars] ?? "");
  return sendEmail({ to: recipient.email, subject, html: emailLayout({ paragraphs, cta, footer: m.footer }) });
}

export async function notifyClassBooked(classId: string) {
  const cls = await loadClass(classId);
  if (!cls) return;
  await Promise.all([
    sendClassEmail(cls, "student", { subject: m.bookedStudentSubject, body: m.bookedStudentBody }, true),
    sendClassEmail(cls, "teacher", { subject: m.bookedTeacherSubject, body: m.bookedTeacherBody }, false),
  ]);
}

export async function notifyClassCancelled(classId: string, late: boolean) {
  const cls = await loadClass(classId);
  if (!cls) return;
  await Promise.all([
    sendClassEmail(
      cls,
      "student",
      { subject: m.cancelledStudentSubject, body: m.cancelledStudentBody, extra: late ? m.cancelledStudentLate : undefined },
      false,
    ),
    sendClassEmail(cls, "teacher", { subject: m.cancelledTeacherSubject, body: m.cancelledTeacherBody }, false),
  ]);
}

/**
 * Recordatorio de las clases que empiezan entre 12 y 36 h desde ahora.
 * Pensado para correr una vez por día: cada clase entra en una sola ventana.
 */
export async function sendClassReminders() {
  const now = Date.now();
  const { data } = await createAdminClient()
    .from("classes")
    .select(CLASS_SELECT)
    .in("status", ["scheduled", "confirmed"])
    .gte("scheduled_at", new Date(now + 12 * 3_600_000).toISOString())
    .lt("scheduled_at", new Date(now + 36 * 3_600_000).toISOString());

  const classes = (data ?? []) as unknown as ClassForEmail[];
  for (const cls of classes) {
    await sendClassEmail(cls, "student", { subject: m.reminderStudentSubject, body: m.reminderStudentBody }, true);
    await sendClassEmail(cls, "teacher", { subject: m.reminderTeacherSubject, body: m.reminderTeacherBody }, true);
  }
  return classes.length;
}

export async function notifyTeacherAssigned(studentId: string) {
  const { data } = await createAdminClient()
    .from("students")
    .select(
      `profile:profile_id(first_name, last_name, email, timezone),
       teacher:assigned_teacher_id(profile:profile_id(first_name, last_name, email, timezone))`,
    )
    .eq("id", studentId)
    .single();
  const row = data as unknown as { profile: Person; teacher: { profile: Person } | null } | null;
  if (!row?.teacher) return;

  const vars = { name: row.profile.first_name, teacher: fullName(row.teacher.profile) };
  await sendEmail({
    to: row.profile.email,
    subject: m.assignedSubject.replace("{teacher}", vars.teacher),
    html: emailLayout({
      paragraphs: [fill(m.greeting, vars), fill(m.assignedBody, vars)],
      cta: { label: m.openCta, url: `${APP_URL}/app/clases/reservar` },
      footer: m.footer,
    }),
  });
}
