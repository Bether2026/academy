"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import type { TransferAccount } from "@/lib/services/transfer-accounts";

/** Datos para pagar por transferencia (alumno). */
export function TransferAccounts({ accounts }: { accounts: TransferAccount[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const m = t.transfer;

  async function copy(a: TransferAccount) {
    try {
      await navigator.clipboard.writeText(a.details);
      setCopied(a.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // sin permiso de portapapeles: el texto igual se puede seleccionar a mano
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{m.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{m.intro}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {accounts.map((a) => (
          <div key={a.id} className="rounded-lg border p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="font-semibold">{a.label}</p>
              <Button variant="outline" size="sm" onClick={() => copy(a)}>
                {copied === a.id ? m.copied : m.copy}
              </Button>
            </div>
            <p className="whitespace-pre-wrap break-all font-mono text-xs text-muted-foreground select-all">
              {a.details}
            </p>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          {m.receipt.replace("{email}", t.brand.email)}
        </p>
      </CardContent>
    </Card>
  );
}
