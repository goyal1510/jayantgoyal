# Orbit capability catalog

> **Status: proposed future product.** Orbit is not currently implemented, deployed, or provisioned. These requirements describe an approved documentation target, not current runtime behavior.

This page preserves the complete proposed P0, P1, and P2 functional scope. Priority labels are release gates rather than implementation claims.

## 6. Functional specification

Each requirement includes its behavior, authorization, edge cases, and acceptance target. Limits below are proposed application defaults, not Supabase plan limits. Maintain them in one typed, server-validated configuration contract.

### F01 — Entry, shared login, and account security [P0]

**Behavior:** Orbit shows product introduction and “Continue” entry. Protected routes use shared authentication helpers to send unauthenticated users to Auth with an exact validated return target. Already authenticated users do not see a second login form. Password, provider, profile, MFA, recovery, and account deletion links lead to Auth.

**Permissions:** active IAM profile and Orbit entitlement are required after authentication. A valid shared session alone does not grant Orbit access. Sensitive commands must independently validate identity and authorization.

**Edges:** expired session, revoked entitlement, suspended profile, recovery mode, MFA challenge, safe return failure, chunked cookies, multiple tabs refreshing, Preview and localhost. Preserve private/no-store headers and refreshed cookie chunks on redirects.

**Acceptance:** signing in through Auth returns to an allowed Orbit card URL; a crafted external return URL is rejected; revoking Orbit entitlement blocks Orbit without removing legitimate Studio access. [R4, R5, S1]

### F02 — Orbit entitlement and access states [P0]

**Behavior:** distinguish signed out, signed in without product access, invited, active, suspended, and revoked. A no-access screen explains that Orbit is invite-only and provides a non-enumerating support/access request path. Do not create a membership as a side effect of merely visiting `/`.

**Permissions:** only approved operators manage product access; invitation acceptance may grant only the minimal participant role through an IAM-reviewed command.

**Acceptance:** an arbitrary authenticated user cannot create a workspace by bypassing the page. A removed participant cannot restore their own access with an old invite.

### F03 — Workspace onboarding and switching [P0]

**Behavior:** a creator supplies a 2–80 character name and an optional description up to 500 characters. Creation atomically establishes the workspace and creator's owning membership. Workspaces appear in a switcher only when the user is an active member. Store the last selected workspace as a preference, not as authority. Initial timezone defaults to `Asia/Kolkata` for Jayant's own workspace and is configurable per workspace.

**Permissions:** `orbit.workspace.create` is required to create; participating requires active membership. Each workspace has exactly one effective Owner.

**Acceptance:** replaying the same idempotent creation request creates one workspace; editing a workspace ID in the route cannot expose another workspace.

### F04 — Invitations, acceptance, and cancellation [P0]

**Behavior:** Owner/Admin selects email, role, and explicit board scope for a Guest. Send a one-use invitation valid for seven days by default. Store only a cryptographic hash of the secret; raw secrets are delivered once and excluded from logs/analytics. Acceptance requires a signed-in account with the matching verified email. An invitation preview shows only minimal context; do not enumerate existing accounts.

**Permissions:** Admin may invite Member/Viewer/Guest; Owner alone may invite/promote Admin. Guest invitations require at least one explicit non-Manager board assignment. Acceptance and entitlement provisioning are transactional and recheck inviter authority and workspace state.

**Edges:** resend rotates the secret; expired/revoked links cannot be used; forwarding to a different email is denied; duplicate pending invites are updated or rejected consistently; removed inviter or changed guest board scope invalidates stale authority. An email-security scanner opening a link must not consume it: acceptance is an authenticated, explicit POST.

**Acceptance:** concurrent acceptance attempts produce one membership; a role altered in the browser cannot elevate the invite; a consumed secret never works again.

### F05 — Membership management and offboarding [P0]

**Behavior:** show active, invited, suspended, and removed members separately. Owner/Admin changes permitted roles and removes lower-role members. Remove active board grants, invalidate authorization caches/channels, block scheduled work addressed to removed users, and preserve historical authorship as “former member.” Assignees who lose access become explicitly unavailable and are removed from active assignment without deleting historical events.

**Permissions:** Admin cannot modify Owner or Admin peers. Members may leave except the Owner, who must first transfer ownership. Guests see only safe participant information on boards they can access.

**Acceptance:** direct database, Realtime, attachment, and notification access is denied after removal; no unrelated workspace membership changes.

