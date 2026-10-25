import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { listWithdrawals } from "@/lib/services/withdrawals";
import { t } from "@/lib/i18n";
import { WithdrawalRow } from "./withdrawal-row";

export const metadata: Metadata = { title: "Arrepentimientos" };

export default async function WithdrawalsPage() {
  await requireRole("admin", "super_admin");
  const withdrawals = await listWithdrawals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t.withdrawal.adminTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.withdrawal.adminSubtitle}</p>
      </div>
      {withdrawals.length ? (
        <div className="space-y-3">
          {withdrawals.map((w) => (
            <WithdrawalRow key={w.id} w={w} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t.withdrawal.adminEmpty}</p>
      )}
    </div>
  );
}
