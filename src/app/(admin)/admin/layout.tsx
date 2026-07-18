import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/features/app-shell";

const NAV = [
  { href: "/admin", label: "Métricas" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/clases", label: "Clases" },
  { href: "/admin/planes", label: "Planes" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin", "super_admin");
  return (
    <AppShell roleLabel="Admin" home="/admin" nav={NAV}>
      {children}
    </AppShell>
  );
}