### F06 — Ownership transfer and workspace lifecycle [P0]

**Behavior:** Owner initiates a transfer to an existing active Admin/Member. Require recent sign-in and MFA step-up through Auth. The target accepts within 24 hours; then atomically change `owner_user_id`, retain the old owner as Admin, and audit both actors. Invitations, Guest status, suspension, or no Orbit entitlement make a target ineligible.

Workspace archive is reversible and read-only. Deletion requires typed workspace-name confirmation and step-up, enters a 30-day recovery window, and disables ordinary content access. Owner may cancel deletion within that window through a dedicated recovery surface. Physical purge happens only through a retention worker.

**Acceptance:** simultaneous transfers cannot create two owners; last-owner departure is blocked; restoring a deletion request preserves prior board permissions.

### F07 — Board creation, discovery, settings, and lifecycle [P0]

**Behavior:** create a board with a 2–100 character name, optional description up to 2,000 characters, and workspace/private visibility. Defaults: “To do,” “In progress,” “Review,” “Done.” Board keys use unique workspace-scoped 2–8 uppercase alphanumeric identifiers. Support favorites, rename, description, visibility change, archive, and trash. Board creation plus initial columns and creator Manager assignment is one transaction.

**Permissions:** Owner/Admin/Member can create; Manager manages settings. Private-board copy explains Owner/Admin access. A visibility change previews whether more people gain access.

**Edges:** visibility changes invalidate all derived listings, search, notification projections, and channel epochs. Nonempty board trash retains content for 30 days. Slug changes must not invalidate ID-based deep links.

**Acceptance:** an inaccessible private board is absent from lists, search, counts, and API responses; archived boards allow reading but not ordinary edits.

### F08 — Columns and workflow categories [P0]

**Behavior:** Managers create, rename, reorder, and remove columns. Name length is 1–60 characters; default maximum is 20 columns per board. Each column belongs to exactly one board and has category `backlog`, `active`, `done`, or `cancelled`. At least one nonterminal column and one designated Done column must remain. A column with cards cannot be deleted without selecting a valid destination in the same board.

**Permissions:** Manager only. Column actions use the same version and transaction protections as card ordering.

**Acceptance:** removing a populated column either moves every affected card and records activity atomically, or leaves all data unchanged.

### F09 — Card creation and detailed editing [P0]

**Behavior:** quick-add needs only a 1–200 character title. Details include Markdown description up to 20,000 characters, priority (`none`, `low`, `medium`, `high`, `urgent`), assignees, labels, optional due date, activity, comments, and attachments. Allocate a monotonically increasing board-local number and display a key such as `WEB-142`; internal identity is a UUID. Blank titles, unsafe URL schemes, and invalid foreign IDs are rejected.

**Permissions:** Manager/Editor. System fields, author, workspace ID, board ID, number, revision, and audit fields cannot be mass-assigned. Workspace/board movement is not a generic PATCH.

**Edges:** autosave uses a debounce and explicit saving/saved/error state; temporary network failure does not display success; stale edits return a conflict with safe current state. Preserve unsent edits in memory during a recoverable error; do not persist private card bodies to localStorage by default.

**Acceptance:** reload displays saved data; two editors cannot silently overwrite each other's description using stale revisions; unauthorized fields are rejected, not silently accepted.

### F10 — Card movement, ordering, and conflict handling [P0]

**Behavior:** move within or between columns using pointer drag, keyboard controls, or a “Move to…” menu. The browser submits target column, neighboring card IDs, expected card/board revision, and idempotency key—not an authoritative rank. Server computes rank under a board-level lock, validates all neighbors, commits the move and event, and returns authoritative ordering.

**Permissions:** Manager/Editor on the source board. P0 movement stays in one board; cross-board transfers are deferred because labels, permissions, notifications, and attachment paths need additional handling.

**Edges:** reject stale or out-of-board neighbors, deleted cards, archived boards, and duplicates. A failed optimistic move reverts or reconciles with current server state. Do not rewrite every card's order on each drag.

**Acceptance:** concurrent moves leave every card in exactly one column; a non-drag pointer alternative exists and works. [S5]

### F11 — Completion, reopening, archiving, trash, and restore [P0]

