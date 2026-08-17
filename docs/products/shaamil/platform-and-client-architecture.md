# Shaamil platform and client architecture

This page records the current platform recommendation and the evidence needed
before any Shaamil client is approved. It does not describe an implemented
client. Framework releases, platform policies, signing requirements, and store
rules must be rechecked against official sources at the start of each
implementation milestone.

## Decision summary

| Area                  | Current direction                                                                            | State                                               | Confidence                                 |
| --------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------ |
| Initial form factor   | Native mobile application; no initial web client                                             | Approved product constraint                         | High                                       |
| Mobile technology     | React Native with Expo development builds                                                    | Recommended pending proof                           | Medium                                     |
| Mobile rollout        | Android-first iteration, physical iOS parity before exit                                     | Recommended; hardware may reverse order             | Medium                                     |
| Windows technology    | WinUI 3 with C#/.NET                                                                         | Recommended only after desktop demand               | Medium-high for native fit, low for timing |
| macOS technology      | SwiftUI with Swift                                                                           | Recommended only after desktop demand               | Medium-high for native fit, low for timing |
| Mobile local database | SQLite; evaluate SQLCipher in the technology proof                                           | Recommended pending performance and lifecycle proof | Medium                                     |
| Native secret storage | Keychain/Keystore through a reviewed secure-storage adapter                                  | Recommended                                         | High                                       |
| Navigation            | Native stacks/tabs with durable link vocabulary; Expo Router is the leading mobile candidate | Recommended pending accessibility/link proof        | Medium                                     |
| Contract sharing      | Product-local TypeScript first; language-neutral schemas only when a second client exists    | Approved ownership rule                             | High                                       |
| Release environments  | Local and production backend targets; local/internal/beta/RC/production app channels         | Recommended; no permanent staging backend           | High                                       |

The recommendation optimizes native UX, accessibility, offline reliability,
security, and long-term ownership. It does not optimize for one language across
every client or maximum immediate code reuse.

## Evaluation method

Scores are directional architecture evidence, not a permanent vendor ranking.
Each option is scored from 1 (poor fit) to 5 (strong fit), multiplied by the
criterion weight, and normalized to 100. A proof can change a score. Official
support does not guarantee that every required third-party library, background
mode, accessibility behavior, or store workflow is production-ready.

### Mobile weights

| Criterion                       | Weight | What is evaluated                                                                |
| ------------------------------- | -----: | -------------------------------------------------------------------------------- |
| Native UX and accessibility     |     20 | Platform conventions, screen readers, text scaling, focus, gestures, performance |
| Mobile platform integration     |     20 | Push, deep links, secure storage, background work, files, media, signing         |
| Realtime and offline behavior   |     15 | WebSocket lifecycle, SQLite integration, outbox/reconciliation, app suspension   |
| Performance and security        |     10 | Startup, memory, rendering, native isolation, dependency exposure                |
| Testing and observability       |     10 | Unit/integration/device/E2E tooling, crash and performance diagnosis             |
| Maintenance and dependency risk |     10 | Upgrade surface, ecosystem stability, native escape hatches, staffing burden     |
| Monorepo and contract fit       |     10 | pnpm/Turbo compatibility, TypeScript reuse, generated contract options           |
| Cost and developer experience   |      5 | Build iteration, tooling, platform setup, duplicated effort                      |

### Mobile matrix

| Option                          | Native UX | Integration | Realtime/offline | Perf/security | Test/ops | Maintenance | Monorepo | Cost/DX | Weighted |
| ------------------------------- | --------: | ----------: | ---------------: | ------------: | -------: | ----------: | -------: | ------: | -------: |
| React Native + Expo             |       4.0 |         4.5 |              4.0 |           4.0 |      4.0 |         4.0 |      5.0 |     5.0 |   **85** |
| Native SwiftUI + Kotlin/Compose |       5.0 |         5.0 |              5.0 |           5.0 |      5.0 |         2.0 |      2.0 |     1.0 |   **84** |
| Flutter                         |       4.0 |         4.0 |              4.0 |           4.0 |      4.0 |         4.0 |      3.0 |     4.0 |   **78** |
| Kotlin/Compose Multiplatform    |       4.0 |         4.0 |              4.0 |           4.0 |      3.5 |         3.5 |      2.0 |     3.0 |   **73** |
| Tauri mobile                    |       2.5 |         3.0 |              3.0 |           3.5 |      3.0 |         3.0 |      4.0 |     4.0 |   **62** |

### Mobile recommendation

