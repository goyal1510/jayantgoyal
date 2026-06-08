"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Copy, ExternalLink, Link2, Trash2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog"
import { Button } from "@repo/ui/button"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import type { DirectoryListingItem } from "@/lib/file-manager/types"

interface ShareLink {
  id: string
  expires_at: string
  revoked_at: string | null
  last_accessed_at: string | null
  download_count: number
  created_at: string
}

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: DirectoryListingItem | null
}

function formatDate(value: string | null) {
  if (!value) return "Never"
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function ShareDialog({ open, onOpenChange, file }: ShareDialogProps) {
  const [links, setLinks] = React.useState<ShareLink[]>([])
  const [expiresInHours, setExpiresInHours] = React.useState(24)
  const [shareUrl, setShareUrl] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadLinks = React.useCallback(async () => {
    if (!file || file.is_directory) return
    try {
      const response = await fetch(`/api/files/${file.id}/share`)
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? "Unable to load share links.")
      setLinks(data.links ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load share links.")
    }
  }, [file])

  React.useEffect(() => {
    if (!open) {
      setLinks([])
      setShareUrl("")
      setError(null)
      setExpiresInHours(24)
      return
    }
    void loadLinks()
  }, [open, loadLinks])

  const createShareLink = async () => {
    if (!file || file.is_directory) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/files/${file.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInHours }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? "Unable to create share link.")

      setShareUrl(data.shareUrl)
      await navigator.clipboard.writeText(data.shareUrl)
      toast.success("Share link copied")
      await loadLinks()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create share link.")
    } finally {
      setLoading(false)
    }
  }

  const copyShareUrl = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    toast.success("Share link copied")
  }

  const revokeLink = async (link: ShareLink) => {
    if (!file) return
    try {
      const response = await fetch(`/api/files/${file.id}/share/${link.id}`, {
        method: "DELETE",
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? "Unable to revoke share link.")
      toast.success("Share link revoked")
      await loadLinks()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to revoke share link.")
    }
  }

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Share file
          </DialogTitle>
          <DialogDescription>
            Create an expiring link for &quot;{file.display_name || file.file_name}&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {file.is_directory ? (
            <p className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
              Folder sharing is not available yet. Share individual files.
            </p>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="share-expiry">Expires after hours</Label>
                <Input
                  id="share-expiry"
                  type="number"
                  min={1}
                  max={168}
                  value={expiresInHours}
                  onChange={(event) => setExpiresInHours(Number(event.target.value))}
                  disabled={loading}
                />
              </div>

              <Button onClick={createShareLink} disabled={loading} className="w-full">
                <Link2 className="mr-2 h-4 w-4" />
                {loading ? "Creating..." : "Create and copy link"}
              </Button>

              {shareUrl ? (
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="font-mono text-xs" />
                  <Button type="button" variant="outline" size="icon" onClick={copyShareUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button asChild type="button" variant="outline" size="icon">
                    <Link href={shareUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <p>{error}</p>
                  {error.toLowerCase().includes("pro") ? (
                    <Button asChild size="sm" variant="outline" className="mt-2">
                      <Link href="/pricing">Upgrade sharing</Link>
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-sm font-medium">Active links</p>
                {links.filter((link) => !link.revoked_at && new Date(link.expires_at) > new Date()).length === 0 ? (
                  <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    No active share links.
                  </p>
                ) : (
                  links
                    .filter((link) => !link.revoked_at && new Date(link.expires_at) > new Date())
                    .map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                      >
                        <div className="min-w-0 text-sm">
                          <p className="truncate">Expires {formatDate(link.expires_at)}</p>
                          <p className="text-xs text-muted-foreground">
                            {link.download_count} access{link.download_count === 1 ? "" : "es"} · last {formatDate(link.last_accessed_at)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => void revokeLink(link)}
                          aria-label="Revoke share link"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
