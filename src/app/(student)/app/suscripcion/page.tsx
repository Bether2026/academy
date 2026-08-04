import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getActiveSubscription, getPaymentHistory, getAvailablePlans } from "@/lib/services/subscriptions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckoutForm } from "./checkout-form";
import { CancelForm } from "./cancel-form";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  trial: "Período de prueba",
  past_due: "Pago pendiente",
  cancelled: "Cancelada",
  expired: "Expirada",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trial: "secondary",
  past_due: "destructive",
  cancelled: "outline",
  expired: "outline",
};

const CURRENCY_SYMBOL: Record<string, string> = { ARS: "$", EUR: "€" };
const INTERVAL_LABEL: Record<string, string> = { monthly: "mes", quarterly: "trimestre", yearly: "año" };

export default async function SuscripcionPage({ searchParams }: { searchParams: Promise<{ pago?: string }> }) {
  const { user } = await requireRole("student");
  const params = await searchParams;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("country, timezone")
    .eq("id", user.id)
    .single();

  const tz = profile?.timezone ?? "UTC";
  const country = profile?.country ?? "AR";

  const [subscription, payments] = await Promise.all([
    getActiveSubscription(),
    getPaymentHistory(5),
  ]);
  const plans = subscription ? [] : await getAvailablePlans(country);

  const fmtDate = (d: string) =>
    formatInTimeZone(new Date(d), tz, "d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Mi suscripción</h1>
        <p className="text-sm text-muted-foreground">
          Tu plan, renovación y forma de pago — sin letra chica.
        </p>
      </div>

      {params.pago === "ok" && !subscription && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          ¡Pago recibido! Tu suscripción se activa en minutos. Si no aparece, recargá la página.
        </div>
      )}

      {params.pago === "ok" && subscription && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          ¡Suscripción activada exitosamente! Bienvenido a {subscription.plan.name}.
        </div>
      )}

      {subscription ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{subscription.plan.name}</CardTitle>
                <Badge variant={STATUS_VARIANT[subscription.status] ?? "outline"}>
                  {STATUS_LABEL[subscription.status] ?? subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Precio</p>
                  <p className="font-medium">
                    {CURRENCY_SYMBOL[subscription.plan.currency] ?? ""}{subscription.plan.price.toLocaleString("es-AR")} /{INTERVAL_LABEL[subscription.plan.billing_interval] ?? subscription.plan.billing_interval}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Clases incluidas</p>
                  <p className="font-medium">{subscription.plan.classes_per_period} clases individuales</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Período actual</p>
                  <p className="font-medium">
                    {fmtDate(subscription.current_period_start)} — {fmtDate(subscription.current_period_end)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {subscription.cancel_at_period_end ? "Acceso hasta" : "Próxima renovación"}
                  </p>
                  <p className="font-medium">{fmtDate(subscription.current_period_end)}</p>
                </div>
              </div>

              {subscription.cancel_at_period_end ? (
                <p className="text-sm text-amber-700">
                  Tu suscripción se cancela el {fmtDate(subscription.current_period_end)}. Seguís con acceso completo hasta esa fecha.
                </p>
              ) : (
                <CancelForm
                  externalSubscriptionId={subscription.external_subscription_id}
                  provider={subscription.provider}
                />
              )}
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Últimos pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 py-2.5">
                      <span className="text-muted-foreground">
                        {p.paid_at ? fmtDate(p.paid_at) : fmtDate(p.created_at)}
                      </span>
                      <span className="font-medium">
                        {CURRENCY_SYMBOL[p.currency] ?? ""}{p.amount.toLocaleString("es-AR")} {p.currency}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {p.status === "approved" ? "Aprobado" : p.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No tenés una suscripción activa. Elegí el plan que más te convenga:
          </p>
          <CheckoutForm plans={plans} />
        </div>
      )}
    </div>
  );
}
