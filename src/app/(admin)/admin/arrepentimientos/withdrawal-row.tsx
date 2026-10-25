"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/i18n";
import type { WithdrawalRecord } from "@/lib/services/withdrawals";
import { updateWithdrawalAction, type ActionState } from "../actions";

const selectClass =
  "border-input h-8 rounded-md border bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function WithdrawalRow({ w }: { w: WithdrawalRecord }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateWithdrawalAction, {});
  const m = t.withdrawal;
  const received = new Date(w.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });

  return (
    <Card className={w.status === "pending" ? "border-amber-300" : undefined}>
      <CardContent className="space-y-3 py-4 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-mono font-semibold">{w.code}</p>
            <p className="font-medium">
              {w.full_name} <span className="font-normal text-muted-foreground">· {w.email}{w.phone ? ` · ${w.phone}` : ""}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Recibida: {received} · Contratación: {w.contract_date}
            </p>
          </div>
          <Badge variant={w.status === "pending" ? "destructive" : "secondary"}>{m.status[w.status]}</Badge>
        </div>
        {w.details && <p className="rounded-md bg-muted/50 p-2">{w.details}</p>}
        <form action={action} className="space-y-2">
          <input type="hidden" name="id" value={w.id} />
          <Textarea name="adminNotes" rows={2} defaultValue={w.admin_notes} placeholder={m.notes} />
          <div className="flex flex-wrap items-center gap-2">
            <select name="status" defaultValue={w.status} className={selectClass}>
              {(["pending", "processed", "rejected"] as const).map((s) => (
                <option key={s} value={s}>
                  {m.status[s]}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" disabled={pending}>
              {m.save}
            </Button>
            {state.error && <span className="text-xs text-destructive">{state.error}</span>}
            {state.message && <span className="text-xs text-sky-700">{state.message}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