**Behavior:** completing a card moves it to the designated Done column; reopening selects a nonterminal destination. Category is derived from column rather than a conflicting independent status. `completed_at` is set upon entering Done and cleared when reopened. Archive removes the card from ordinary active views without deleting it. Trash is recoverable for 30 days, then eligible for worker purge.

**Permissions:** Editor/Manager may complete, reopen, archive, or trash. Manager may restore trashed cards. There is no browser-accessible hard-delete command.

**Edges:** restoring into a removed column requires selecting an accessible active column. A stale undo cannot override another person's later edit. Comments/uploads are read-only on archived cards in P0; restore first to resume collaboration.

**Acceptance:** archive, completion, and deletion are visibly distinct; trashed cards disappear from normal search, counts, notifications, and file access.

### F12 — Assignment, priority, labels, and due dates [P0]

**Behavior:** multiple assignees are allowed, limited by configuration to 10 per card. Only active workspace users with effective Editor-or-higher access to the board are assignable. Labels belong to the workspace and have names and accessible color tokens. Editors attach existing labels; Owner/Admin maintains label definitions. Priority is not a permission escalation. Due dates are optional calendar dates in the workspace timezone; show overdue only for nonterminal, nonarchived cards.

**Permissions:** Manager/Editor changes card metadata. Mentioning or assigning somebody does not grant access.

**Acceptance:** a user from another workspace cannot be assigned by supplying their UUID; date-only deadlines do not shift a day when viewed in another timezone.

### F13 — Comments, mentions, and reactions [P0]

**Behavior:** comments are Markdown up to 5,000 characters, chronologically paginated, with edited indicators. Support a flat discussion first, not deeply nested threads. Mentions use user IDs resolved from a board-safe picker. Limit notifications to actual newly added mentions. Reactions are unique per comment/user/emoji from a small allowlist and toggle idempotently.

**Permissions:** Manager/Editor/Commenter can add comments and reactions and edit/delete their own comments. Manager may remove another's comment with reason and audit, never rewrite it. Viewer cannot comment.

**Acceptance:** a mention of an inaccessible user creates neither access nor a notification; unsafe Markdown/links do not execute HTML; repeated reaction requests do not duplicate records.

### F14 — Attachments and previews [P0]

**Behavior:** upload files to a new private `orbit-attachments` bucket using opaque object keys. Proposed limits: 25 MiB per file, 50 attachments per card, 1 GiB workspace quota for alpha, all configurable. The proposed allowlist is PNG/JPEG/WebP, PDF, UTF-8 text, and CSV; enable only formats whose required verification pipeline is configured and tested. Without a document scanner, launch with the validated raster-image subset only. Disallow HTML, SVG, executables, and archives. Preview only safe raster images. Other types download as attachments with their original filename sanitized for headers.

**Permissions:** Manager/Editor uploads; authorized board readers download only ready files. Uploader may remove own file while still Editor; Manager may remove any file with audit. Workspace/board/card lifecycle restrictions also apply to Storage policies.

**Edges:** reserve bytes atomically before upload; verify actual MIME signature, size, object key, and metadata; quarantine until verification; clean failed/orphan uploads. Non-image documents require a configured scanning path before being enabled; without one, keep those types disabled rather than falsely labeling them safe.

**Acceptance:** a copied object path cannot bypass access checks; unverified uploads cannot be read; removing board access blocks new downloads. Already-issued signed URLs may remain usable until their configured expiry—do not promise otherwise. [S4]

### F15 — Search and filters [P0]

**Behavior:** searchable fields initially include card title and description, plus exact card key. Filter by board, assignee, label, priority, column/category, due-date range, and archive inclusion. Search is scoped to the selected workspace and authorized boards. Default page size is 50; maximum 200. Use PostgreSQL full-text search, with a documented language configuration and indexed exact-key lookup.

**Permissions:** read permission on each result; no privileged global index that bypasses RLS. Search suggestions and counts use the same scope.

**Acceptance:** a private title cannot appear in a snippet, autocomplete, count, or timing-dependent cached result for someone without access. Empty results explain how to clear filters.

### F16 — My Work and home [P0]

**Behavior:** Home shows recent accessible boards, assigned open cards, due/overdue sections, and a small recent-activity view. My Work aggregates only currently accessible cards assigned to the user across workspaces, with workspace labels and no cross-workspace mutation shortcuts. Users may favorite boards and choose a default workspace.

**Permissions:** self-scoped preferences plus normal board access. Leaving a workspace removes its data from aggregates even if an old assignment remains in history.

