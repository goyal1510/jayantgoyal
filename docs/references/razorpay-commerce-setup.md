# Razorpay Commerce Setup

Date: 2026-06-08
Scope: Commercial product foundation for `jayantgoyal`

## Provider Contract

Razorpay is the active payment provider because Stripe account activation is not usable for this India-based setup.

Required provider marker:

```env
COMMERCE_PAYMENT_PROVIDER=razorpay
```

Stripe code can remain as an optional fallback, but new implementation and validation should not depend on Stripe credentials.

## Environment Variables

Main app, `apps/jayantgoyal`:

```env
COMMERCE_PAYMENT_PROVIDER=razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

Admin app, `apps/admin`:

```env
COMMERCE_PAYMENT_PROVIDER=razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

Rules:

- Never commit `.env.local` values.
- `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are server-only.
- `RAZORPAY_KEY_ID` is public by design for Checkout. Keep `NEXT_PUBLIC_RAZORPAY_KEY_ID` explicit for client usage.
- Add the same env names to Vercel development, preview, and production. Values may differ by environment, but the variable set should not.

## Checkout Flow

1. Authenticated user clicks a paid CTA.
2. Server creates a pending `commerce_orders` row.
3. Server creates a Razorpay Order and stores `provider_order_id`.
4. Client opens Razorpay Standard Checkout with the returned order id and key id.
5. Client sends `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to `/api/commerce/checkout/verify`.
6. Server verifies `order_id + "|" + payment_id` with HMAC SHA256 using `RAZORPAY_KEY_SECRET`.
7. Only after verification does the server mark the order paid and grant entitlement access.

## Webhook Flow

Configure Razorpay payments webhooks to:

```text
https://www.jayantgoyal.com/api/commerce/webhooks/razorpay
```

Minimum event coverage:

- `payment.captured`
- `payment.failed`
- `order.paid`

Webhook rules:

- Verify the raw request body with `X-Razorpay-Signature` and `RAZORPAY_WEBHOOK_SECRET`.
- Use `x-razorpay-event-id` for idempotency.
- Do not log raw webhook bodies, customer contact details, keys, or signatures.
- Webhook processing may arrive out of order, so paid access must be idempotent by app order id and feature key.

## Implementation Notes

- Checkout verification can grant access after server-side Razorpay signature verification.
- Webhooks provide an additional idempotent source of truth for captured payments and failed payments.
- Entitlement reads must default to deny if payment state is missing or ambiguous.
- Use Supabase as the app mirror for products, prices, orders, entitlements, webhook events, and delivery state.
