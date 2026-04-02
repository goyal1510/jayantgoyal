"use client"

import { useEffect, useRef } from "react"
import { useSonner } from "sonner"
import { playToastSound } from "@/lib/sound"

export function ToastSoundProvider() {
  const { toasts } = useSonner()
  const prevCountRef = useRef(0)

  useEffect(() => {
    if (toasts.length > prevCountRef.current) {
      void playToastSound()
    }
    prevCountRef.current = toasts.length
  }, [toasts.length])

  return null
}
