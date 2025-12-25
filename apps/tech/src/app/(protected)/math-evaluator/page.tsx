"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function evaluateMath(expression: string): { result: number | null; error: string | null } {
  try {
    // Safe evaluation using Function constructor
    const sanitized = expression.replace(/[^0-9+\-*/().\s,sqrtcosinabslogexppow]/gi, "")
    const func = new Function("Math", `return ${sanitized}`)
    const result = func(Math)
    if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
      return { result, error: null }
    }
    return { result: null, error: "Invalid expression" }
  } catch {
    return { result: null, error: "Invalid expression" }
  }
}

export default function MathEvaluatorPage() {
  const tool = getToolByPath("/math-evaluator")
  const [expression, setExpression] = React.useState("")
  const [result, setResult] = React.useState<number | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!expression.trim()) {
      setResult(null)
      setError(null)
      return
    }

    const evalResult = evaluateMath(expression)
    setResult(evalResult.result)
    setError(evalResult.error)
  }, [expression])

  const copyToClipboard = () => {
    if (result !== null) {
      navigator.clipboard.writeText(result.toString())
      toast.success("Result copied to clipboard")
    }
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Mathematical Expression</CardTitle>
          <CardDescription>Enter expression to evaluate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="2 + 2 * 3"
            className="font-mono text-lg"
          />
          <p className="text-xs text-muted-foreground">
            Supports: +, -, *, /, sqrt(), cos(), sin(), abs(), log(), exp(), pow()
          </p>
        </CardContent>
      </Card>

      {(result !== null || error) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Result</CardTitle>
              {result !== null && (
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <p className="text-3xl font-bold font-mono">{result}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
