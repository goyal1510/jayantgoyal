# Client strategy

A client is an implemented delivery surface owned by a product. The repository
currently has one web client for each product and no other client platform.

```text
apps/<product>/<platform>
```

Add `apps/studio/ios`, for example, only when an iOS application is being
built. The existing `apps/studio/web` client remains where it is. Do not create
empty mobile, desktop, extension, CLI, commerce, or advertising clients.

## Client responsibilities

Every client owns its routes, UI composition, platform authorization policy,
environment example, runtime configuration, tests, and deployment behavior.
It consumes product or shared contracts without importing another client's
source.

Framework-neutral product behavior may be extracted beside the owning product
after two clients genuinely need it. Platform-specific code stays explicit;
native clients must not inherit browser or Next.js assumptions through a
falsely universal abstraction.

Shaamil has an accepted mobile-first direction but no implemented client. Its
future `apps/shaamil/mobile` path is created only when the physical-device
reliability proof begins. That client must own native auth, secure storage,
SQLite sync, accessibility, notifications, links, packaging, and release
behavior without importing `@jayantgoyal/web-auth` or `@jayantgoyal/web-ui`.

See [Web clients](web/README.md) for the current platform contract and
[Long-term extensibility](../architecture/extensibility.md) for future-client
and business-capability rules. See [Shaamil](../products/shaamil/README.md) for
the defined product and first-client boundary.
