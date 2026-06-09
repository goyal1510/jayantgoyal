"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LifeBuoy, Loader2, MessageCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@repo/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog"
import { Textarea } from "@repo/ui/textarea"

interface PurchaseSupportButtonProps {
  orderId: string
  productName: string
  orderStatus?: string
  deliverySummary?: string
}

export function PurchaseSupportButton({
  orderId,
  productName,
  orderStatus = "paid",
  deliverySummary = "Delivery state is attached automatically.",
}: PurchaseSupportButtonProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  async function openSupportThread() {
    try {
      setSubmitting(true)
      const response = await fetch(`/api/account/purchases/${orderId}/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to open support")
      }

      const conversationId =
        typeof payload.conversation?.id === "string"
          ? payload.conversation.id
          : null

      if (!conversationId) {
        throw new Error("Support conversation was not returned")
      }

      setOpen(false)
      setMessage("")
      router.push(`/messenger?conversation=${conversationId}`)
    } catch (error) {
      console.error("Purchase support failed:", error)
      toast.error(error instanceof Error ? error.message : "Unable to open support")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LifeBuoy className="size-4" />
          Get support
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Support for {productName}</DialogTitle>
          <DialogDescription>
            Start a purchase-linked support thread. Replies arrive in Messenger with this order,
            payment, and delivery context already attached.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <div className="font-medium">Order context</div>
          <div className="mt-1 text-muted-foreground">
            Order {orderId} · {orderStatus}
          </div>
          <div className="mt-1 text-muted-foreground">{deliverySummary}</div>
        </div>
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell me what you need help with."
          className="min-h-32 resize-none"
          maxLength={2000}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={openSupportThread} disabled={submitting}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageCircle className="size-4" />
            )}
            Open thread
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
