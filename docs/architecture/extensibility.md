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

The current system has no commerce implementation. The structure can support
one later without a repository split:

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

Do not create empty `commerce`, `sales`, `ads`, `billing`, or `subscriptions`
directories as a promise of future work. The extensibility contract is the
ownership model and workspace layout, not speculative code.
