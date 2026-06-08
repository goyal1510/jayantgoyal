export function formatCommercePrice(unitAmount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: unitAmount % 100 === 0 ? 0 : 2,
  }).format(unitAmount / 100)
}

export function formatCommerceInterval(interval: string | null) {
  if (!interval) return ""

  return interval === "month" ? "/mo" : `/${interval}`
}
