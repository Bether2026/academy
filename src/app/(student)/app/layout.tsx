import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/features/app-shell";

const NAV = [
  { href: "/app", label: "Inicio" },
  { href: "/app/clases", label: "Mis clases" },
  { href: "/app/progreso", label: "Progreso" },
  { href: "/app/materiales", label: "Materiales" },
  { href: "/app/perfil", label: "Perfil" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireRole("student");
  return (
    <AppShell roleLabel="Alumno" home="/app" nav={NAV}>
      {children}
    </AppShell>
  );
}
