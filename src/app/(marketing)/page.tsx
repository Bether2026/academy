import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { t } from "@/lib/i18n";
import { formatPrice, getPublicPlans } from "@/lib/services/plans";

function AnimatedFlightPath() {
  return (
    <svg
      viewBox="0 0 600 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute inset-x-0 bottom-0 w-full"
      aria-hidden
    >
      <path
        d="M-20 200 C 120 190, 240 150, 360 95 S 560 20, 640 -10"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="820"
        strokeDashoffset="820"
        className="animate-draw-trail"
        opacity="0.7"
      />
      <path
        d="M-20 200 C 120 190, 240 150, 360 95 S 560 20, 640 -10"
        stroke="#7dd3fc"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="1 12"
        opacity="0.3"
      />
      {/* Plane at end of trail */}
      <g className="animate-fade-in" style={{ transformOrigin: "580px 8px" }}>
        <path d="M580 8 522 40l24 4L580 8Z" fill="#7dd3fc" />
        <path d="M580 8 546 44l4 20 10-16L580 8Z" fill="#38bdf8" fillOpacity="0.85" />
      </g>
    </svg>
  );
}

export default async function HomePage() {
  const plans = await getPublicPlans();

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden"
        style={{ background: "oklch(0.17 0.065 265)" }}>

        {/* Animated blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob-1 absolute -right-24 -top-24 h-[520px] w-[520px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)", filter: "blur(80px)" }} />
          <div className="animate-blob-2 absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #1d4ed8, transparent 70%)", filter: "blur(70px)" }} />
          <div className="animate-blob-3 absolute left-[45%] top-[30%] h-[280px] w-[280px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #f59e0b, transparent 70%)", filter: "blur(60px)" }} />
        </div>

        {/* Subtle grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }} />

        {/* Flight path */}
        <AnimatedFlightPath />

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-28 pt-12 sm:pt-16 lg:pb-40">
          <div className="animate-fade-up-0">
            <Badge
              variant="outline"
              className="border-sky-400/30 bg-sky-400/10 text-sky-300 backdrop-blur-sm"
            >
              {t.hero.kicker}
            </Badge>
          </div>

          <h1 className="animate-fade-up-1 font-heading mt-5 max-w-2xl text-5xl font-bold leading-[1.04] tracking-tight text-white sm:text-7xl">
            {t.hero.title}{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #7dd3fc 0%, #f59e0b 100%)" }}
            >
              {t.hero.titleAccent}
            </span>
          </h1>

          <p className="animate-fade-up-2 mt-6 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg">
            {t.hero.subtitle}
          </p>

          <div className="animate-fade-up-3 mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              size="lg"
              className="relative overflow-hidden font-semibold text-[oklch(0.17_0.065_265)] shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-400/40 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)" }}
              render={<Link href="/register" />}
            >
              {t.hero.cta}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white hover:border-white/35 transition-all"
              render={<Link href="/#como-funciona" />}
            >
              {t.hero.ctaSecondary}
            </Button>
          </div>

          <p className="animate-fade-up-4 mt-5 text-xs text-white/35 tracking-wide">
            {t.hero.trust}
          </p>

          {/* Stats row */}
          <div className="animate-fade-up-4 mt-12 flex flex-wrap gap-8 border-t border-white/10 pt-8">
            {[
              { n: "1 a 1", label: "Clases individuales" },
              { n: "A1–C2", label: "Todos los niveles" },
              { n: "AR · ES", label: "Argentina y España" },
            ].map((s) => (
              <div key={s.n}>
                <p className="font-heading text-2xl font-bold text-white">{s.n}</p>
                <p className="text-xs text-white/45 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────────── */}
      <section id="como-funciona" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20 sm:py-28">
        <div className="max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">Proceso</p>
          <h2 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {t.how.title}
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.how.steps.map((step, i) => (
            <div
              key={step.title}
              className="group relative rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-100/60 hover:border-sky-200"
            >
              {/* Ghost number */}
              <span
                className="absolute right-4 top-2 font-heading text-8xl font-black leading-none text-foreground/5 select-none transition-colors duration-300 group-hover:text-sky-500/8"
                aria-hidden
              >
                {i + 1}
              </span>
              {/* Accent bar */}
              <div className="mb-4 h-0.5 w-8 rounded-full bg-amber-400 transition-all duration-300 group-hover:w-12 group-hover:bg-sky-500" />
              <h3 className="font-heading text-base font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROFESORES ───────────────────────────────────────────── */}
      <section id="profesores" className="scroll-mt-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.17 0.065 265) 0%, oklch(0.22 0.07 255) 100%)" }}>
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 sm:grid-cols-2 sm:py-28">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">Nuestro diferencial</p>
            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
              {t.teachers.title}
            </h2>
            <div className="h-px w-16 bg-amber-400" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-base leading-relaxed text-white/65 sm:text-lg">{t.teachers.body}</p>
            <Button
              className="mt-8 w-fit border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              variant="outline"
              render={<Link href="/register" />}
            >
              Conocé tu profesor →
            </Button>
          </div>
        </div>
      </section>

      {/* ── PLANES ───────────────────────────────────────────────── */}
      <section id="planes" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20 sm:py-28">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">Precios</p>
          <h2 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {t.plans.title}
          </h2>
          <p className="mt-2 text-muted-foreground">{t.plans.subtitle}</p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:max-w-3xl">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl ${plan.highlighted ? "plan-card-glow" : ""}`}
            >
              <Card
                className={`relative h-full overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  plan.highlighted
                    ? "border-0 shadow-lg shadow-sky-200/50"
                    : "hover:border-sky-200 hover:shadow-sky-50"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute inset-x-0 top-0 h-px"
                    style={{ background: "linear-gradient(90deg, transparent, #38bdf8, #f59e0b, transparent)" }} />
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-heading text-xl">{plan.name}</CardTitle>
                    {plan.highlighted && (
                      <Badge className="bg-sky-500 text-white hover:bg-sky-500 text-xs">
                        Recomendado
                      </Badge>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    {plan.prices.map((price) => (
                      <p key={price.currency} className="font-heading text-3xl font-bold">
                        {formatPrice(price.currency, price.amount)}
                        <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                          {price.currency} {t.plans.perMonth}
                        </span>
                      </p>
                    ))}
                    <p className="mt-1 text-sm font-medium text-sky-600">
                      {plan.classesPerPeriod} {t.plans.classesLabel}
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {t.plans.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-[10px] font-bold shrink-0">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full font-semibold transition-all hover:-translate-y-0.5 ${
                      plan.highlighted
                        ? "shadow-md shadow-sky-200"
                        : ""
                    }`}
                    render={<Link href="/register" />}
                  >
                    {t.plans.cta}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-20 bg-secondary/50">
        <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:py-28">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">Preguntas</p>
          <h2 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {t.faq.title}
          </h2>
          <Accordion multiple={false} className="mt-8">
            {t.faq.items.map((item) => (
              <AccordionItem key={item.q} value={item.q} className="border-b border-border/60">
                <AccordionTrigger className="py-5 text-left font-medium hover:text-sky-700 hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        {/* Background */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, oklch(0.17 0.065 265) 0%, oklch(0.28 0.08 255) 50%, oklch(0.17 0.065 265) 100%)" }} />
        {/* Glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-96 w-96 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)", filter: "blur(80px)" }} />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
            {t.contact.title}
          </p>
          <h2 className="font-heading mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Tu despegue empieza hoy.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/60">
            {t.contact.body}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="font-semibold shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5 hover:shadow-amber-400/50"
              style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)", color: "oklch(0.17 0.065 265)" }}
              render={<Link href="/register" />}
            >
              {t.hero.cta}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white hover:border-white/35"
              render={<a href="mailto:hola@learningtofly.academy" />}
            >
              {t.contact.cta}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
