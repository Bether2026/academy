import { requireTeacher } from "@/lib/auth/session";
import { AppShell } from "@/components/features/app-shell";
import { t } from "@/lib/i18n";

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
