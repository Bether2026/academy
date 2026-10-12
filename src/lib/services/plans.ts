import "server-only";

export type PlanCategory = "adults" | "kids" | "exam";

export type PublicPlan = {
  name: string;
  description: string;
  classesPerPeriod: number;
  category: PlanCategory;
  /** Examen o programa (B1…C2, IELTS, APTIS, CAMBRIDGE); null en clases generales. */
  track: string | null;
  sessionsPerWeek: number | null;
  prices: { currency: "ARS" | "EUR"; amount: number }[];
};

/** Planes activos para la landing, agrupados por nombre (un precio por moneda). */
export async function getPublicPlans(): Promise<PublicPlan[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("plans")
      .select("name, description, price, currency, classes_per_period, category, track, sessions_per_week")
      .eq("is_active", true)
      .order("category")
      .order("sessions_per_week");

    if (error || !data?.length) return [];

    const grouped = new Map<string, PublicPlan>();
    for (const p of data) {
      const plan: PublicPlan = grouped.get(p.name) ?? {
        name: p.name,
        description: p.description,
        classesPerPeriod: p.classes_per_period,
        category: p.category,
        track: p.track,
        sessionsPerWeek: p.sessions_per_week,
        prices: [],
      };
      plan.prices.push({ currency: p.currency.trim() as "ARS" | "EUR", amount: Number(p.price) });
      grouped.set(p.name, plan);
    }
    const plans = [...grouped.values()];
    // mismo orden de monedas en todas las tarjetas: ARS arriba, EUR abajo
    for (const p of plans) p.prices.sort((a, b) => a.currency.localeCompare(b.currency));
    return plans;
  } catch {
    return [];
  }
}