React Native with Expo leads narrowly because it preserves native rendering,
has strong iOS/Android integration, fits the existing TypeScript/pnpm monorepo,
and reduces initial duplicated client work. React Native itself recommends a
framework for most new apps while retaining escape hatches for unusual native
constraints. Expo development builds permit custom native libraries and native
configuration rather than limiting the product to Expo Go. See [React Native
environment guidance](https://reactnative.dev/docs/environment-setup) and
[Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/).

This is not approval to create the client. The score depends on passing the
physical-device proof for secure storage, encrypted SQLite, WebSocket
reconnection, background/resume behavior, deep links, notification routing,
large timelines, assistive technology, and native build reproducibility.

**Long-term consequence:** mobile business/application logic can remain
TypeScript, but native modules and platform code must be accepted when platform
quality requires them. Expo is build and module tooling, not a reason to make
the UX look identical across iOS and Android.

### Mobile alternatives

#### Fully native SwiftUI and Kotlin/Compose

This is the strongest native-quality option and the fallback if the proof finds
unacceptable accessibility, background, database, memory, or integration
limits. SwiftUI is Apple's declarative UI framework across Apple platforms, and
Jetpack Compose provides Android accessibility semantics and testing hooks.
See [SwiftUI](https://developer.apple.com/swiftui/) and [Compose
accessibility](https://developer.android.com/develop/ui/compose/accessibility).

The trade-off is two UI implementations, two build systems, less direct pnpm
integration, duplicated feature delivery, and a larger long-term staffing and
test burden. Language-neutral contracts would be mandatory earlier. This option
should win if measured native quality outweighs the cost rather than because
native is assumed to be automatically superior.

#### Flutter

Flutter officially supports Android, iOS, Windows, and macOS and offers a
cohesive rendering/runtime model. See [Flutter supported deployment
platforms](https://docs.flutter.dev/reference/supported-platforms). It is a
credible mobile alternative with strong tooling and local persistence options.

It scores lower for this repository because Dart introduces a separate package
and build ecosystem, existing TypeScript contracts are not directly consumed,
and the rendering model requires extra proof for platform-specific interaction
and accessibility expectations. Flutter becomes the preferred fallback only if
its proof materially outperforms React Native for reliability and maintenance.

#### Kotlin and Compose Multiplatform

Compose Multiplatform currently describes Android, iOS, and desktop UI targets
as stable. See [platform stability](https://kotlinlang.org/docs/multiplatform/supported-platforms.html).
It provides a serious shared-logic/UI path and strong Android alignment.

It scores lower because it creates a second ecosystem in this monorepo, iOS
interoperability and Apple-specific UX still require native judgment, and it
does not remove the need for separate Windows/macOS product decisions. It is a
valid future re-evaluation candidate, not a rejected technology.

#### Tauri mobile

Tauri 2 supports mobile project prerequisites and provides a small Rust/native
shell around a webview UI. See [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).
It is useful for secure native commands and small distribution size.

It is not recommended for the mobile communication client because the core UI
would remain webview-rendered, making native interaction, accessibility,
keyboard/input behavior, high-volume timelines, and background integration
larger proof risks. It must not be used to disguise a website as the requested
native application.

#### Electron

Electron is not a mobile option. It embeds Chromium and Node.js for Windows,
macOS, and Linux desktop applications. See [Electron's platform
model](https://www.electronjs.org/docs/latest/). It is evaluated for desktop
only.

## Mobile rollout order

The recommended order is:

1. **Android development proof.** Faster local iteration and device variety
   expose background, connectivity, storage, and performance issues early.
2. **iOS parity within the same proof.** Validate Keychain, protected data,
   system-browser Auth, app lifecycle, VoiceOver, notification routing, and
   signing on physical hardware.
3. **Internal two-person reliability slice.** No store distribution; prove one
   private room with real network interruption and revocation cases.
4. **Closed mobile beta.** Only after safety, retention, support, crash,
   observability, and release gates are approved.
5. **Production mobile release.** Platform order follows measured beta quality
   and audience hardware rather than an assumption of simultaneous release.
6. **macOS proof, then Windows proof.** Begin only after mobile value and
   desktop-specific demand are demonstrated; reverse based on audience demand.

Android-first is a recommendation, not a product commitment. If only an iPhone
is available, reverse steps one and two without relaxing the two-platform exit
gate.

## Required technology proof

The technology proof must produce evidence, not a reusable shell with empty
features.

### Device and build evidence

- Reproducible local development builds for one supported physical Android
  device and one physical iPhone.
- Pinned package and native dependency versions with a committed lockfile.
- Clean rebuild from documented prerequisites; no machine-only unrecorded
  steps.
- Debug and release-like performance profiles for startup, timeline scrolling,
  memory, battery, database migration, and reconnect behavior.
- A native-module inventory with ownership, maintenance status, license, and
  new-architecture compatibility.

### Authentication and link evidence

- Native Supabase Auth session using the same `auth.users` identity boundary.
- System-browser OAuth/PKCE if that sign-in method is approved; never embedded
  credentials in a webview.
- Valid, invalid, expired, replayed, and malicious callback handling.
- No access or refresh tokens in URLs, analytics, crash reports, or logs.
- Secure refresh, explicit local/global logout behavior, revoked membership,
  and expired-session recovery.

Supabase documents mobile redirect URIs and native callback handling in [Native
mobile deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking).
Universal/app links are preferred for production UX, while an environment-
qualified custom scheme is acceptable for development proof after collision
and callback validation.

### Persistence and sync evidence

- Persistent SQLite schema migrations, transactional outbox behavior, bounded
  cache eviction, and deterministic rebuild.
- Evaluate SQLCipher rather than assuming application sandboxing is sufficient
  for private communication content. Expo SQLite documents its optional
  `useSQLCipher` build configuration in [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/).
- A database encryption key held in platform secure storage, never in the
  SQLite database, source, logs, or ordinary preferences.
- Purge on logout, user deletion, membership revocation, and unrecoverable key
  loss.
- Duplicate/reordered Realtime delivery, process death, airplane mode,
  background/foreground, clock changes, and multi-device reconciliation.

### Native UX and accessibility evidence

- VoiceOver and TalkBack traversal, state announcements, dynamic text,
  contrast, reduced motion, keyboard appearance, and focus restoration.
- Stable timeline position during pagination and incoming events.
- Composer behavior with Unicode, emoji, bidirectional text, long input,
  rotation, small screens, and accessibility keyboards.
- Platform-appropriate navigation, context actions, back behavior, selection,
  sharing, and error presentation.

### Proof rejection criteria

Reject or change the mobile recommendation if either platform shows a
non-mitigable problem in secure token/key storage, encrypted local persistence,
Auth callback safety, Realtime recovery, accessibility, sustained timeline
performance, native build reproducibility, background/resume behavior, or
dependency maintenance. Do not waive a failed criterion solely to preserve
TypeScript reuse.

## Client architecture

The future mobile boundary should follow this dependency direction:

```text
platform UI and navigation
        ↓
product application commands and queries
        ↓
domain rules and state machines
        ↓
local SQLite repositories and sync coordinator
        ↓
Supabase/Auth/Realtime/Storage adapters and trusted command transport
        ↓
operating-system secure storage, links, notifications, files, and lifecycle
```

Rules:

- Presentation reads state and dispatches typed intents; it does not issue
  arbitrary Supabase queries or contain permission strings.
- Application services coordinate domain rules, authorization outcomes,
  optimistic state, retries, and navigation effects.
- Domain modules remain framework-light and testable without rendering.
- SQLite is the client read model and durable outbox, not a second authority.
- Sync adapters handle cursors, idempotency, retries, duplicate/reordered
  events, and revoked access.
- Provider SDKs remain at the outer edge and are wrapped only where a real
  provider boundary exists.
- Platform-specific implementations are preferred over conditional sprawl when
  behavior genuinely differs.

Expo Router is the leading navigation candidate because it provides typed
file-based routes and automatic deep-link mapping, but it must pass focus,
back-stack, malicious-link, and offline-start tests. See [Expo Router
navigation](https://docs.expo.dev/router/basics/navigation/). Its web features
do not authorize a Shaamil web client.

## Desktop evaluation

Desktop is a separate product/client decision. Mobile technology does not
choose the desktop technology by default.

### Desktop weights

| Criterion                                                        | Weight |
| ---------------------------------------------------------------- | -----: |
| Native desktop UX and accessibility                              |     25 |
| OS integration, windows, files, keyboard, notifications, updates |     20 |
| Security and performance                                         |     15 |
| Local persistence and sync                                       |     10 |
| Testing, packaging, signing, and distribution                    |     10 |
| Maintenance and dependency risk                                  |     10 |
| Contract sharing                                                 |      5 |
| Cost and developer experience                                    |      5 |

### Desktop matrix

| Option                        | Native UX | Integration | Security/perf | Persistence | Test/distribution | Maintenance | Contracts | Cost/DX | Weighted |
| ----------------------------- | --------: | ----------: | ------------: | ----------: | ----------------: | ----------: | --------: | ------: | -------: |
| WinUI 3 for Windows           |       5.0 |         5.0 |           5.0 |         4.5 |               4.5 |         3.0 |       2.0 |     2.5 |   **89** |
| SwiftUI for macOS             |       5.0 |         5.0 |           5.0 |         4.5 |               4.5 |         3.0 |       2.0 |     2.5 |   **89** |
| Tauri 2                       |       3.5 |         4.0 |           4.0 |         4.0 |               4.0 |         4.0 |       4.0 |     4.0 |   **78** |
| Flutter desktop               |       4.0 |         3.5 |           4.0 |         4.0 |               4.0 |         4.0 |       3.0 |     4.0 |   **77** |
| Compose Multiplatform desktop |       4.0 |         3.5 |           4.0 |         4.0 |               4.0 |         3.5 |       2.0 |     3.0 |   **74** |
| Electron                      |       3.0 |         4.0 |           2.5 |         4.0 |               4.5 |         3.5 |       5.0 |     4.0 |   **72** |
| React Native Windows/macOS    |       3.5 |         3.5 |           3.5 |         4.0 |               3.5 |         3.0 |       5.0 |     3.0 |   **71** |

### Windows recommendation

WinUI 3 with C#/.NET is the current recommendation for a later Windows client.
Microsoft describes WinUI 3 and Windows App SDK as the recommended path for new
native Windows desktop applications, with modern controls, windowing,
packaging, and Store support. See [Windows app development](https://learn.microsoft.com/windows/apps/)
and [WinUI 3](https://learn.microsoft.com/windows/apps/winui/winui3/).

The cost is a separate language/build ecosystem and reduced direct code reuse.
The benefit is first-class keyboard, pointer, accessibility, multiple-window,
notification, packaging, update, and Windows design integration. Confidence is
medium-high for technology fit but low for whether a Windows client will be
needed.

### macOS recommendation

SwiftUI with Swift is the current recommendation for a later macOS client. It
provides direct Apple platform integration and a clear path to native windows,
menus, keyboard commands, notifications, Keychain, accessibility, signing, and
distribution. See [SwiftUI](https://developer.apple.com/swiftui/).

The cost is a separate implementation and build pipeline. Shared source code
is not the goal; shared product behavior, protocol contracts, and conformance
tests are.

### Rejected desktop defaults

- **Electron** is mature and cross-platform, but bundling Chromium and Node.js
  increases update/security responsibility and resource cost. Electron's own
  security guide requires strict isolation, sandboxing, navigation control,
  IPC validation, and rapid framework updates. See [Electron security](https://www.electronjs.org/docs/latest/tutorial/security).
- **Tauri** is a credible lightweight alternative if native clients are not
  economically sustainable, but the webview UI and Rust bridge require proof
  for accessibility, cross-platform rendering variance, notifications,
  multi-window behavior, and updater safety.
- **React Native Windows** is actively supported, but its new architecture has
  documented parity and library gaps; it also requires Windows development
  tooling. See [React Native Windows architecture](https://microsoft.github.io/react-native-windows/docs/new-architecture/).
- **React Native macOS** is an out-of-tree Microsoft-maintained platform. See
  [React Native macOS](https://microsoft.github.io/react-native-macos/docs/intro).
  Mobile source reuse does not outweigh native macOS UX and maintenance risk by
  default.
- **Flutter or Compose Multiplatform desktop** remain credible fallbacks if
  staffing or measured delivery economics dominate, but neither should be
  selected before desktop demand and platform-specific proof exist.

## Repository integration

No path below exists today. Create only the client that enters an approved
implementation milestone.

| Future artifact                    | Recommended path                                            | Ownership                                                                         |
| ---------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| iOS/Android client                 | `apps/shaamil/mobile`                                       | Shaamil mobile UX, application, local data, sync, native adapters, client tests   |
| TypeScript workspace name          | `@jayantgoyal/shaamil-mobile`                               | Only if the mobile client exists                                                  |
| Language-neutral product contracts | `apps/shaamil/contracts` / `@jayantgoyal/shaamil-contracts` | Only after a second real client or trusted service consumes stable contracts      |
| Windows client                     | `apps/shaamil/windows`                                      | Future WinUI solution; not a pnpm workspace unless it genuinely owns a JS package |
| macOS client                       | `apps/shaamil/macos`                                        | Future Xcode/Swift package boundary                                               |
| Shaamil database snapshot          | `supabase/schemas/shaamil.sql`                              | Created with the first approved Shaamil backend migration                         |
| Database migrations                | `supabase/migrations`                                       | Forward-only reviewed migrations; no client-local SQL history                     |

The existing `apps/*/*` workspace pattern already supports a future mobile
package. Implementation must extend architecture, dead-code, source-health,
test discovery, and build orchestration checks to recognize the actual client;
it must not create a generic `packages/mobile` or place native code under
`packages/web`.

Keep product-local TypeScript types inside the mobile client until another real
consumer exists. If Windows/macOS create that need, introduce a product
contracts boundary containing versioned JSON Schema or another approved
language-neutral source plus conformance fixtures. Generate TypeScript, Swift,
and C# models from the same reviewed schema where generation adds value; never
pretend a TypeScript package can be imported directly by native ecosystems.

## Environments and releases

Backend environments and app release channels are different concerns.

### Backend targets

- **Local:** disposable Supabase/PostgreSQL, deterministic test identities, and
  provider fakes for migrations, RLS, sync, and destructive testing.
- **Production:** the existing canonical Supabase project. No second hosted
  project or permanent staging environment is approved.

Internal, beta, and release-candidate builds may point to production only after
backward compatibility, test-community isolation, rate limits, log redaction,
and data-retention behavior are approved. They do not create hidden backend
environments.

### App channels

| Channel           | Purpose                                    | Distribution                                   | Data posture                                              |
| ----------------- | ------------------------------------------ | ---------------------------------------------- | --------------------------------------------------------- |
| Local             | Developer iteration and simulators/devices | Local toolchains                               | Local backend by default                                  |
| Internal          | Named operator/test devices                | Development/internal distribution              | Test community only                                       |
| Beta              | Closed invited testers                     | TestFlight/Play testing or approved equivalent | Production-compatible schema; disclosed test retention    |
| Release candidate | Exact production candidate                 | Restricted distribution                        | No debug credentials or diagnostic bypasses               |
| Production        | Approved public/private release            | Signed stores or approved direct channel       | Production policies, support, incident response, rollback |

Application identifiers should be environment-qualified for local/internal
builds and stable for production. Candidate identifiers in the Shaamil README
remain open. Signing keys, certificates, provisioning profiles, store records,
push credentials, and update keys are provider secrets owned outside source;
none should be configured during documentation or early architecture work.

### Configuration and secrets

- Native clients receive the Supabase project URL and a publishable client key,
  never a secret/service-role key. Supabase now recommends publishable and
  secret keys in place of legacy `anon` and `service_role` keys; migration must
  be coordinated with existing clients rather than done as a Shaamil side
  effect. See [Supabase API key migration](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).
- Non-secret public configuration is environment-validated at build/startup.
- Secret, signing, push, crash, and provider credentials remain in approved
  build/provider secret stores.
- Local `.env` files stay ignored; a future `.env.example` documents only the
  client contract.
- A build must identify client version, build number, release channel, and
  compatible backend contract version without logging private user data.

### Compatibility, upgrades, and rollback

- Database changes are expand/migrate/contract, not a same-minute destructive
  rename coupled to store adoption.
- A mobile release declares the minimum compatible backend contract and local
  database version.
- Local SQLite migrations are forward-tested across every supported app
  upgrade path; failure must preserve recoverability or purge only after clear
  user disclosure when safe.
- Server commands remain backward compatible for the supported client window.
- Feature flags may disable unsafe server behavior but cannot replace RLS or
  authorization.
- Rollback prefers disabling a feature or releasing a previous compatible
  binary. Database rollback uses a reviewed forward fix; applied migrations are
  not edited or blindly reversed.

## Evidence review

Official sources reviewed on 2026-08-17 include:

- [React Native environment setup](https://reactnative.dev/docs/environment-setup)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Flutter supported platforms](https://docs.flutter.dev/reference/supported-platforms)
- [Kotlin Multiplatform platform stability](https://kotlinlang.org/docs/multiplatform/supported-platforms.html)
- [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)
- [Electron introduction](https://www.electronjs.org/docs/latest/)
- [Electron security](https://www.electronjs.org/docs/latest/tutorial/security)
- [React Native Windows](https://microsoft.github.io/react-native-windows/docs/getting-started/)
- [React Native macOS](https://microsoft.github.io/react-native-macos/docs/intro)
- [SwiftUI](https://developer.apple.com/swiftui/)
- [Compose accessibility](https://developer.android.com/develop/ui/compose/accessibility)
- [Windows App SDK and WinUI](https://learn.microsoft.com/windows/apps/)

Re-evaluate current stable versions, minimum OS versions, native-library
compatibility, build-service pricing, store policy, and signing requirements
before implementation. This page records a decision method, not a promise that
today's release numbers will remain valid.
