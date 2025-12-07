"use client"

import * as React from "react"
import { Save } from "lucide-react"
import { useRouter } from "next/navigation"

import { createCalculation } from "@/lib/api/client-calculations"
import { CURRENCY_DENOMINATIONS } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

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

  return (
    <div className="w-full space-y-2 p-1 sm:space-y-4 sm:p-4">
      <Card className="shadow-sm">
        <CardContent className="p-2 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2 sm:space-y-3">
              <div className="rounded-lg bg-muted p-2 sm:p-3">
                <h3 className="mb-2 text-center text-base font-semibold text-muted-foreground sm:mb-3">
                  Denomination Details
                </h3>
                <div
                  className="overflow-x-auto"
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
                      <tr className="border-b border-border">
                        <th className="sticky left-0 z-20 w-24 border-r border-border bg-muted px-3 py-2 text-left text-sm font-semibold text-muted-foreground">
                          Denomination
                        </th>
                        <th className="w-20 px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                          Count
                        </th>
                        <th className="w-24 px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {denominations.map((denom, index) => (
                        <tr
                          key={denom.denomination}
                          className="border-b border-border transition-colors hover:bg-muted"
                        >
                          <td className="sticky left-0 z-10 w-24 border-r border-border bg-muted px-3 py-1">
                            <div className="text-base font-semibold text-foreground">
                              ₹{denom.denomination}
                            </div>
                          </td>
                          <td className="w-20 px-3 py-1 text-center">
                            <Input
                              type="text"
                              value={denom.count || ""}
                              onChange={(event) =>
                                updateDenomination(index, event.target.value)
                              }
                              placeholder="0"
                              className="h-8 min-h-[32px] w-full touch-manipulation text-center text-base"
                            />
                          </td>
                          <td className="w-24 px-3 py-1 text-center">
                            <div
                              className={`text-base font-semibold ${
                                denom.total >= 0
                                  ? "text-green-600"
                                  : "text-destructive"
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
            </div>

            <div className="gap-4 rounded-lg bg-muted p-4 sm:flex sm:items-end sm:gap-6 sm:p-6">
              <div className="flex-1">
                <Input
                  id="note"
                  placeholder="Add a note for this calculation..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-2 h-12 min-h-[48px] text-lg sm:h-8 sm:text-sm"
                />
              </div>
              <div className="text-center sm:text-right">
                <p
                  className={`flex h-12 items-center justify-center text-xl font-bold sm:h-8 sm:justify-end sm:text-base ${
                    getTotalAmount() >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ₹{getTotalAmount().toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button
                type="submit"
                disabled={getTotalAmount() === 0 || isSubmitting}
                className="h-16 min-h-[64px] w-full px-8 py-4 text-lg font-medium sm:h-10 sm:w-auto sm:py-2 sm:text-base"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Calculation"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
