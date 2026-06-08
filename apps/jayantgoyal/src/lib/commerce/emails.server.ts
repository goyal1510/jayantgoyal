import "server-only"

import { Resend } from "resend"

import { formatCommercePrice } from "@/lib/commerce/format"
import { getPaidPurchaseWithDetailsByOrderId } from "@/lib/commerce/database.server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

type CommerceEmailType =
  | "purchase_receipt"
  | "product_access"
  | "support_opened"
  | "support_reply"

type CommerceEmailStatus = "pending" | "sending" | "sent" | "failed" | "skipped"

type CommerceEmailRender = {
  subject: string
  preview: string
  html: string
  text: string
}

type CommerceEmailInput = {
  eventKey: string
  emailType: CommerceEmailType
  userId?: string | null
  orderId?: string | null
  conversationId?: string | null
  recipientEmail: string
  metadata?: Record<string, string | number | boolean | null>
  render: CommerceEmailRender
}

type InsertError = {
  code?: string
  message?: string
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jayantgoyal.com"

function getCommerceClient() {
  return createSupabaseAdminClient().schema("jg_app")
}

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY)
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || "Jayant Tools <onboarding@resend.dev>"
}

function deliveryMode() {
  return process.env.COMMERCE_EMAIL_DELIVERY_MODE === "send" ? "send" : "record_only"
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function safeMetadata(metadata: CommerceEmailInput["metadata"]) {
  const result: Record<string, string | number | boolean | null> = {}
  for (const [key, value] of Object.entries(metadata ?? {})) {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      result[key] = typeof value === "string" ? value.slice(0, 160) : value
    }
  }
  return result
}

async function getUserEmail(userId: string) {
  const { data, error } = await createSupabaseAdminClient().auth.admin.getUserById(userId)
  if (error) throw new Error("Unable to load commerce email recipient.")
  return data.user?.email ?? null
}

async function reserveEmailEvent(input: CommerceEmailInput) {
  const { data, error } = await getCommerceClient()
    .from("commerce_email_events")
    .insert({
      event_key: input.eventKey,
      email_type: input.emailType,
      user_id: input.userId ?? null,
      order_id: input.orderId ?? null,
      conversation_id: input.conversationId ?? null,
      status: "pending",
      metadata: safeMetadata(input.metadata),
    })
    .select("id")
    .single()

  if ((error as InsertError | null)?.code === "23505") return null
  if (error) throw new Error(error.message)
  return data?.id as string | undefined
}

async function updateEmailEvent({
  id,
  status,
  resendMessageId = null,
  lastError = null,
}: {
  id: string
  status: CommerceEmailStatus
  resendMessageId?: string | null
  lastError?: string | null
}) {
  const nextRetryAt =
    status === "failed" ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null
  const { error } = await getCommerceClient()
    .from("commerce_email_events")
    .update({
      status,
      attempt_count: status === "pending" ? 0 : 1,
      resend_message_id: resendMessageId,
      last_error: lastError ? lastError.slice(0, 500) : null,
      next_retry_at: nextRetryAt,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    })
    .eq("id", id)

  if (error) throw new Error(error.message)
}

async function sendCommerceEmailOnce(input: CommerceEmailInput) {
  const eventId = await reserveEmailEvent(input)
  if (!eventId) return

  if (deliveryMode() !== "send") {
    await updateEmailEvent({
      id: eventId,
      status: "skipped",
      lastError: "Commerce email delivery mode is record_only.",
    })
    return
  }

  if (!process.env.RESEND_API_KEY) {
    await updateEmailEvent({
      id: eventId,
      status: "failed",
      lastError: "Commerce email service is not configured.",
    })
    return
  }

  try {
    await updateEmailEvent({ id: eventId, status: "sending" })
    const { data, error } = await getResendClient().emails.send({
      from: getFromEmail(),
      to: [input.recipientEmail],
      subject: input.render.subject,
      html: input.render.html,
      text: input.render.text,
    })

    if (error) throw new Error(error.message)

    await updateEmailEvent({
      id: eventId,
      status: "sent",
      resendMessageId: data?.id ?? null,
    })
  } catch (error) {
    await updateEmailEvent({
      id: eventId,
      status: "failed",
      lastError: error instanceof Error ? error.message : "Commerce email failed.",
    })
    console.error("Commerce email send failed")
  }
}

function renderShell({ title, preview, body }: { title: string; preview: string; body: string }) {
  const safeTitle = escapeHtml(title)
  const safePreview = escapeHtml(preview)

  return `
    <div style="display:none;max-height:0;overflow:hidden;">${safePreview}</div>
    <main style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#18181b;">
      <h1 style="font-size:24px;line-height:32px;margin:0 0 12px;">${safeTitle}</h1>
      ${body}
      <p style="margin-top:24px;font-size:12px;line-height:18px;color:#71717a;">
        Jayant Tools sends commerce email only for completed purchases or support events.
      </p>
    </main>
  `
}

