import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

const NAV = [
  { href: "/#como-funciona", label: t.nav.how },
  { href: "/#profesores", label: t.nav.teachers },
  { href: "/#planes", label: t.nav.plans },
  { href: "/#faq", label: t.nav.faq },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* ── Nav glassmorphism ── */}
      <header
        className="sticky top-0 z-40 border-b border-white/10"
        style={{
          background: "oklch(0.17 0.065 265 / 0.80)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label={t.brand.name}>
            <Logo dark />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white/65 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:bg-white/10 hover:text-white"
              render={<Link href="/login" />}
            >
              {t.nav.login}
            </Button>
            <Button
              size="sm"
              className="font-semibold text-[oklch(0.17_0.065_265)] transition-all hover:-translate-y-px"
              style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)" }}
              render={<Link href="/register" />}
            >
              {t.nav.start}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer
        className="border-t border-white/10"
        style={{ background: "oklch(0.15 0.055 265)" }}
      >
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
          <div className="space-y-3">
            <Logo dark />
            <p className="max-w-xs text-sm text-white/50">{t.brand.tagline}</p>
          </div>
          <nav className="space-y-2 text-sm">
            <p className="font-semibold text-white/80">Navegación</p>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-white/45 transition-colors hover:text-white/75"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="space-y-2 text-sm">
            <p className="font-semibold text-white/80">{t.footer.legal}</p>
            <Link href="/terminos" className="block text-white/45 transition-colors hover:text-white/75">
              {t.footer.terms}
            </Link>
            <Link href="/privacidad" className="block text-white/45 transition-colors hover:text-white/75">
              {t.footer.privacy}
            </Link>
            <Link href="/cancelacion" className="block text-white/45 transition-colors hover:text-white/75">
              {t.footer.cancellation}
            </Link>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-white/30">
            © {new Date().getFullYear()} {t.brand.name}. {t.footer.rights}
          </p>
        </div>
      </footer>
    </div>
  );
}
