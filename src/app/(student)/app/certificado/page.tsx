import { requireRole } from "@/lib/auth/session";
import { getCertificateEligibility, CLASSES_REQUIRED } from "@/lib/services/certificates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/logo";
import Link from "next/link";

export default async function CertificadoPage() {
  const { user } = await requireRole("student");
  const cert = await getCertificateEligibility(user.id);

  if (!cert.eligible) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Certificado de progreso</h1>
          <p className="text-sm text-muted-foreground">
            Completá {CLASSES_REQUIRED} clases para obtener tu certificado.
          </p>
        </div>
        <div className="rounded-xl border bg-muted/30 p-6 text-center space-y-4">
          <p className="text-4xl font-bold text-sky-600">
            {cert.completedClasses} / {CLASSES_REQUIRED}
          </p>
          <p className="text-sm text-muted-foreground">clases completadas</p>
          <div className="mx-auto max-w-xs">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-sky-500 transition-all"
                style={{ width: `${Math.min(100, (cert.completedClasses / CLASSES_REQUIRED) * 100)}%` }}
              />
            </div>
          </div>
          <Button render={<Link href="/app/clases/reservar" />}>Reservar mi próxima clase</Button>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Tu certificado</h1>
          <p className="text-sm text-muted-foreground">¡Felicitaciones! Lo lograste.</p>
        </div>
        <Button variant="outline" onClick={undefined} className="print:hidden" render={<a href="#" onClick={() => window.print()} />}>
          Imprimir / PDF
        </Button>
      </div>

      {/* Certificate */}
      <div className="print:shadow-none rounded-2xl border-2 border-sky-300 bg-white p-8 sm:p-12 text-center space-y-6 shadow-xl">
        <div className="flex justify-center">
          <Logo className="h-12 w-auto" />
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Certifica que</p>
          <h2 className="font-heading text-3xl font-bold text-sky-700">{cert.studentName}</h2>
        </div>

        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          ha completado satisfactoriamente{" "}
          <strong>{cert.completedClasses} clases individuales de inglés</strong>{" "}
          en Learning to Fly Academy, demostrando compromiso y progreso continuo.
        </p>

        {cert.level && (
          <div className="flex justify-center">
            <Badge className="text-sm px-4 py-1">Nivel alcanzado: {cert.level}</Badge>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 pt-4 text-sm">
          <div className="space-y-1 border-t pt-4">
            <p className="font-medium">Learning to Fly Academy</p>
            <p className="text-xs text-muted-foreground">Plataforma de inglés online</p>
          </div>
          <div className="space-y-1 border-t pt-4">
            <p className="font-medium">{today}</p>
            <p className="text-xs text-muted-foreground">Fecha de emisión</p>
          </div>
        </div>
      </div>
    </div>
  );
}