function purchaseReceiptEmail({
  productName,
  amountLabel,
  orderId,
}: {
  productName: string
  amountLabel: string
  orderId: string
}): CommerceEmailRender {
  const title = "Your Jayant Tools receipt"
  const preview = `Receipt for ${productName}.`
  const accountUrl = `${SITE_URL}/account/purchases`
  const safeProduct = escapeHtml(productName)
  const safeAmount = escapeHtml(amountLabel)

  return {
    subject: title,
    preview,
    html: renderShell({
      title,
      preview,
      body: `
        <p style="font-size:15px;line-height:24px;">Payment is complete for <strong>${safeProduct}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
          <tr><td style="padding:8px;border:1px solid #e4e4e7;">Amount</td><td style="padding:8px;border:1px solid #e4e4e7;">${safeAmount}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e4e4e7;">Order</td><td style="padding:8px;border:1px solid #e4e4e7;">${escapeHtml(orderId)}</td></tr>
        </table>
        <p style="margin-top:16px;"><a href="${accountUrl}" style="color:#2563eb;">View purchase history</a></p>
      `,
    }),
    text: `Payment is complete for ${productName}.\nAmount: ${amountLabel}\nOrder: ${orderId}\nPurchase history: ${accountUrl}`,
  }
}

function productAccessEmail(productName: string): CommerceEmailRender {
  const title = "Your product access is ready"
  const preview = `${productName} is available in your Jayant Tools account.`
  const accountUrl = `${SITE_URL}/account/billing`

  return {
    subject: title,
    preview,
    html: renderShell({
      title,
      preview,
      body: `
        <p style="font-size:15px;line-height:24px;">Access for <strong>${escapeHtml(productName)}</strong> has been added to your account.</p>
        <p style="margin-top:16px;"><a href="${accountUrl}" style="color:#2563eb;">Open account billing</a></p>
      `,
    }),
    text: `Access for ${productName} has been added to your account.\nOpen account billing: ${accountUrl}`,
  }
}

function supportOpenedEmail({
  productName,
  orderId,
  conversationId,
}: {
  productName: string
  orderId: string
  conversationId: string
}): CommerceEmailRender {
  const title = "New purchase support request"
  const preview = `Support was opened for ${productName}.`
  const adminUrl = `${SITE_URL.replace("www.", "admin.")}/commerce/support`

  return {
    subject: title,
    preview,
    html: renderShell({
      title,
      preview,
      body: `
        <p style="font-size:15px;line-height:24px;">A buyer opened support for <strong>${escapeHtml(productName)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
          <tr><td style="padding:8px;border:1px solid #e4e4e7;">Order</td><td style="padding:8px;border:1px solid #e4e4e7;">${escapeHtml(orderId)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e4e4e7;">Conversation</td><td style="padding:8px;border:1px solid #e4e4e7;">${escapeHtml(conversationId)}</td></tr>
        </table>
        <p style="margin-top:16px;"><a href="${adminUrl}" style="color:#2563eb;">Open support inbox</a></p>
      `,
    }),
    text: `A buyer opened support for ${productName}.\nOrder: ${orderId}\nConversation: ${conversationId}\nSupport inbox: ${adminUrl}`,
  }
}

export function triggerPurchaseEmails(orderId: string) {
  void sendPurchaseEmails(orderId).catch(() => {
    console.error("Commerce purchase email trigger failed")
  })
}

async function sendPurchaseEmails(orderId: string) {
  const purchase = await getPaidPurchaseWithDetailsByOrderId(orderId)
  if (!purchase) return

  const recipientEmail = await getUserEmail(purchase.user_id)
  if (!recipientEmail) return

  const productName = purchase.product?.name ?? "Jayant Tools product"
  const amountLabel = formatCommercePrice(purchase.amount_total, purchase.currency)

  await Promise.all([
    sendCommerceEmailOnce({
      eventKey: `purchase_receipt:${purchase.id}`,
      emailType: "purchase_receipt",
      userId: purchase.user_id,
      orderId: purchase.id,
      recipientEmail,
      metadata: {
        productName,
        amountTotal: purchase.amount_total,
        currency: purchase.currency,
      },
      render: purchaseReceiptEmail({
        productName,
        amountLabel,
        orderId: purchase.id,
      }),
    }),
    sendCommerceEmailOnce({
      eventKey: `product_access:${purchase.id}`,
      emailType: "product_access",
      userId: purchase.user_id,
      orderId: purchase.id,
      recipientEmail,
      metadata: {
        productName,
      },
      render: productAccessEmail(productName),
    }),
  ])
}

export function triggerSupportOpenedEmail({
  conversationId,
  orderId,
  buyerUserId,
  productName,
}: {
  conversationId: string
  orderId: string
  buyerUserId: string
  productName: string
}) {
  const supportEmail = process.env.COMMERCE_SUPPORT_EMAIL || "goyal151002@gmail.com"
  void sendCommerceEmailOnce({
    eventKey: `support_opened:${conversationId}`,
    emailType: "support_opened",
    userId: buyerUserId,
    orderId,
    conversationId,
    recipientEmail: supportEmail,
    metadata: {
      productName,
    },
    render: supportOpenedEmail({
      productName,
      orderId,
      conversationId,
    }),
  }).catch(() => {
    console.error("Commerce support email trigger failed")
  })
}
