import type {
  CalculationWithDenominations,
  NewCalculation,
} from "@/lib/types/database"

export async function getCalculations(): Promise<
  CalculationWithDenominations[]
> {
  const response = await fetch("/api/calculations", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error || "Failed to fetch calculations.")
  }

  return response.json()
}

export async function createCalculation(
  data: NewCalculation
): Promise<CalculationWithDenominations> {
  const response = await fetch("/api/calculations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error || "Failed to create calculation.")
  }

  return response.json()
}

export async function deleteCalculation(id: string): Promise<void> {
  const response = await fetch(`/api/calculations/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error || "Failed to delete calculation.")
  }
}
