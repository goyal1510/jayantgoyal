import { useState, useEffect } from "react"

/**
 * Tracks which section is currently visible based on scroll position.
 * Returns the ID of the active section.
 */
export function useScrollTracking(sectionIds: string[], enabled: boolean) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] || "home")

  useEffect(() => {
    if (!sectionIds.length || !enabled) return

    const updateActiveSection = () => {
      // Use viewport-relative positions (getBoundingClientRect)
      // Works regardless of offsetParent nesting
      const threshold = window.innerHeight * 0.3
      let current = sectionIds[0] || "home"

      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= threshold) {
            current = id
          }
        }
      }

      // If scrolled to bottom, activate last section
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50
      if (isAtBottom && sectionIds.length > 0) {
        current = sectionIds[sectionIds.length - 1] || "home"
      }

      setActiveSection(current)
    }

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveSection()
          ticking = false
        })
        ticking = true
      }
    }

    const setupWithRetry = () => {
      if (!sectionIds.some((id) => document.getElementById(id))) {
        setTimeout(setupWithRetry, 100)
        return
      }
      updateActiveSection()
      window.addEventListener("scroll", handleScroll, { passive: true })
    }

    setupWithRetry()

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [sectionIds, enabled])

  return activeSection
}
