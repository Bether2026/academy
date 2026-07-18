import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de cancelación" };

export default function CancelacionPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold">Política de cancelación</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Borrador — los plazos exactos se definirán antes de habilitar la reserva de clases.
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">Suscripción</h2>
          <p>
            Cancelás cuando quieras desde tu cuenta, en un clic. Sin permanencia, sin penalidades,
            sin llamar a nadie. El servicio continúa hasta el final del período abonado.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">Clases individuales</h2>
          <p>
            Si cancelás una clase con la anticipación indicada al reservar, se reprograma sin costo.
            Las cancelaciones fuera de plazo y las ausencias se rigen por la política visible en tu
            cuenta antes de confirmar cada reserva.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">Cambio de profesor</h2>
          <p>
            Podés solicitar un cambio de profesor desde tu perfil en cualquier momento, sin costo y
            sin necesidad de justificarlo.
          </p>
        </section>
      </div>
    </article>
  );
}
