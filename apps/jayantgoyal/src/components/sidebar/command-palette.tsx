"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/command"
import { useSidebar } from "@repo/ui/sidebar"
import { cn } from "@repo/ui/lib/utils"
import { HUB_APPS } from "@/lib/config/hub-config"
import { toolCategories } from "@/lib/tools/tools"

function getAppUrl(app: (typeof HUB_APPS)[number]): string | null {
  if (app.externalUrl) return null
  if (app.url) return app.url
  if (app.navItems.length > 0) return app.navItems[0]!.url ?? `/${app.id}`
  return `/${app.id}`
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { isMobile, setOpenMobile } = useSidebar()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const navigate = React.useCallback(
    (url: string) => {
      setOpen(false)
      if (isMobile) setOpenMobile(false)
      router.push(url)
    },
    [router, isMobile, setOpenMobile]
  )

  const publicApps = React.useMemo(
    () => HUB_APPS.filter((app) => app.isPublic && !app.externalUrl),
    []
  )
  const privateApps = React.useMemo(
    () => HUB_APPS.filter((app) => !app.isPublic && !app.externalUrl),
    []
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border-input bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-9 w-48 items-center gap-2 rounded-md border px-3 text-sm shadow-xs transition-colors"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="text-foreground/70 flex-1 text-left text-xs font-medium">Find</span>
        <kbd className="bg-background text-muted-foreground pointer-events-none inline-flex h-6 items-center gap-0.5 rounded border px-2 font-mono text-xs font-medium select-none">
          <span>&#8984;</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search apps, pages, tools..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Explore">
            {publicApps.map((app) => {
              const url = getAppUrl(app)
              if (!url) return null
              return (
                <CommandItem key={app.id} onSelect={() => navigate(url)}>
                  <app.icon className={cn("size-4", app.color)} />
                  <span>{app.name}</span>
                </CommandItem>
              )
            })}
            {publicApps.flatMap((app) =>
              app.navItems.map((nav) => {
                const url = nav.url ?? `/${app.id}/${nav.id}`
                return (
                  <CommandItem
                    key={`${app.id}-${nav.id}`}
                    onSelect={() => navigate(url)}
                  >
                    <nav.icon className={cn("size-4", nav.color)} />
                    <span>
                      {app.name} &rsaquo; {nav.label}
                    </span>
                  </CommandItem>
                )
              })
            )}
          </CommandGroup>

          <CommandGroup heading="Apps">
            {privateApps.map((app) => {
              const url = getAppUrl(app)
              if (!url) return null
              return (
                <CommandItem key={app.id} onSelect={() => navigate(url)}>
                  <app.icon className={cn("size-4", app.color)} />
                  <span>{app.name}</span>
                </CommandItem>
              )
            })}
            {privateApps.flatMap((app) =>
              app.navItems.map((nav) => {
                const url = nav.url ?? `/${app.id}/${nav.id}`
                return (
                  <CommandItem
                    key={`${app.id}-${nav.id}`}
                    onSelect={() => navigate(url)}
                  >
                    <nav.icon className={cn("size-4", nav.color)} />
                    <span>
                      {app.name} &rsaquo; {nav.label}
                    </span>
                  </CommandItem>
                )
              })
            )}
          </CommandGroup>

          {toolCategories.map((category) => (
            <CommandGroup
              key={category.id}
              heading={`Tools \u203A ${category.title}`}
            >
              {category.tools.map((tool) => (
                <CommandItem
                  key={tool.id}
                  onSelect={() => navigate(tool.path)}
                >
                  <tool.icon className="size-4" />
                  <span>{tool.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
