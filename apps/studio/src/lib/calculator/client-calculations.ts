import type { CalculationWithDenominations, NewCalculation } from "@/lib/calculator/database"

export interface PaginatedCalculationsResponse {
  items: CalculationWithDenominations[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  availableDates?: string[]
}

export async function getCalculations(params?: {
  page?: number
  pageSize?: number
  search?: string
  date?: string
}): Promise<PaginatedCalculationsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize))
  if (params?.search) searchParams.set("search", params.search)
  if (params?.date) searchParams.set("date", params.date)
  const query = searchParams.toString()

  const response = await fetch(`/api/calculator${query ? `?${query}` : ""}`, {
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
  const response = await fetch("/api/calculator", {
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
  const response = await fetch(`/api/calculator/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error || "Failed to delete calculation.")
  }
}