**Acceptance:** inaccessible board data never survives in user-scoped server caches after authorization changes.

### F17 — Activity history and audit distinction [P0]

**Behavior:** card/board activity records important state changes with actor, type, timestamp, and safe display text. Exclude keystrokes and autosave noise; coalesce sensible edits. Security audit separately records invitations, role changes, access revocation, moderation, exports, lifecycle changes, and operator actions.

**Permissions:** board readers see appropriate activity; workspace security audit is Owner/Admin only. Clients cannot insert or modify audit entries. Operational logs are not exposed as activity.

**Acceptance:** failed/rolled-back changes produce no success event; one idempotent command produces one logical event. No token, invitation secret, full attachment URL, or password enters event data.

### F18 — In-app inbox [P0]

**Behavior:** generate notifications for assignment, direct mention, invitation state, and relevant watched activity when enabled. Support unread/read, mark all read, archive notification, and link to its subject. Dedupe by recipient/event/reason. Do not notify the actor of their own action.

**Permissions:** only recipient reads/updates notification state. Every read and link resolution rechecks current visibility of the subject. Revoke or redact content if access changed.

**Acceptance:** removed users cannot read old sensitive titles through inbox rows; retries do not send duplicate in-app notifications.

### F19 — Realtime synchronization [P0]

**Behavior:** use private board-scoped channels to send minimal “board changed” invalidations, then refetch through authorized queries. Do not broadcast full card bodies, filenames, member emails, comments, or secrets. Display connected/reconnecting/offline indicators. A reconnect fetches current state; events are not the authoritative database.

**Permissions:** board access and current channel epoch are required to subscribe. No unrestricted `authenticated USING (true)` receive policy. Authoritative board-change broadcasts are server/database-originated, not accepted from browser clients.

**Acceptance:** two authorized browsers converge after a committed move; a denied subscriber receives no content; revocation rotates the channel epoch and prevents future emissions to the old topic. See section 14 for cached channel authorization. [S2]

### F20 — Checklists [P1]

**Behavior:** cards may hold named checklists and ordered items, with checked state and optional eligible assignee. Show completion count. Proposed bounds: 10 checklists/card, 100 items/checklist, 300 characters/item. Reordering and toggling use versioned commands; checking all items does not silently complete the card.

**Permissions:** Manager/Editor only; board readers may inspect. Item assignment never expands board access.

**Acceptance:** duplicate toggle retries retain one intended state, not a flip-flop; moving item IDs between cards/workspaces is rejected.

### F21 — Saved views, sorting, and personal preferences [P1]

**Behavior:** save a named filter/sort specification, select board/list display, hide empty columns, and persist density/theme preferences. Saved filters store identifiers, not frozen result data. Personal views are private; Owner/Admin can publish a workspace view that still resolves through each viewer's permissions.

**Permissions:** create personal views for self; edit shared views only with workspace administration rights. View configuration cannot include executable SQL or arbitrary field expressions.

**Acceptance:** loading another user's view ID is denied; a shared view exposes no private board identifiers the viewer cannot otherwise see.

### F22 — Watches, personal snooze, email, and reminders [P1]

**Behavior:** watch accessible boards/cards; opt in/out of email categories; snooze a card for yourself until a timestamp. Personal snooze never hides work from teammates. Due-date reminders and digests use a timezone-aware durable scheduler and outbox. Digest default is opt-in, not automatic.

**Permissions:** self-only preferences. Job delivery rechecks recipient state and subject visibility at send time, not only enqueue time.

**Acceptance:** changing a due date invalidates obsolete reminder jobs; a removed user receives no delayed content email; DST/timezone changes do not create duplicate logical reminders.

### F23 — Bulk actions [P1]

**Behavior:** select up to 100 cards in one accessible board and apply a defined operation: label, assign, priority, archive, or move. Show the affected count and confirmation for destructive-looking actions. Start with all-or-nothing semantics; do not silently modify only some cards.

**Permissions:** Manager/Editor for every selected resource. Cross-workspace bulk operations are not supported.

**Acceptance:** one unauthorized or stale card rejects the batch with a safe actionable error and leaves all unchanged; audit groups the batch without losing per-card traceability.

### F24 — Export and portability [P1]

