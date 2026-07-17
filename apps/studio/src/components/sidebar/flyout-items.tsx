"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@repo/ui/lib/utils"

export function FlyoutItem({
  href,
  icon: Icon,
  label,
  color,
  isActive,
  onClick,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
  isActive: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      )}
    >
      <Icon className={cn("size-4 shrink-0", color)} />
      <span className="truncate">{label}</span>
    </Link>
  )
}

export function FlyoutAnchorItem({
  href,
  icon: Icon,
  label,
  color,
  isActive,
  onClick,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
  isActive: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      )}
    >
      <Icon className={cn("size-4 shrink-0", color)} />
      <span className="truncate">{label}</span>
    </a>
  )
}
