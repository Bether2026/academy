import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/actions";
import { t } from "@/lib/i18n";

export type NavItem = { href: string; label: string };

/** Cáscara común de las áreas autenticadas (alumno / profesor / admin). */
export function AppShell({
  roleLabel,
  home,
  nav = [],
  children,
}: {
  roleLabel: string;
  home: string;
  nav?: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href={home}>
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{roleLabel}</Badge>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                {t.auth.signOut}
              </Button>
            </form>
          </div>
        </div>
        {nav.length > 0 && (
          <nav className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
