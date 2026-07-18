import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/features/app-shell";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requireRole("teacher");
  return (
    <AppShell roleLabel="Profesor" home="/teacher">
      {children}
    </AppShell>
  );
}
