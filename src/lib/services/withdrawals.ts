import "server-only";
import { randomInt } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/services/email";
import es from "../../../messages/es.json";

const m = es.withdrawal;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O/0/I/1 para que no se confundan

function newCode() {
  const suffix = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `ARR-${new Date().getFullYear()}-${suffix}`;
}

export type WithdrawalInput = { fullName: string; email: string; phone?: string; contractDate: string; details?: string };

/**
 * Registra una solicitud de arrepentimiento (formulario público, sin login).
 * Se guarda con service_role porque RLS no permite inserts anónimos.
 */
export async function createWithdrawal(input: WithdrawalInput): Promise<{ ok: true; code: string } | { ok: false }> {
  const admin = createAdminClient();
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = newCode();
    const { error } = await admin.from("withdrawal_requests").insert({
      code,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone || null,
      contract_date: input.contractDate,
      details: input.details ?? "",
    });
    if (!error) return { ok: true, code };
    if (error.code !== "23505") return { ok: false }; // 23505 = código repetido: reintentar
  }
  return { ok: false };
}

/** Confirmación al solicitante y aviso a los admins. Nunca lanza. */
export async function notifyWithdrawal(input: WithdrawalInput, code: string) {
  const vars = { name: escapeHtml(input.fullName), code: escapeHtml(code) };
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k as keyof typeof vars] ?? "");

  await sendEmail({
    to: input.email,
    subject: m.emailSubject.replace("{code}", code),
    html: emailLayout({ paragraphs: [fill(m.emailGreeting), fill(m.emailBody), escapeHtml(m.emailNext)], footer: es.emails.footer }),
  });

  const { data: admins } = await createAdminClient().from("profiles").select("email").in("role", ["admin", "super_admin"]);
  await Promise.all(
    (admins ?? []).map((a) =>
      sendEmail({
        to: a.email,
        subject: m.adminSubject.replace("{code}", code),
        html: emailLayout({
          paragraphs: [
            `${escapeHtml(input.fullName)} (${escapeHtml(input.email)}) · ${escapeHtml(input.contractDate)}`,
            escapeHtml(input.details || "—"),
            escapeHtml(m.adminReminder),
          ],
          cta: { label: m.adminCta, url: `${APP_URL}/admin/arrepentimientos` },
          footer: es.emails.footer,
        }),
      }),
    ),
  );
}

export type WithdrawalRecord = {
  id: string;
  code: string;
  full_name: string;
  email: string;
  phone: string | null;
  contract_date: string;
  details: string;
  status: "pending" | "processed" | "rejected";
  admin_notes: string;
  created_at: string;
  processed_at: string | null;
};

/** Solicitudes para el panel admin (RLS: solo admin). Pendientes primero. */
export async function listWithdrawals(): Promise<WithdrawalRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("withdrawal_requests")
    .select("id, code, full_name, email, phone, contract_date, details, status, admin_notes, created_at, processed_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as WithdrawalRecord[];
  return rows.sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
}

export async function updateWithdrawal(params: { id: string; status: WithdrawalRecord["status"]; adminNotes?: string; adminId: string }) {
  const supabase = await createClient();
  const done = params.status !== "pending";
  const { error } = await supabase
    .from("withdrawal_requests")
    .update({
      status: params.status,
      admin_notes: params.adminNotes ?? "",
      processed_at: done ? new Date().toISOString() : null,
      processed_by: done ? params.adminId : null,
    })
    .eq("id", params.id);
  return !error;
}
