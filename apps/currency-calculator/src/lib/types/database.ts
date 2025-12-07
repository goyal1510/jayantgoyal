export interface Calculation {
  id: string
  created_at: string | null
  note: string | null
  ist_timestamp: string | null
  user_id: string | null
}

export interface Denomination {
  id: string
  calculation_id: string | null
  denomination: number
  count: number
  bundle_count: number | null
  open_count: number | null
  total: number | null
}

export interface CalculationWithDenominations extends Calculation {
  denominations: Denomination[]
}

export interface NewCalculation {
  note?: string
  ist_timestamp?: string
  denominations: {
    denomination: number
    count: number
    bundle_count?: number
    open_count?: number
  }[]
}

export const CURRENCY_DENOMINATIONS = [
  { value: 500, label: "₹500" },
  { value: 200, label: "₹200" },
  { value: 100, label: "₹100" },
  { value: 50, label: "₹50" },
  { value: 20, label: "₹20" },
  { value: 10, label: "₹10" },
  { value: 5, label: "₹5" },
  { value: 2, label: "₹2" },
  { value: 1, label: "₹1" },
]
