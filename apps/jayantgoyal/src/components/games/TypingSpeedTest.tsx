"use client"

import {
  Clock,
  History,
  Keyboard,
  RotateCcw,
  Target,
  Trophy,
  Zap,
} from "lucide-react"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"

import { useTypingSpeedTest, type Duration } from "@/components/games/use-typing-speed-test"
import { GameSetupShell } from "@/components/games/game-setup-shell"
import { TypingSpeedHistory } from "@/components/games/typing-speed-history"

export function TypingSpeedTest() {
  const {
    tab,
    setTab,
    text,
    typed,
    started,
    finished,
    elapsed,
    duration,
    setDuration,
    saving,
    inputRef,
    results,
    historyLoading,
    historyLoaded,
    historyPage,
    totalPages,
    currentWPM,
    accuracy,
    progress,
    timeLeft,
    bestWPM,
    avgWPM,
    avgAccuracy,
    handleInput,
    handleKeyDown,
    startTest,
    saveResult,
    resetTest,
    loadHistory,
  } = useTypingSpeedTest()

  return (
    <div className="mx-auto max-w-3xl space-y-4">
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
          {!started && !finished && (
            <GameSetupShell
              title="Typing Speed"
              description="Pick the test length and review the text before the timer starts."
              onStart={startTest}
              startLabel="Start test"
              className="max-w-3xl"
            >
              <div className="flex flex-wrap items-center gap-3">
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
              <div className="rounded-lg border bg-background/70 p-4 font-mono text-sm leading-6 text-muted-foreground">
                {text}
              </div>
            </GameSetupShell>
          )}

          {(started || finished) && <div className="grid grid-cols-4 gap-3">
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
          </div>}

          {(started || finished) && <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>}

          {(started || finished) && <Card
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
              <textarea
                ref={inputRef}
                value={typed}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                disabled={!started || finished}
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
          </Card>}

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
        <div className="space-y-4">
          <TypingSpeedHistory
            results={results}
            historyLoading={historyLoading}
            historyLoaded={historyLoaded}
            historyPage={historyPage}
            totalPages={totalPages}
            bestWPM={bestWPM}
            avgWPM={avgWPM}
            avgAccuracy={avgAccuracy}
            loadHistory={loadHistory}
          />
        </div>
      )}
    </div>
  )
}
