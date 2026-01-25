"use client"

import { useEffect, useState } from "react"

import Calculator from "@/components/custom-calculator/Calculator"
import ComponentLibrary from "@/components/custom-calculator/ComponentLibrary"
import DragDropContainer from "@/components/custom-calculator/DragDropContainer"
import DragDropProvider from "@/components/custom-calculator/DragDropProvider"
import { useCalculatorStore } from "@/lib/custom-calculator/useCalculatorStore"

function CalculatorApp() {
  return (
    <DragDropProvider>
      <div className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-[-20%] mx-auto h-80 w-[70%] rounded-full bg-gradient-to-r from-sky-300/30 via-indigo-200/20 to-purple-200/30 blur-3xl dark:from-cyan-500/15 dark:via-slate-200/10 dark:to-indigo-500/10" />
        <div className="pointer-events-none absolute inset-y-0 left-[-10%] h-full w-64 bg-gradient-to-b from-slate-200/40 to-transparent blur-3xl dark:from-slate-900/30" />
        <div className="pointer-events-none absolute inset-y-0 right-[-10%] h-full w-64 bg-gradient-to-b from-indigo-200/30 to-transparent blur-3xl dark:from-indigo-900/30" />

        <main className="relative z-10 flex flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <ComponentLibrary />
              <DragDropContainer />
              <Calculator />
            </div>
          </div>
        </main>
      </div>
    </DragDropProvider>
  )
}

export default function Page() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    useCalculatorStore.persist.rehydrate()
  }, [])

  if (!isClient) {
    return (
      <div className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-[-20%] mx-auto h-80 w-[70%] rounded-full bg-gradient-to-r from-sky-300/30 via-indigo-200/20 to-purple-200/30 blur-3xl dark:from-cyan-500/15 dark:via-slate-200/10 dark:to-indigo-500/10" />
        <main className="relative z-10 flex flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[240px] rounded-2xl border border-white/10 bg-background/70 shadow-xl shadow-primary/5 backdrop-blur"
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return <CalculatorApp />
}
