import { hasActiveTeacherProfile, requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/features/app-shell";
import { t } from "@/lib/i18n";
import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";

// Área privada: fuera de los buscadores
export const metadata: Metadata = { robots: NO_INDEX };

const NAV = [
  { href: "/admin", label: "Métricas" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/clases", label: "Clases" },
  { href: "/admin/planes", label: "Planes" },
  { href: "/admin/materiales", label: "Materiales" },
  { href: "/admin/arrepentimientos", label: "Arrepentimientos" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireRole("admin", "super_admin");
  const teaches = await hasActiveTeacherProfile(user.id);
  return (
    <AppShell
      roleLabel="Admin"
      home="/admin"
      nav={NAV}
      switchTo={teaches ? { href: "/teacher", label: t.shell.toTeacher } : undefined}
    >
      {children}
    </AppShell>
  );
}
