import { requireTeacher } from "@/lib/auth/session";
import { AppShell } from "@/components/features/app-shell";
import { t } from "@/lib/i18n";
import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";

// Área privada: fuera de los buscadores
export const metadata: Metadata = { robots: NO_INDEX };

const NAV = [
  { href: "/teacher", label: "Agenda" },
  { href: "/teacher/alumnos", label: "Alumnos" },
  { href: "/teacher/disponibilidad", label: "Disponibilidad" },
  { href: "/teacher/materiales", label: "Materiales" },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireTeacher();
  return (
    <AppShell
      roleLabel="Profesor"
      home="/teacher"
      nav={NAV}
      switchTo={role === "teacher" ? undefined : { href: "/admin", label: t.shell.toAdmin }}
    >
      {children}
    </AppShell>
  );
}
