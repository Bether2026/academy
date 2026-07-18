import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold">Política de privacidad</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Borrador — este contenido debe ser revisado por asesoría legal antes del lanzamiento
        (RGPD para España, Ley 25.326 para Argentina).
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">Qué datos recopilamos</h2>
          <p>
            Datos de cuenta (nombre, email, país, zona horaria), datos académicos (nivel, objetivos,
            progreso, historial de clases) y datos de facturación (identificadores de pago externos;
            nunca datos de tarjetas).
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">Para qué los usamos</h2>
          <p>
            Para prestar el servicio: asignarte un profesor, agendar clases en tu zona horaria,
            registrar tu progreso y gestionar tu suscripción. No vendemos tus datos.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">Tus derechos</h2>
          <p>
            Podés acceder, corregir o eliminar tus datos escribiendo a
            hola@learningtofly.academy. Al eliminar tu cuenta, tus datos personales se eliminan o
            anonimizan según la normativa aplicable.
          </p>
        </section>
      </div>
    </article>
  );
}
