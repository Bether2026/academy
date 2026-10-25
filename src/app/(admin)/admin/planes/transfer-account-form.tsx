"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/i18n";
import type { TransferAccount } from "@/lib/services/transfer-accounts";
import { deleteTransferAccountAction, saveTransferAccountAction, type ActionState } from "../actions";

const selectClass =
  "border-input h-9 rounded-md border bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Alta (sin `account`) o edición de una cuenta para transferencias. */
export function TransferAccountForm({ account }: { account?: TransferAccount }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveTransferAccountAction, {});
  const [delState, delAction, deleting] = useActionState<ActionState, FormData>(deleteTransferAccountAction, {});
  const m = t.transfer;
  const msg = delState.error ?? state.error;

  return (
    <Card className={account && !account.is_active ? "opacity-60" : undefined}>
      <CardContent className="py-4">
        <form action={action} className="space-y-3 text-sm">
          {account && <input type="hidden" name="id" value={account.id} />}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
            <div className="space-y-1">
              <label className="text-xs font-medium">{m.label}</label>
              <Input name="label" defaultValue={account?.label} placeholder={m.labelPlaceholder} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">{m.currency}</label>
              <select name="currency" defaultValue={account?.currency ?? "ARS"} className={selectClass}>
                <option value="ARS">ARS</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">{m.position}</label>
              <Input name="position" type="number" min={0} max={99} defaultValue={account?.position ?? 0} className="w-20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">{m.active}</label>
              <select name="isActive" defaultValue={String(account?.is_active ?? true)} className={selectClass}>
                <option value="true">{m.active}</option>
                <option value="false">{m.hidden}</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">{m.details}</label>
            <Textarea name="details" rows={4} defaultValue={account?.details} placeholder={m.detailsPlaceholder} required />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {account ? m.save : m.add}
            </Button>
            {account && (
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={deleting}
                formAction={delAction}
                className="text-destructive"
              >
                {m.delete}
              </Button>
            )}
            {msg && <span className="text-xs text-destructive">{msg}</span>}
            {state.message && !msg && <span className="text-xs text-sky-700">{state.message}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
