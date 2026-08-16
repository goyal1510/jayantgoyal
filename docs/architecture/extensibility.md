# Long-term extensibility

This repository is designed to support more clients and business capabilities
without becoming multiple repositories or prebuilding hypothetical systems.

## New client platforms

Add a client only when a product has a real implementation:

```text
apps/<product>/web      # current web client
apps/<product>/ios      # only when an iOS client exists
apps/<product>/android  # only when an Android client exists
```

Keep product contracts beside the product. Extract framework-neutral packages
only after two clients genuinely share a stable contract. Web-specific
packages stay under `packages/web`; they do not need to become falsely
universal.

## Advertising, sales, purchases, and subscriptions

Studio currently links to an external e-commerce experiment, but this monorepo
has no owned commerce client, contract, provider adapter, or current schema.
The structure can support a real product capability later without a repository
split:

- Product-specific offers, checkout entry points, and merchandising stay in
  the owning product client.
- Stable pricing, entitlement, order, or subscription contracts can become a
  product-owned contract once they exist.
- Payment, CRM, analytics, or advertising-provider adapters belong under
  `packages/integrations/<provider>` only when more than one product consumes
  them.
- Administrative operations belong in Admin; account entitlements and security
  belong with Auth/account data; public marketing presentation remains owned by
  the relevant product.
- Database tables receive explicit schema ownership and RLS before use.

Possible capabilities fit into the current ownership model as follows. These
are extension rules, not implemented modules:

| Capability                    | Likely product ownership                                       |
| ----------------------------- | -------------------------------------------------------------- |
| Portfolio sponsorship or ads  | Portfolio presentation; shared provider adapter only if reused |
| Studio paid feature           | Studio offer/use flow; Auth account identity and entitlements  |
| Subscription lifecycle        | Owning product contract plus account-linked entitlement data   |
| Checkout and payment provider | Owning product entry; server-only provider integration         |
| Lead capture and sales CRM    | Source product capture; Admin operations; provider adapter     |
| Catalog pricing               | Product-owned domain contract, never hardcoded across clients  |
| Refund/support operation      | Admin workflow authorized against the owning product domain    |
| Business analytics            | Product-defined events with privacy and retention boundaries   |

A capability becomes a separate product under `apps/<product>/<platform>` only
when it has an independent audience, lifecycle, authorization model, and
deployable experience. It does not need a separate repository. Product-owned
contracts, grouped shared packages, Supabase schemas, root tooling, and central
documentation all continue to live in this monorepo.

Before implementing a revenue capability, define:

1. Product owner and user journey.
2. Offer, price, order, subscription, and entitlement vocabulary actually
   needed by that journey.
3. Authentication, authorization, RLS, refund, and administrative boundaries.
4. Provider credential ownership, webhook verification, idempotency, failure
   recovery, and audit needs.
5. Privacy, analytics, tax, regional, and retention requirements relevant at
   that time.
6. Tests, operational signals, and a safe provider-degradation path.

Do not create empty `commerce`, `sales`, `ads`, `billing`, or `subscriptions`
directories as a promise of future work. The extensibility contract is the
ownership model and workspace layout, not speculative code.
