"use client"

import * as React from "react"
import { toast } from "sonner"

import { TYPING_TEXTS } from "@/lib/games/typing-texts"
import type { TypingTestResult, PaginatedTypingResults } from "@/lib/typing-test/database"

export type Tab = "test" | "history"
export type Duration = 30 | 60 | 120

function getRandomText(): string {
  return TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)]!
}

export function useTypingSpeedTest() {
  const [tab, setTab] = React.useState<Tab>("test")

  const [text, setText] = React.useState(TYPING_TEXTS[0]!)
  const [typed, setTyped] = React.useState("")
  const [started, setStarted] = React.useState(false)
  const [finished, setFinished] = React.useState(false)
  const [startTime, setStartTime] = React.useState<number>(0)
  const [elapsed, setElapsed] = React.useState(0)
  const [duration, setDuration] = React.useState<Duration>(60)
  const [saving, setSaving] = React.useState(false)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const [results, setResults] = React.useState<TypingTestResult[]>([])
  const [historyLoading, setHistoryLoading] = React.useState(false)
  const [historyLoaded, setHistoryLoaded] = React.useState(false)
  const [historyPage, setHistoryPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)

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

  const finishTest = React.useCallback(() => {
    setFinished(true)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

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

  return {
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
    correctChars,
    currentWPM,
    accuracy,
    progress,
    timeLeft,
    bestWPM,
    avgWPM,
    avgAccuracy,
    handleInput,
    handleKeyDown,
    saveResult,
    resetTest,
    loadHistory,
  }
}
