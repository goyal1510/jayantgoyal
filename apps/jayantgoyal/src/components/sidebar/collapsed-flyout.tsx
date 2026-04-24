"use client"

import React from "react"
import { createPortal } from "react-dom"

export function CollapsedFlyout({
  triggerRef,
  open,
  onClose,
  children,
  title,
}: {
  triggerRef: React.RefObject<HTMLLIElement | null>
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
}) {
  const flyoutRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  // Position flyout when opened
  React.useEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({
      top: rect.top,
      left: rect.right + 4,
    })
  }, [open, triggerRef])

  // Close on click outside
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        flyoutRef.current && !flyoutRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        onClose()
      }
    }

    // Close on Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    // Use setTimeout so the opening click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onClose, triggerRef])

  if (!open) return null

  // Clamp so flyout doesn't overflow off-screen
  const maxH = `min(400px, calc(100vh - ${position.top}px - 1rem))`

  return createPortal(
    <div
      ref={flyoutRef}
      className="animate-in fade-in-0 slide-in-from-left-2 fixed z-50 min-w-[180px] rounded-md border border-sidebar-border bg-sidebar p-1 shadow-lg duration-100"
      style={{
        top: position.top,
        left: position.left,
        maxHeight: maxH,
        overflowY: "auto",
      }}
    >
      <div className="px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/70">
        {title}
      </div>
      {children}
    </div>,
    document.body
  )
}
