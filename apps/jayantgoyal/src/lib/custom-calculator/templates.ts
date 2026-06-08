import type { CalculatorComponent } from "@/lib/custom-calculator/types"

export const CUSTOM_CALCULATOR_COMPONENT_LIMIT = 80
export const CUSTOM_CALCULATOR_TEMPLATE_NAME_LIMIT = 80
export const CUSTOM_CALCULATOR_ALLOWED_LABELS = new Set([
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ".",
  "+",
  "-",
  "*",
  "/",
  "%",
  "=",
  "C",
  "<",
  "CE",
  "±",
  "(",
  ")",
])

export interface CustomCalculatorTemplate {
  id: string
  name: string
  description: string | null
  components: CalculatorComponent[]
  dark_mode: boolean
  created_at: string
  updated_at: string
}

export interface CustomCalculatorTemplateAccess {
  plan: "free" | "pro"
  isPro: boolean
  limit: number
}

export function normalizeTemplateName(value: unknown) {
  if (typeof value !== "string") return null

  const name = value.trim().replace(/\s+/g, " ")
  if (!name || name.length > CUSTOM_CALCULATOR_TEMPLATE_NAME_LIMIT) return null

  return name
}

export function normalizeTemplateDescription(value: unknown) {
  if (typeof value !== "string") return null

  const description = value.trim().replace(/\s+/g, " ")
  if (!description) return null

  return description.slice(0, 280)
}

export function normalizeTemplateComponents(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return null
  if (value.length > CUSTOM_CALCULATOR_COMPONENT_LIMIT) return null

  const components: CalculatorComponent[] = []
  for (const item of value) {
    if (!item || typeof item !== "object") return null
    const candidate = item as Record<string, unknown>
    if (candidate.type !== "button") return null
    if (typeof candidate.label !== "string") return null
    if (!CUSTOM_CALCULATOR_ALLOWED_LABELS.has(candidate.label)) return null
    components.push({ type: "button", label: candidate.label })
  }

  return components
}
