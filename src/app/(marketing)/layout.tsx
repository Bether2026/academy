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
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label={t.brand.name}>
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              {t.nav.login}
            </Button>
            <Button size="sm" render={<Link href="/register" />}>
              {t.nav.start}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
          <div className="space-y-3">
            <Logo dark />
            <p className="max-w-xs text-sm text-primary-foreground/70">{t.brand.tagline}</p>
          </div>
          <nav className="space-y-2 text-sm">
            <p className="font-semibold">{t.nav.plans}</p>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="block text-primary-foreground/70 hover:text-primary-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="space-y-2 text-sm">
            <p className="font-semibold">{t.footer.legal}</p>
            <Link href="/terminos" className="block text-primary-foreground/70 hover:text-primary-foreground">
              {t.footer.terms}
            </Link>
            <Link href="/privacidad" className="block text-primary-foreground/70 hover:text-primary-foreground">
              {t.footer.privacy}
            </Link>
            <Link href="/cancelacion" className="block text-primary-foreground/70 hover:text-primary-foreground">
              {t.footer.cancellation}
            </Link>
          </nav>
        </div>
        <div className="border-t border-primary-foreground/10">
          <p className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} {t.brand.name}. {t.footer.rights}
          </p>
        </div>
      </footer>
    </div>
  );
}
