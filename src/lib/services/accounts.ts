import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cuentas que nunca confirmaron el email (no pueden iniciar sesión).
 * Solo para el panel admin: el llamador debe verificar el rol.
 */
export async function getUnconfirmedUserIds(): Promise<Set<string>> {
  const { data, error } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 });
  if (error) return new Set();
  return new Set(data.users.filter((u) => !u.email_confirmed_at).map((u) => u.id));
}

/** Confirma el email a mano (cuando el correo de confirmación no llega). */
export async function confirmUserEmail(userId: string): Promise<boolean> {
  const { error } = await createAdminClient().auth.admin.updateUserById(userId, { email_confirm: true });
  return !error;
}
