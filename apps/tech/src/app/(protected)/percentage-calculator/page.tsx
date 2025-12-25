"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PercentageCalculatorPage() {
  const tool = getToolByPath("/percentage-calculator")
  const [value1, setValue1] = React.useState("")
  const [value2, setValue2] = React.useState("")
  const [percentage, setPercentage] = React.useState<number | null>(null)

  React.useEffect(() => {
    const v1 = parseFloat(value1)
    const v2 = parseFloat(value2)
    if (!isNaN(v1) && !isNaN(v2) && v2 !== 0) {
      setPercentage((v1 / v2) * 100)
    } else {
      setPercentage(null)
    }
  }, [value1, value2])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Calculate Percentage</CardTitle>
          <CardDescription>Enter two values to calculate percentage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value1">Value 1</Label>
              <Input
                id="value1"
                type="number"
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                placeholder="25"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value2">Value 2</Label>
              <Input
                id="value2"
                type="number"
                value={value2}
                onChange={(e) => setValue2(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {percentage !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>Percentage calculation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {percentage.toFixed(2)}%
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {value1} is {percentage.toFixed(2)}% of {value2}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
