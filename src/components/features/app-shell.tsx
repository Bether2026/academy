import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/actions";
import { t } from "@/lib/i18n";
import { AppNav } from "./app-nav";

export type NavItem = { href: string; label: string };

const ROLE_COLORS: Record<string, string> = {
  Alumno: "bg-sky-500/20 text-sky-200 border-sky-400/25",
  Profesor: "bg-emerald-500/20 text-emerald-200 border-emerald-400/25",
  Admin: "bg-amber-500/20 text-amber-200 border-amber-400/25",
};

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
  const roleClass = ROLE_COLORS[roleLabel] ?? "bg-white/10 text-white/70 border-white/15";

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/40">
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 border-b border-white/8"
        style={{
          background: "oklch(0.19 0.07 265)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="mx-auto flex h-13 w-full max-w-5xl items-center justify-between px-4">
          <Link href={home} aria-label="Inicio">
            <Logo dark />
          </Link>
          <div className="flex items-center gap-2.5">
            <span
              className={`hidden rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide sm:inline-flex ${roleClass}`}
            >
              {roleLabel}
            </span>
            <form action={signOut}>
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="text-white/60 hover:bg-white/10 hover:text-white/90"
              >
                {t.auth.signOut}
              </Button>
            </form>
          </div>
        </div>

        {/* ── Pill nav ── */}
        {nav.length > 0 && <AppNav nav={nav} home={home} />}
      </header>

      {/* ── Content ── */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
