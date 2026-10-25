import "server-only";
import { createClient } from "@/lib/supabase/server";

export type TransferAccount = {
  id: string;
  label: string;
  currency: "ARS" | "EUR";
  details: string;
  position: number;
  is_active: boolean;
};

const COLUMNS = "id, label, currency, details, position, is_active";

/** Cuentas activas de una moneda (alumno). RLS ya oculta las inactivas. */
export async function getTransferAccounts(currency: "ARS" | "EUR"): Promise<TransferAccount[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transfer_accounts")
    .select(COLUMNS)
    .eq("currency", currency)
    .eq("is_active", true)
    .order("position");
  return (data ?? []) as TransferAccount[];
}

/** Todas las cuentas (admin). */
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
