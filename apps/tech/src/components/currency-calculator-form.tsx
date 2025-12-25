"use client"

import * as React from "react"
import { Save, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

import { createCalculation } from "@/lib/api/client-calculations"
import { CURRENCY_DENOMINATIONS } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

interface DenominationInput {
  denomination: number
  count: string | number
  total: number
}

export function CurrencyCalculatorForm() {
  const router = useRouter()
  const [note, setNote] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [denominations, setDenominations] = React.useState<DenominationInput[]>(
    CURRENCY_DENOMINATIONS.map((currency) => ({
      denomination: currency.value,
      count: "",
      total: 0,
    }))
  )

  const updateDenomination = (index: number, value: string) => {
    const updated = [...denominations]
    const current = updated[index]
    if (!current) return

    updated[index] = { ...current, count: value }

    const numericValue = value === "" || value === "-" ? "0" : value
    const parsedValue = parseInt(numericValue) || 0
    updated[index].total = updated[index].denomination * parsedValue

    setDenominations(updated)
  }

  const getTotalAmount = () =>
    denominations.reduce((total, denom) => total + denom.total, 0)

  const validateAndParseDenominations = () => {
    const validDenominations: { denomination: number; count: number }[] = []

    for (const denom of denominations) {
      const countStr = denom.count.toString()
      let count = 0

      if (countStr && countStr !== "" && countStr !== "-") {
        const countMatch = countStr.match(/^-?\d+$/)
        if (countMatch) {
          count = parseInt(countStr)
        } else {
          throw new Error(
            `Invalid count for ₹${denom.denomination}: "${countStr}". Only numbers allowed.`
          )
        }
      }

      if (count !== 0) {
        validDenominations.push({
          denomination: denom.denomination,
          count,
        })
      }
    }

    return validDenominations
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      const validDenominations = validateAndParseDenominations()
      if (!validDenominations.length) {
        alert("Please enter at least one denomination with valid numbers.")
        return
      }

      setIsSubmitting(true)

      const now = new Date()
      const istDate = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      )
      const day = String(istDate.getDate()).padStart(2, "0")
      const month = String(istDate.getMonth() + 1).padStart(2, "0")
      const year = istDate.getFullYear()
      const hours = String(istDate.getHours()).padStart(2, "0")
      const minutes = String(istDate.getMinutes()).padStart(2, "0")
      const seconds = String(istDate.getSeconds()).padStart(2, "0")
      const istTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`

      await createCalculation({
        note: note || undefined,
        ist_timestamp: istTimestamp,
        denominations: validDenominations,
      })

      setNote("")
      setDenominations(
        CURRENCY_DENOMINATIONS.map((currency) => ({
          denomination: currency.value,
          count: "",
          total: 0,
        }))
      )
      router.refresh()
    } catch (error) {
      console.error("Error creating calculation:", error)
      alert(
        error instanceof Error
          ? error.message
          : "Error saving calculation. Please check your input."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalAmount = getTotalAmount()
  const totalTone = totalAmount >= 0 ? "text-emerald-600" : "text-destructive"

  return (
    <div className="w-full space-y-4 p-3 sm:space-y-6 sm:p-6">
      <Card className="border-primary/10 shadow-sm">
        <CardContent className="p-2 sm:p-4">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                  <Sparkles className="h-4 w-4" />
                  New calculation
                </p>
              </div>
              <Button
                type="submit"
                disabled={totalAmount === 0 || isSubmitting}
                className="h-6 min-h-[40px] px-5 text-sm font-semibold sm:h-6"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save calculation"}
              </Button>
            </div>

            <Separator />

            <div className="rounded-xl border bg-muted/40 p-4 sm:p-4">
              <div
                className="overflow-hidden rounded-lg border bg-background shadow-sm"
                style={{
                  width: "100%",
                  maxWidth: "100vw",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-muted">
                    <tr>
                      <th className="sticky left-0 z-20 w-24 bg-muted px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                        Denomination
                      </th>
                      <th className="w-20 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                        Count
                      </th>
                      <th className="w-24 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {denominations.map((denom, index) => (
                      <tr
                        key={denom.denomination}
                        className="group/row bg-background transition-colors hover:bg-muted"
                      >
                        <td className="sticky left-0 z-10 w-24 bg-background px-3 py-1.5 transition-colors group-hover/row:bg-muted">
                          <div className="text-base font-semibold text-foreground">
                            ₹{denom.denomination}
                          </div>
                        </td>
                        <td className="w-20 px-3 py-1.5 text-center">
                          <Input
                            type="text"
                            value={denom.count || ""}
                            onChange={(event) => updateDenomination(index, event.target.value)}
                            placeholder="0"
                            className="h-9 min-h-[36px] w-full touch-manipulation text-center text-base"
                          />
                        </td>
                        <td className="w-24 px-3 py-1.5 text-center">
                          <div
                            className={`text-base font-semibold ${
                              denom.total >= 0 ? "text-emerald-600" : "text-destructive"
                            }`}
                          >
                            ₹{denom.total.toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr] sm:items-start">
              <div className="rounded-lg border bg-muted/40 p-3 sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="note" className="text-sm font-semibold text-foreground">
                    Note
                  </label>
                </div>
                <Input
                  id="note"
                  placeholder="Add context (e.g., morning shift, drawer A)..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="h-11 min-h-[44px] text-base"
                />
              </div>

              <div className="rounded-lg border bg-background p-3 shadow-inner sm:p-4 text-right">
                <p className="text-sm font-semibold text-foreground mb-4">Total Amount</p>
                <p className={`text-3xl font-bold ${totalTone}`}>₹{totalAmount.toLocaleString()}</p>
                
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
