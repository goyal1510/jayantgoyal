"use client"

import { usePathname } from "next/navigation"
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { Spinner } from "@/components/ui/spinner"

export function RouteChangeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [isChanging, setIsChanging] = useState(false)
  const prevPathname = useRef(pathname)

  // useLayoutEffect fires before paint, so the re-render from
  // setIsChanging(false) completes before the browser paints.
  // This means the provider's spinner and the page's own PageSpinner
  // are swapped in a single paint — no double-spinner flash.
  useLayoutEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname
      setIsChanging(false)
    }
  }, [pathname])

  // Safety timeout — clear loading state if navigation takes too long
  useEffect(() => {
    if (!isChanging) return
    const timeout = setTimeout(() => setIsChanging(false), 5000)
    return () => clearTimeout(timeout)
  }, [isChanging])

  // Detect clicks on internal links
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]")
      if (!anchor || anchor.target === "_blank" || e.metaKey || e.ctrlKey) return

      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return

      // Strip query and hash to compare pathnames
      const targetPath = href.split("?")[0]?.split("#")[0]
      if (targetPath && targetPath !== pathname) {
        setIsChanging(true)
      }
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [pathname])

  return (
    <>
      {isChanging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
          <Spinner size="lg" />
        </div>
      )}
      {children}
    </>
  )
}
