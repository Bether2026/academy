import Link from "next/link";
import { LogoEmblem } from "@/components/brand/logo";
import { t } from "@/lib/i18n";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="relative flex min-h-dvh flex-col overflow-hidden"
      style={{ background: "oklch(0.17 0.065 265)" }}
    >
      {/* Fondo: mismas luces y cuadrícula que la portada */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob-1 absolute -right-24 -top-24 h-[520px] w-[520px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)", filter: "blur(80px)" }} />
        <div className="animate-blob-2 absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #1d4ed8, transparent 70%)", filter: "blur(70px)" }} />
        <div className="animate-blob-3 absolute left-[40%] top-[35%] h-[280px] w-[280px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent 70%)", filter: "blur(60px)" }} />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-5">
        <Link href="/" className="text-sm text-white/50 transition-colors hover:text-white">
          ← {t.auth.backHome}
        </Link>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-8 lg:grid-cols-2 lg:gap-16">
        {/* Panel de marca */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Link href="/" aria-label={t.brand.name} className="animate-fade-in">
            <LogoEmblem className="w-36 lg:hidden" />
            <LogoEmblem interactive className="hidden w-[360px] lg:block" />
          </Link>
          <div className="hidden lg:block">
            <h2 className="animate-fade-up-1 font-heading mt-6 text-4xl font-bold leading-tight tracking-tight text-white">
              {t.auth.panelTitle}
            </h2>
            <p className="animate-fade-up-2 mt-4 max-w-md text-base leading-relaxed text-white/60">
              {t.brand.tagline}
            </p>
            <p className="animate-fade-up-3 mt-6 text-xs tracking-wide text-white/35">{t.hero.trust}</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="animate-fade-up-2 mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
          {/* el borde degradado animado queda detrás; el fondo blanco va en la capa interna */}
          <div className="plan-card-glow relative isolate rounded-2xl shadow-2xl shadow-black/40">
            <div className="auth-card rounded-2xl bg-white p-6 sm:p-8">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
