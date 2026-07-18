import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PlanRow } from "./plan-row";

export const metadata: Metadata = { title: "Planes" };

export default async function PlansAdminPage() {
  await requireRole("admin", "super_admin");
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("plans")
    .select("id, name, description, price, currency, billing_interval, classes_per_period, is_active")
    .order("currency")
    .order("classes_per_period");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Planes</h1>
        <p className="text-sm text-muted-foreground">
          Los planes no se eliminan: se desactivan (las suscripciones históricas los referencian).
        </p>
      </div>
      <div className="space-y-2">
        {(plans ?? []).map((p) => (
          <PlanRow key={p.id} plan={p} />
        ))}
      </div>
    </div>
  );
}
