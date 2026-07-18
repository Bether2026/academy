import "server-only";

export type PublicPlan = {
  name: string;
  description: string;
  classesPerPeriod: number;
  prices: { currency: "ARS" | "EUR"; amount: number }[];
  highlighted: boolean;
};

/** Espejo del seed — se usa si la DB aún no está configurada (setup inicial). */
const FALLBACK_PLANS: PublicPlan[] = [
  {
    name: "Despegue",
    description: "4 clases individuales por mes con tu profesor asignado",
    classesPerPeriod: 4,
    prices: [
      { currency: "ARS", amount: 48000 },
      { currency: "EUR", amount: 59 },
    ],
    highlighted: false,
  },
  {
    name: "Vuelo",
    description: "8 clases individuales por mes + seguimiento intensivo",
    classesPerPeriod: 8,
    prices: [
      { currency: "ARS", amount: 88000 },
      { currency: "EUR", amount: 109 },
    ],
    highlighted: true,
  },
];

/** Planes activos para la landing, agrupados por nombre (un precio por moneda). */
export async function getPublicPlans(): Promise<PublicPlan[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return FALLBACK_PLANS;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("plans")
      .select("name, description, price, currency, classes_per_period")
      .eq("is_active", true)
      .order("classes_per_period");

    if (error || !data?.length) return FALLBACK_PLANS;

    const grouped = new Map<string, PublicPlan>();
    for (const p of data) {
      const plan: PublicPlan = grouped.get(p.name) ?? {
        name: p.name,
        description: p.description,
        classesPerPeriod: p.classes_per_period,
        prices: [],
        highlighted: false,
      };
      plan.prices.push({ currency: p.currency.trim() as "ARS" | "EUR", amount: Number(p.price) });
      grouped.set(p.name, plan);
    }
    const plans = [...grouped.values()];
    if (plans.length > 1) plans[plans.length - 1].highlighted = true;
    return plans;
  } catch {
    return FALLBACK_PLANS;
  }
}

export function formatPrice(currency: "ARS" | "EUR", amount: number) {
  return new Intl.NumberFormat(currency === "ARS" ? "es-AR" : "es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
