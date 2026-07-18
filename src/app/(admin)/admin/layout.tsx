import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/features/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin", "super_admin");
  return (
    <AppShell roleLabel="Admin" home="/admin">
      {children}
    </AppShell>
  );
}
