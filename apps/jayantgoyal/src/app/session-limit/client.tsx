"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Monitor, Smartphone, Globe, Loader2, X, ShieldAlert } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip"
import { toast } from "sonner"

interface SessionInfo {
  id: string
  createdAt: string
  updatedAt: string
  userAgent: string | null
  ip: string | null
  isCurrent: boolean
}

const MAX_SESSIONS = 2

function parseUserAgent(ua: string | null): { label: string; isMobile: boolean } {
  if (!ua) return { label: "Unknown device", isMobile: false }

  let browser = ""
  if (ua.includes("Firefox/")) browser = "Firefox"
  else if (ua.includes("Edg/")) browser = "Edge"
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera"
  else if (ua.includes("Chrome/") && ua.includes("Safari/")) browser = "Chrome"
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari"

  let os = ""
  if (ua.includes("Windows")) os = "Windows"
  else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS"
  else if (ua.includes("Android")) os = "Android"
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"
  else if (ua.includes("Linux")) os = "Linux"

  const isMobile = ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")
  const label = browser && os ? `${browser} on ${os}` : browser || os || "Unknown device"
  return { label, isMobile }
}

function formatIp(ip: string): string {
  return ip.replace(/\/\d+$/, "")
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function SessionLimitClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/"

  const [sessions, setSessions] = React.useState<SessionInfo[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [revokingId, setRevokingId] = React.useState<string | null>(null)

  const canContinue = sessions.length <= MAX_SESSIONS

  const fetchSessions = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/account/sessions")
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { sessions: SessionInfo[] }
      setSessions(data.sessions)
    } catch {
      toast.error("Failed to load sessions.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchSessions()
  }, [fetchSessions])

  const handleRevoke = React.useCallback(async (sessionId: string) => {
    setRevokingId(sessionId)
    try {
      const res = await fetch("/api/account/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? "Failed to revoke session.")
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      toast.success("Session revoked.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke session.")
    } finally {
      setRevokingId(null)
    }
  }, [])

  const handleContinue = () => {
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="bg-destructive/10 text-destructive mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
          <ShieldAlert className="size-6" />
        </div>
        <CardTitle>Session limit reached</CardTitle>
        <CardDescription>
          You can be logged in on up to {MAX_SESSIONS} devices. Revoke a session
          to continue.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const { label, isMobile } = parseUserAgent(session.userAgent)
              const deviceLabel = session.isCurrent ? "This device" : label
              const DeviceIcon = isMobile ? Smartphone : Monitor
              const isRevoking = revokingId === session.id

              return (
                <div
                  key={session.id}
                  className="bg-muted/50 flex items-start gap-3 rounded-lg border p-3"
                >
                  <DeviceIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {deviceLabel}
                      </span>
                      {session.isCurrent && (
                        <Badge
                          variant="secondary"
                          className="shrink-0 px-1.5 py-0 text-[10px]"
                        >
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      {session.ip && (
                        <>
                          <Globe className="size-3" />
                          <span>{formatIp(session.ip)}</span>
                          <span>&middot;</span>
                        </>
                      )}
                      <span>
                        Created {formatRelativeTime(session.createdAt)}
                      </span>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive mt-0.5 shrink-0 cursor-pointer transition-colors disabled:opacity-50"
                          onClick={() => void handleRevoke(session.id)}
                          disabled={isRevoking || revokingId !== null}
                        >
                          {isRevoking ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <X className="size-4" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Revoke session</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={handleContinue}
          disabled={!canContinue || isLoading}
        >
          {canContinue ? "Continue" : "Revoke a session to continue"}
        </Button>
      </CardFooter>
    </Card>
  )
}
