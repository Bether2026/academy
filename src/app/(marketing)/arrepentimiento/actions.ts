"use server";

import { after } from "next/server";
import { createWithdrawal, notifyWithdrawal } from "@/lib/services/withdrawals";
import { withdrawalSchema } from "@/lib/validators/withdrawal";
import { t } from "@/lib/i18n";

export type WithdrawalState = { error?: string; code?: string };

/** Formulario público (sin login, por ley). Validación estricta en servidor. */
export async function submitWithdrawal(_prev: WithdrawalState, formData: FormData): Promise<WithdrawalState> {
  const parsed = withdrawalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t.withdrawal.error };

  const { fullName, email, phone, contractDate, details } = parsed.data;
  const input = { fullName, email, phone, contractDate, details };
  const result = await createWithdrawal(input);
  if (!result.ok) return { error: t.withdrawal.error };

  after(() => notifyWithdrawal(input, result.code));
  return { code: result.code };
}
