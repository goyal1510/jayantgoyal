"use client"

import * as React from "react"
import {
  Clock,
  History,
  Keyboard,
  RotateCcw,
  Target,
  Trophy,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { PageSpinner } from "@/components/ui/page-spinner"
import { TYPING_TEXTS } from "@/lib/games/typing-texts"
import type { TypingTestResult, PaginatedTypingResults } from "@/lib/typing-test/database"

type Tab = "test" | "history"
type Duration = 30 | 60 | 120

function getRandomText(): string {
  return TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)]!
}

export function TypingSpeedTest() {
  const [tab, setTab] = React.useState<Tab>("test")

  // Test state
  const [text, setText] = React.useState(() => getRandomText())
  const [typed, setTyped] = React.useState("")
  const [started, setStarted] = React.useState(false)
  const [finished, setFinished] = React.useState(false)
  const [startTime, setStartTime] = React.useState<number>(0)
  const [elapsed, setElapsed] = React.useState(0)
  const [duration, setDuration] = React.useState<Duration>(60)
  const [saving, setSaving] = React.useState(false)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  // History state
  const [results, setResults] = React.useState<TypingTestResult[]>([])
  const [historyLoading, setHistoryLoading] = React.useState(false)
  const [historyLoaded, setHistoryLoaded] = React.useState(false)
  const [historyPage, setHistoryPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)

  // Computed stats
  const correctChars = React.useMemo(() => {
    let count = 0
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === text[i]) count++
    }
    return count
  }, [typed, text])

  const currentWPM = React.useMemo(() => {
    if (elapsed === 0) return 0
    return Math.round((correctChars / 5) / (elapsed / 60))
  }, [correctChars, elapsed])

  const accuracy = React.useMemo(() => {
    if (typed.length === 0) return 100
    return Math.round((correctChars / typed.length) * 10000) / 100
  }, [correctChars, typed.length])

  const progress = React.useMemo(() => {
    return Math.min((typed.length / text.length) * 100, 100)
  }, [typed.length, text.length])

  const timeLeft = duration - elapsed

  // Timer
  React.useEffect(() => {
    if (started && !finished) {
      timerRef.current = setInterval(() => {
        const now = Date.now()
        const newElapsed = Math.floor((now - startTime) / 1000)
        setElapsed(newElapsed)

        if (newElapsed >= duration) {
          finishTest()
        }
      }, 200)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, finished, startTime, duration])

  const finishTest = React.useCallback(() => {
    setFinished(true)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (finished) return
    const value = e.target.value

    if (!started && value.length > 0) {
      setStarted(true)
      setStartTime(Date.now())
    }

    setTyped(value)

    if (value.length >= text.length) {
      finishTest()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent tab from leaving the textarea
    if (e.key === "Tab") {
      e.preventDefault()
    }
  }

  const saveResult = async () => {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch("/api/typing-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wpm: currentWPM,
          accuracy,
          duration_seconds: Math.min(elapsed, duration),
          total_characters: typed.length,
          correct_characters: correctChars,
          text_length: text.length,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Result saved!")
      setHistoryLoaded(false)
    } catch {
      toast.error("Failed to save result")
    } finally {
      setSaving(false)
    }
  }

  const resetTest = () => {
    setText(getRandomText())
    setTyped("")
    setStarted(false)
    setFinished(false)
    setStartTime(0)
    setElapsed(0)
    if (timerRef.current) clearInterval(timerRef.current)
    inputRef.current?.focus()
  }

  const loadHistory = React.useCallback(async (page: number) => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/typing-test?page=${page}&pageSize=15`)
      if (!res.ok) throw new Error("Failed to load")
      const data: PaginatedTypingResults = await res.json()
      setResults(data.items)
      setTotalPages(data.totalPages)
      setHistoryPage(data.page)
    } catch {
      toast.error("Failed to load history")
    } finally {
      setHistoryLoading(false)
      setHistoryLoaded(true)
    }
  }, [])

  React.useEffect(() => {
    if (tab === "history" && !historyLoaded) {
      void loadHistory(1)
    }
  }, [tab, historyLoaded, loadHistory])

  // History stats
  const bestWPM = results.length
    ? Math.max(...results.map((r) => r.wpm))
    : 0
  const avgWPM = results.length
    ? Math.round(results.reduce((sum, r) => sum + r.wpm, 0) / results.length)
    : 0
  const avgAccuracy = results.length
    ? Math.round(
        (results.reduce((sum, r) => sum + r.accuracy, 0) / results.length) * 100
      ) / 100
    : 0

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        <Button
          variant={tab === "test" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("test")}
          className="gap-1.5"
        >
          <Keyboard className="h-4 w-4" />
          Test
        </Button>
        <Button
          variant={tab === "history" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("history")}
          className="gap-1.5"
        >
          <History className="h-4 w-4" />
          History
        </Button>
      </div>

      {tab === "test" ? (
        <div className="space-y-4">
          {/* Controls */}
          {!started && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Duration:</span>
              {([30, 60, 120] as Duration[]).map((d) => (
                <Button
                  key={d}
                  variant={duration === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDuration(d)}
                >
                  {d}s
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={resetTest} className="ml-auto gap-1">
                <RotateCcw className="h-3.5 w-3.5" />
                New text
              </Button>
            </div>
          )}

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            <Card>
              <CardContent className="flex items-center gap-2 p-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <div>
                  <div className="text-xs text-muted-foreground">WPM</div>
                  <div className="text-xl font-bold">{currentWPM}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-2 p-3">
                <Target className="h-4 w-4 text-emerald-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                  <div className="text-xl font-bold">{accuracy}%</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-2 p-3">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Time left</div>
                  <div className="text-xl font-bold">
                    {started ? `${Math.max(timeLeft, 0)}s` : `${duration}s`}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-2 p-3">
                <Keyboard className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                  <div className="text-xl font-bold">{Math.round(progress)}%</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Text display */}
          <Card
            className="cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            <CardContent className="relative p-4 sm:p-6">
              <div className="select-none font-mono text-base leading-relaxed sm:text-lg">
                {text.split("").map((char, i) => {
                  let className = "text-muted-foreground/50"
                  if (i < typed.length) {
                    className =
                      typed[i] === char
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500 bg-red-100 dark:bg-red-900/30"
                  } else if (i === typed.length) {
                    className =
                      "text-foreground border-l-2 border-primary animate-pulse"
                  }
                  return (
                    <span key={i} className={className}>
                      {char}
                    </span>
                  )
                })}
              </div>
              {/* Hidden input */}
              <textarea
                ref={inputRef}
                value={typed}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                disabled={finished}
                className="absolute inset-0 h-full w-full cursor-text resize-none opacity-0"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              {!started && !finished && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                  <p className="text-sm text-muted-foreground">
                    Click here and start typing...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {finished && (
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Test Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-emerald-600">{currentWPM}</div>
                    <div className="text-sm text-muted-foreground">WPM</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{accuracy}%</div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{Math.min(elapsed, duration)}s</div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveResult} disabled={saving} className="flex-1">
                    {saving ? "Saving..." : "Save Result"}
                  </Button>
                  <Button variant="outline" onClick={resetTest} className="flex-1 gap-1">
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Running controls */}
          {started && !finished && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={resetTest} className="gap-1">
                <RotateCcw className="h-3.5 w-3.5" />
                Restart
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* History tab */
        <div className="space-y-4">
          {historyLoading && !historyLoaded ? (
            <PageSpinner />
          ) : results.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <History className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p className="text-base font-medium">No results yet</p>
                <p className="text-sm">Complete a typing test to see your history here.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-muted-foreground">Best WPM</div>
                    <div className="text-2xl font-bold text-emerald-600">{bestWPM}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-muted-foreground">Avg WPM</div>
                    <div className="text-2xl font-bold">{avgWPM}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-muted-foreground">Avg Accuracy</div>
                    <div className="text-2xl font-bold">{avgAccuracy}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Results table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-hidden rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/70">
                        <tr className="text-left">
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5 text-center">WPM</th>
                          <th className="px-4 py-2.5 text-center">Accuracy</th>
                          <th className="px-4 py-2.5 text-center">Duration</th>
                          <th className="px-4 py-2.5 text-center">Chars</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r) => (
                          <tr key={r.id} className="border-b transition hover:bg-muted/40">
                            <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                              {r.created_at
                                ? new Date(r.created_at).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "N/A"}
                            </td>
                            <td className="px-4 py-2.5 text-center font-semibold text-emerald-600">
                              {r.wpm}
                            </td>
                            <td className="px-4 py-2.5 text-center">{r.accuracy}%</td>
                            <td className="px-4 py-2.5 text-center">{r.duration_seconds}s</td>
                            <td className="px-4 py-2.5 text-center text-muted-foreground">
                              {r.correct_characters}/{r.total_characters}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={historyPage <= 1 || historyLoading}
                    onClick={() => loadHistory(historyPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {historyPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={historyPage >= totalPages || historyLoading}
                    onClick={() => loadHistory(historyPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
