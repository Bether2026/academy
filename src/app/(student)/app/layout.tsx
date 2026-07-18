import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/features/app-shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireRole("student");
  return (
    <AppShell roleLabel="Alumno" home="/app">
      {children}
    </AppShell>
  );
}
