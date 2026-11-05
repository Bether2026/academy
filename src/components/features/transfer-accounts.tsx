import { ExternalLink, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import type { PaymentMethod } from "@/lib/services/transfer-accounts";

/** Medios de pago (alumno): sin datos bancarios; se piden por WhatsApp. */
export function TransferAccounts({ methods }: { methods: PaymentMethod[] }) {
  const m = t.transfer;
  const whatsapp = `https://wa.me/${t.brand.whatsapp}?text=${encodeURIComponent(m.whatsappMessage)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{m.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{m.intro}</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2">
          {methods.map((pm) =>
            pm.pay_url ? (
              <Button
                key={pm.id}
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<a href={pm.pay_url} target="_blank" rel="noreferrer" />}
              >
                <ExternalLink className="size-4" />
                {m.payWith.replace("{method}", pm.label)}
              </Button>
            ) : (
              <span key={pm.id} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium">
                <Landmark className="size-4 text-muted-foreground" />
                {pm.label}
              </span>
            ),
          )}
        </div>
        <Button
          className="w-full bg-[#25D366] text-white hover:bg-[#1ebe5b] sm:w-auto"
          nativeButton={false}
          render={<a href={whatsapp} target="_blank" rel="noreferrer" />}
        >
          {m.askData}
        </Button>
        <p className="text-xs text-muted-foreground">{m.receipt.replace("{email}", t.brand.email)}</p>
      </CardContent>
    </Card>
  );
}
