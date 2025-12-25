"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play } from "lucide-react"

export default function BenchmarkBuilderPage() {
  const tool = getToolByPath("/benchmark-builder")
  const [code, setCode] = React.useState("")
  const [iterations, setIterations] = React.useState(1000)
  const [results, setResults] = React.useState<{ time: number; average: number } | null>(null)
  const [running, setRunning] = React.useState(false)

  const runBenchmark = () => {
    if (!code.trim()) return
    
    setRunning(true)
    const start = performance.now()
    
    try {
      const func = new Function(code)
      for (let i = 0; i < iterations; i++) {
        func()
      }
      const end = performance.now()
      const totalTime = end - start
      const average = totalTime / iterations
      
      setResults({ time: totalTime, average })
    } catch (error) {
      setResults({ time: 0, average: 0 })
    } finally {
      setRunning(false)
    }
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Benchmark Configuration</CardTitle>
          <CardDescription>Enter code to benchmark</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="iterations">Iterations</Label>
            <Input
              id="iterations"
              type="number"
              min="1"
              max="100000"
              value={iterations}
              onChange={(e) => setIterations(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Your code here"
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </div>
          <Button onClick={runBenchmark} disabled={running || !code.trim()}>
            <Play className="h-4 w-4 mr-2" />
            Run Benchmark
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-muted-foreground">Total Time</Label>
              <p className="font-semibold text-lg">{results.time.toFixed(4)} ms</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Average Time per Iteration</Label>
              <p className="font-semibold text-lg">{results.average.toFixed(6)} ms</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
