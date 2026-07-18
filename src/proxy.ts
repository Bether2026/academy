import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/app", roles: ["student"] },
  { prefix: "/teacher", roles: ["teacher"] },
  { prefix: "/admin", roles: ["admin", "super_admin"] },
];

const ROLE_HOME: Record<string, string> = {
  student: "/app",
  teacher: "/teacher",
  admin: "/admin",
  super_admin: "/admin",
};

/**
 * Capa 1 (solo UX): refresca la sesión y redirige según rol.
 * La seguridad real está en requireRole() (servidor) y RLS (base de datos).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Sin credenciales configuradas (setup inicial): dejar pasar la landing.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresca el token si expiró y valida la firma del JWT.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const role = (claims?.app_metadata as { role?: string } | undefined)?.role ?? null;
  const { pathname } = request.nextUrl;

  const rule = PROTECTED.find((r) => pathname.startsWith(r.prefix));
  if (rule) {
    if (!claims) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    if (role && !rule.roles.includes(role)) {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/login", request.url));
    }
  }

  // Usuario logueado en páginas de auth → a su home
  if (claims && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL(ROLE_HOME[role ?? "student"] ?? "/app", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
