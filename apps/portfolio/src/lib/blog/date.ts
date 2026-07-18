export type EditorialDateMonth = "short" | "long";

export function formatEditorialDate(
  value: string | null,
  month: EditorialDateMonth = "long",
): string | null {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month,
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
