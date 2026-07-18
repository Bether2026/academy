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

function FlightPath() {
  return (
    <svg
      viewBox="0 0 600 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-40"
      aria-hidden
    >
      <path
        d="M-20 200 C 120 190, 240 150, 360 95 S 560 20, 640 -10"
        stroke="#f59e0b"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="1 14"
      />
      <path d="M580 8 522 40l24 4L580 8Z" fill="#7dd3fc" />
      <path d="M580 8 546 44l4 20 10-16L580 8Z" fill="#38bdf8" fillOpacity="0.85" />
    </svg>
  );
}

export default async function HomePage() {
  const plans = await getPublicPlans();

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <FlightPath />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 pb-28 pt-16 sm:pt-24 lg:pb-36">
          <Badge className="border-sky-400/40 bg-sky-400/10 text-sky-200" variant="outline">
            {t.hero.kicker}
          </Badge>
          <h1 className="font-heading max-w-2xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            {t.hero.title}{" "}
            <span className="bg-gradient-to-r from-sky-300 to-amber-300 bg-clip-text text-transparent">
              {t.hero.titleAccent}
            </span>
          </h1>
          <p className="max-w-xl text-base text-primary-foreground/75 sm:text-lg">
            {t.hero.subtitle}
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              size="lg"
              className="bg-amber-400 text-primary hover:bg-amber-300"
              render={<Link href="/register" />}
            >
              {t.hero.cta}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              render={<Link href="/#como-funciona" />}
            >
              {t.hero.ctaSecondary}
            </Button>
          </div>
          <p className="text-xs text-primary-foreground/50">{t.hero.trust}</p>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:py-24">
        <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t.how.title}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.how.steps.map((step, i) => (
            <Card key={step.title} className="relative">
              <CardHeader>
                <span className="font-heading text-sm font-bold text-sky-600">0{i + 1}</span>
                <CardTitle className="font-heading text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{step.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* PROFESORES */}
      <section id="profesores" className="scroll-mt-20 bg-secondary/60">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:grid-cols-2 sm:py-24">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {t.teachers.title}
          </h2>
          <p className="text-muted-foreground sm:text-lg">{t.teachers.body}</p>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:py-24">
        <div className="max-w-xl">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {t.plans.title}
          </h2>
          <p className="mt-2 text-muted-foreground">{t.plans.subtitle}</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlighted ? "border-sky-500 shadow-md shadow-sky-100" : ""}
            >
              <CardHeader>
                <CardTitle className="font-heading flex items-center justify-between text-xl">
                  {plan.name}
                  {plan.highlighted && (
                    <Badge className="bg-sky-500 text-white hover:bg-sky-500">Recomendado</Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  {plan.prices.map((price) => (
                    <p key={price.currency} className="font-heading text-2xl font-bold">
                      {formatPrice(price.currency, price.amount)}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        {price.currency} {t.plans.perMonth}
                      </span>
                    </p>
                  ))}
                </div>
                <p className="text-sm font-medium">
                  {plan.classesPerPeriod} {t.plans.classesLabel}
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {t.plans.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="text-sky-500">✓</span> {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" render={<Link href="/register" />}>
                  {t.plans.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-secondary/60">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {t.faq.title}
          </h2>
          <Accordion multiple={false} className="mt-6">
            {t.faq.items.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-left font-medium">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CONTACTO / CTA FINAL */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24">
        <div className="rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">{t.contact.title}</h2>
          <p className="mx-auto mt-2 max-w-md text-primary-foreground/75">{t.contact.body}</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="bg-amber-400 text-primary hover:bg-amber-300"
              render={<Link href="/register" />}
            >
              {t.hero.cta}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
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
