import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type TransferAccount = {
  id: string;
  label: string;
  currency: "ARS" | "EUR";
  details: string;
  pay_url: string | null;
  position: number;
  is_active: boolean;
};

/** Lo único que ve el alumno: sin datos bancarios. */
export type PaymentMethod = Pick<TransferAccount, "id" | "label" | "pay_url">;

const COLUMNS = "id, label, currency, details, pay_url, position, is_active";

/**
 * Medios de pago activos de una moneda (alumno). La tabla es solo-admin por RLS:
 * se lee con service_role y se devuelven únicamente columnas públicas.
 */
export async function getPaymentMethods(currency: "ARS" | "EUR"): Promise<PaymentMethod[]> {
  const { data } = await createAdminClient()
    .from("transfer_accounts")
    .select("id, label, pay_url")
    .eq("currency", currency)
    .eq("is_active", true)
    .order("position");
  return data ?? [];
}

/** Todas las cuentas con sus datos (admin). */
export async function listTransferAccounts(): Promise<TransferAccount[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("transfer_accounts").select(COLUMNS).order("currency").order("position");
  return (data ?? []) as TransferAccount[];
}

export async function saveTransferAccount(
  input: Omit<TransferAccount, "id"> & { id?: string },
): Promise<boolean> {
  const supabase = await createClient();
  const { id, ...fields } = input;
  const { error } = id
    ? await supabase.from("transfer_accounts").update(fields).eq("id", id)
    : await supabase.from("transfer_accounts").insert(fields);
  return !error;
}

export async function deleteTransferAccount(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("transfer_accounts").delete().eq("id", id);
  return !error;
}
