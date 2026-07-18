import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role: BYPASEA RLS.
 * Uso exclusivo en servidor para webhooks y servicios que validan
 * reglas de negocio por su cuenta (p. ej. reservas de clases).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
