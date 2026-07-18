import type { Metadata } from "next";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TerminosPage() {
  return (
    <article className="prose-sm mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold">Términos y condiciones</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Borrador — este contenido debe ser revisado por asesoría legal antes del lanzamiento.
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">1. El servicio</h2>
          <p>
            Learning to Fly Academy ofrece clases individuales de inglés online con profesores
            reales, mediante suscripción mensual. El plan contratado, su precio, la cantidad de
            clases incluidas y la fecha de renovación son siempre visibles en tu cuenta.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">2. Suscripción y cancelación</h2>
          <p>
            Podés cancelar tu suscripción en cualquier momento desde tu cuenta, sin contactar a
            soporte. La cancelación aplica al final del período ya abonado: conservás tus clases
            hasta esa fecha. No hay permanencia mínima.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">3. Clases y reprogramación</h2>
          <p>
            Las políticas de cancelación y reprogramación de clases se muestran antes de reservar.
            Las clases no utilizadas dentro del período se rigen por la política vigente visible en
            tu cuenta.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">4. Pagos</h2>
          <p>
            Los pagos se procesan a través de proveedores externos (Mercado Pago en Argentina,
            Stripe en España). No almacenamos datos de tarjetas.
          </p>
        </section>
      </div>
    </article>
  );
}
