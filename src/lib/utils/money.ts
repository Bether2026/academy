/** Formatea un precio sin decimales en el formato local de su moneda. */
export function formatPrice(currency: "ARS" | "EUR", amount: number) {
  return new Intl.NumberFormat(currency === "ARS" ? "es-AR" : "es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
