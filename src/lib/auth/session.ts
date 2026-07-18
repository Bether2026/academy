import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "student" | "teacher" | "admin" | "super_admin";

export const ROLE_HOME: Record<UserRole, string> = {
  student: "/app",
  teacher: "/teacher",
  admin: "/admin",
  super_admin: "/admin",
};

/** Usuario autenticado (validado contra el servidor de Auth) o null. */
export async function getAuthUser() {
  // Setup inicial sin credenciales: no hay sesión posible
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Exige sesión; redirige a /login si no hay. */
export async function requireUser() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Exige sesión Y rol. Es la verificación de servidor real:
 * el proxy solo hace UX, esta función es la que protege.
 */
export async function requireRole(...roles: UserRole[]) {
  const user = await requireUser();
  const role = (user.app_metadata?.role ?? "student") as UserRole;
  if (!roles.includes(role)) redirect(ROLE_HOME[role] ?? "/login");
  return { user, role };
}
