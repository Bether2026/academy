import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/features/app-shell";

const NAV = [
  { href: "/teacher", label: "Agenda" },
  { href: "/teacher/alumnos", label: "Alumnos" },
  { href: "/teacher/disponibilidad", label: "Disponibilidad" },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requireRole("teacher");
  return (
    <AppShell roleLabel="Profesor" home="/teacher" nav={NAV}>
      {children}
    </AppShell>
  );
}
