export const CONTACT_STAGE_OPTIONS = [
  { value: "idea", label: "Idea or brief" },
  { value: "prototype", label: "Prototype or MVP" },
  { value: "live-product", label: "Live product" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export const CONTACT_TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "one-to-three-months", label: "Within 1–3 months" },
  { value: "three-plus-months", label: "More than 3 months" },
  { value: "exploring", label: "Exploring for now" },
] as const;

export function getContactOptionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
): string | null {
  return options.find((option) => option.value === value)?.label ?? null;
}