**Behavior:** Owner may request full workspace JSON/CSV export; Owner/Admin and Member-with-Manager-role may request managed-board export. Files include versioned schema, timestamps, and a manifest. Include binaries only through an explicit, quota-aware option. Jobs show queued/running/ready/failed/expired and expire downloadable results after 24 hours.

**Permissions:** enforce both request-time and download-time access; requests run in the requester's authorized scope, not a global service-role dump. A Guest has no bulk-export grant.

**Edges:** neutralize spreadsheet formula prefixes in CSV; no secrets/auth tables included; stale requester access cancels the job. Downloads are audited. Original user-authored text is preserved in JSON.

**Acceptance:** removal during an export blocks delivery; exported references have consistent IDs; restore/import is not claimed merely because export exists.

### F25 — Templates [P1]

**Behavior:** templates contain board columns, label references or mappings, and optional starter cards/checklists. They exclude people, private discussions, attachments, watchers, and live integration credentials. Owner/Admin may publish workspace templates; permitted creators instantiate them into a new board.

**Acceptance:** instantiation makes fresh IDs and records the creator; modifying a new board does not modify its template.

### F26 — Optional workspace MFA policy [P1]

**Behavior:** Owner can require MFA assurance for workspace access after a confirmation flow showing affected members. Enroll/challenge through Auth only. Existing users without sufficient assurance see a challenge, not a bypass. P0 already requires step-up for ownership transfer, deletion, and operational access changes.

**Acceptance:** direct API/RPC/Storage access honors required assurance, not just the Orbit page. Recovery-mode sessions cannot perform privileged work.

### F27 — Dependencies and recurring work [P2]

**Behavior:** dependencies initially remain within a board, reject cycles, and display “blocked by” without automatically changing state. Recurrence uses explicit timezone, schedule, template, next run, and pause controls; each occurrence receives a unique idempotency identity.

**Permission:** Editor manages card relationships; Manager configures recurrence policy. **Gate:** specify failure recovery, recursion/cycle tests, and inactive-board behavior before implementation.

### F28 — Automation rules and stale-card handling [P2]

**Behavior:** opt-in trigger/condition/action rules such as “when moved to Done, set a label.” Never auto-delete cards. Stale-card handling may suggest review or archive with explicit policy. Rules carry actor/owner, run history, recursion guards, action limits, and kill switch.

**Permission:** Owner/Admin or delegated Manager within a board. **Gate:** no generic user-supplied code execution; actions recheck current authority when run.

### F29 — GitHub links, webhooks, and API tokens [P2]

**Behavior:** linking an issue/PR is separate from two-way sync. New provider integration must remain product-owned and reuse the existing integration package only where its contract fits. Outgoing webhooks are opt-in and signed; incoming requests verify signatures, replay windows, and event deduplication. API tokens are revocable, hashed at rest, scope-limited, expiring, and associated with an actor/workspace.

**Permission:** Owner/Admin configures providers and tokens. **Gate:** no automatic repository mutation, arbitrary URL fetching, SSRF exposure, or export of inaccessible card content. External writes need clear product-level user intent.

### F30 — Public read-only board publication [P2]

**Behavior:** publish a separately defined, allowlisted projection—not the private board table. Owner explicitly approves publication; default fields exclude assignees, member identities, comments, attachments, audit details, and private descriptions. Revocation and caching behavior must be defined.

**Permission:** Owner only initially. **Gate:** no `anon SELECT` blanket grants on private product tables; link secrecy alone is not sufficient access control. Publication is off throughout P0/P1.

### F31 — Import adapters [P2]

**Behavior:** explicit supported formats, mapping preview, dry-run validation, per-row errors, duplicate policy, and resumable batches. Start with Orbit's documented JSON export only if round-trip support is deliberately implemented; Fizzy/Trello imports are separate adapters requiring verified formats.

**Permission:** Owner/Admin imports into an authorized target board. **Gate:** cap file/row size; parse safely; do not claim to import data from a provider without a tested adapter.

### F32 — Reporting and optional AI [P2]

**Behavior:** aggregate completion trends, backlog age, and workflow bottlenecks using definitions displayed alongside charts. AI, if separately approved, may draft summaries or suggested actions from explicitly selected accessible content. Suggestions remain uncommitted until user action.

**Permission:** reports obey board visibility; AI follows the same access model, opt-in data-processing disclosure, and provider budget. **Gate:** no automatic personnel scoring, secret access, unreviewed mutations, or third-party transmission enabled by default.

---
