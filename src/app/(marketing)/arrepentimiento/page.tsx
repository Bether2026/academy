import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { WithdrawalForm } from "./withdrawal-form";

export const metadata: Metadata = { title: "Botón de arrepentimiento" };

export default function ArrepentimientoPage() {
  const m = t.withdrawal;
  return (
    <article className="mx-auto w-full max-w-2xl space-y-8 px-4 py-16">
      <div className="space-y-3">
        <h1 className="font-heading text-3xl font-bold">{m.title}</h1>
        <p className="text-muted-foreground">{m.intro}</p>
      </div>
      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold">{m.howTitle}</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          {m.how.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
      <WithdrawalForm />
    </article>
  );
}
