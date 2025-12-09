'use client'

import { useEffect, useState } from "react"

import Calculator from "@/components/Calculator"
import ComponentLibrary from "@/components/ComponentLibrary"
import DragDropContainer from "@/components/DragDropContainer"
import DragDropProvider from "@/components/DragDropProvider"
import ThemeToogle from "@/components/theme-toogle"
import { useCalculatorStore } from "@/store/useCalculatorStore"

function CalculatorApp() {
  return (
    <DragDropProvider>
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-slate-100 via-white to-slate-50 text-foreground dark:from-slate-950 dark:via-slate-900/60 dark:to-black">
        <div className="pointer-events-none absolute inset-x-0 top-[-20%] mx-auto h-80 w-[70%] rounded-full bg-gradient-to-r from-sky-300/30 via-indigo-200/20 to-purple-200/30 blur-3xl dark:from-cyan-500/15 dark:via-slate-200/10 dark:to-indigo-500/10" />
        <div className="pointer-events-none absolute inset-y-0 left-[-10%] h-full w-64 bg-gradient-to-b from-slate-200/40 to-transparent blur-3xl dark:from-slate-900/30" />
        <div className="pointer-events-none absolute inset-y-0 right-[-10%] h-full w-64 bg-gradient-to-b from-indigo-200/30 to-transparent blur-3xl dark:from-indigo-900/30" />

        <header className="relative z-10 border-b border-white/5 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect width="14" height="14" x="5" y="5" rx="2" />
                  <path d="M9 9h6" />
                  <path d="M9 12h6" />
                  <path d="M9 15h3" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-tight sm:text-xl">
                  Custom Drag & Drop Calculator
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToogle />
            </div>
          </div>
        </header>

        <main className="relative z-10 flex flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <ComponentLibrary />
              <DragDropContainer />
              <Calculator />
            </div>
          </div>
        </main>

        <footer className="relative z-10 border-t border-white/5 bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-4 md:flex-row">
            <span className="text-sm text-muted-foreground">
              Built with <span className="text-destructive">❤️</span> by{" "}
              <span className="font-semibold text-foreground">Jayant</span>
            </span>
          </div>
        </footer>
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
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-slate-100 via-white to-slate-50 text-foreground dark:from-slate-950 dark:via-slate-900/60 dark:to-black">
        <div className="pointer-events-none absolute inset-x-0 top-[-20%] mx-auto h-80 w-[70%] rounded-full bg-gradient-to-r from-sky-300/30 via-indigo-200/20 to-purple-200/30 blur-3xl dark:from-cyan-500/15 dark:via-slate-200/10 dark:to-indigo-500/10" />
        <div className="pointer-events-none absolute inset-y-0 left-[-10%] h-full w-64 bg-gradient-to-b from-slate-200/40 to-transparent blur-3xl dark:from-slate-900/30" />
        <div className="pointer-events-none absolute inset-y-0 right-[-10%] h-full w-64 bg-gradient-to-b from-indigo-200/30 to-transparent blur-3xl dark:from-indigo-900/30" />

        <header className="relative z-10 border-b border-white/5 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect width="14" height="14" x="5" y="5" rx="2" />
                  <path d="M9 9h6" />
                  <path d="M9 12h6" />
                  <path d="M9 15h3" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-tight sm:text-xl">
                  Custom Drag & Drop Calculator
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToogle />
            </div>
          </div>
        </header>

        <main className="relative z-10 flex flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
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

        <footer className="relative z-10 border-t border-white/5 bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-4 md:flex-row">
            <span className="text-sm text-muted-foreground">
              Built with <span className="text-destructive">❤️</span> by{" "}
              <span className="font-semibold text-foreground">Jayant</span>
            </span>
          </div>
        </footer>
      </div>
    )
  }

  return <CalculatorApp />
}
