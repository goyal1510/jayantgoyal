# Database schema ownership and evolution

This page defines the deployed Supabase ownership model and the rules for
evolving it. Canonical schema snapshots and the linked project are
authoritative for current behavior.

The Supabase normalization uses the existing `jayantgoyal` project
(`orwfvyditlguqvxvztkw`) and its existing `auth.users` identity boundary. A
second Supabase project is not part of the approved architecture.

## Current physical structure

The project contains 40 application tables in five application schemas:

| Physical schema | Tables | Current contents                                                    |
| --------------- | -----: | ------------------------------------------------------------------- |
| `foundation`    |      0 | Private reusable UUID, timestamp, and validation helpers            |
| `iam`           |     13 | Profiles, access, workforce, roles, capabilities, policy, and audit |
| `iam_private`   |      0 | Private authorization, provisioning, and RLS predicates             |
| `studio`        |     14 | Studio workspaces, games, personalization, and file metadata        |
| `portfolio`     |     13 | Portfolio presentation, CMS, Writing, and contact-abuse state       |

The predecessor `jg_account` and `jg_app` schemas no longer exist. Shaamil has
no current schema, table, publication, Storage bucket, or client.

## Ownership model

| Schema        | Responsibility                                                                                                           | Data API posture                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `foundation`  | Reused database primitives such as UUID and validation helpers                                                           | Private; never an exposed schema                                                          |
| `iam`         | Canonical profiles, product entitlements, workforce membership, roles, capabilities, policy acceptance, and access audit | Expose only intentional self-service/read operations; privileged mutation remains trusted |
| `iam_private` | Caller-bound and trusted authorization predicates used by RLS and transactional commands                                 | Private; never a Data API schema                                                          |
| `studio`      | Studio tools, workspaces, games, personalization, and Studio file metadata                                               | RLS-protected operations with IAM product/capability checks                               |
| `portfolio`   | Portfolio and Writing content plus Portfolio abuse-control state                                                         | Selected public reads and capability-authorized Admin writes                              |
| `shaamil`     | Future Shaamil communities, membership, communication, safety, sync, and notification state                              | Created only with an approved Shaamil backend milestone                                   |

Supabase-managed `auth`, `storage`, `realtime`, and `extensions` retain their
platform ownership. Application migrations must not rename or add arbitrary
objects inside those schemas. Supabase currently treats Storage metadata as
read-only for file operations, and hosted Realtime now blocks modifications to
objects inside its managed schema.

This is the deployed structure. Future migrations must keep shared database
primitives private, central access state in IAM, and product resources in the
owning product schema.

## Identity and access model

Supabase Auth answers who authenticated. IAM answers whether that user is an
active ecosystem subject, which protected product they may enter, and which
baseline capabilities they hold. Each product then applies resource-specific
attributes and invariants.

The authorization decision is:

```text
authenticated session
AND active IAM profile
AND active product membership or explicit public-access rule
AND assigned role grants the requested capability
AND product/resource attributes permit the action
AND the session satisfies any required MFA assurance
```

RBAC grants baseline capabilities. Product-owned ABAC narrows those grants by
ownership, membership, resource state, privacy, time, or session assurance. UI
visibility is advisory only; RLS or a trusted server operation makes the
authoritative decision.

IAM consists of the smallest structures needed for the accepted
access model:

| IAM object                   | Responsibility                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `profiles`                   | One canonical profile per `auth.users` identity; names, avatar state, and lifecycle status, but no embedded role         |
| `products`                   | Stable keys for the implemented Auth, Portfolio, Studio, and Admin products; Shaamil is added with its backend milestone |
| `product_memberships`        | Whether a user has active protected access to a product, including validity and revocation state                         |
| `workforces`                 | Operator-owned workforce boundaries; not a generic public tenant system                                                  |
| `workforce_memberships`      | User affiliation and workforce status                                                                                    |
| `roles`                      | Named role definitions scoped to a product or workforce                                                                  |
| `capabilities`               | Stable, product-owned `product.resource.action` vocabulary such as `studio.files.read`                                   |
| `role_capabilities`          | Capabilities granted by a role                                                                                           |
| `product_role_assignments`   | Typed product-scope role assignments with foreign keys                                                                   |
| `workforce_role_assignments` | Typed workforce-scope role assignments with foreign keys                                                                 |
| `policy_versions`            | Version registry for product policies such as Studio terms                                                               |
| `policy_acceptances`         | User acceptance of an exact policy version, replacing an unversioned terms boolean                                       |
| `access_audit_events`        | Append-only evidence for privileged entitlement and role changes                                                         |

Typed product and workforce assignments are preferred over a polymorphic
`scope_type`/`scope_id` pair without referential integrity. Product-local
resource roles remain product-owned: for example, Shaamil community membership
and community roles belong in `shaamil`, not in central IAM.

Roles are bundles, never part of a capability key. `admin.full_access` grants
the current Admin, Portfolio CMS, deployment, and access-management CRUD;
`admin.viewer` grants Admin entry and read capabilities only. An Admin viewer
must have an explicit active Admin membership and role assignment. New Auth
users receive an IAM profile and Auth membership only, so they do not gain
Studio or Admin access implicitly.

The normalization backfill assigns both `goyal151002@gmail.com` and
`gacbbl@gmail.com` `admin.full_access` plus `studio.member`. The former remains
the `jayant-operations` workforce owner and the latter is its administrator.
Both have the same current read/create/update/delete product capabilities;
workforce ownership transfer remains a separate audited capability granted only
through `operations.owner`.

Shaamil does not receive a duplicate mandatory profile. It uses the canonical
IAM profile and stores only Shaamil-specific settings, memberships, privacy,
and moderation state. A product persona table is justified later only if an
approved Shaamil handle, display name, avatar override, or biography must
differ from the canonical profile.

## Retired IAM predecessor mapping

| Current object                   | Target                                   | Required change                                                                                                                    |
| -------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `jg_account.profiles`            | `iam.profiles`                           | Use `user_id` as the identity key; remove the surrogate account role contract; retain canonical names and avatar state.            |
| `jg_account.user_role`           | IAM roles, capabilities, and assignments | Privileged users were backfilled into explicit Admin and Portfolio capability assignments; the enum was removed.                   |
| `profiles.terms_accepted*`       | `iam.policy_acceptances`                 | Existing acceptance was converted into an explicit document/version record before the boolean fields were removed.                 |
| `jg_account.is_admin()`          | IAM capability evaluation                | Replace global role checks with a caller-bound capability predicate.                                                               |
| `jg_account.count_my_sessions()` | `iam.count_my_sessions()`                | Keep caller-bound session counting; do not expose another user's session lookup.                                                   |
| `jg_account.handle_new_user()`   | `iam_private.handle_new_user()`          | Provision exactly one IAM profile and Auth membership from `auth.users`; preserve a repair/backfill check for existing identities. |
| `jg_account.handle_updated_at()` | `foundation.set_updated_at()`            | Consolidate the genuinely reused trigger primitive.                                                                                |

The retired global `super_admin` value does not imply automatic read access to
private Shaamil content. Emergency or operator control-plane capabilities are
explicit, MFA-protected where appropriate, and audited.

## Retired `jg_app` ownership mapping

The cutover split the mixed predecessor schema by actual owner:

| Current object                      | Target                                      | Decision                                                                             |
| ----------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `jg_app.uuid_v7()`                  | `foundation.uuid_v7()`                      | Move; currently reused by Studio and Portfolio.                                      |
| `jg_app.update_updated_at()`        | `foundation.set_updated_at()`               | Move and give the trigger responsibility an explicit name.                           |
| `jg_app.is_nonblank_text_array()`   | `foundation.is_nonblank_text_array()`       | Move; currently used by cross-product constraints.                                   |
| `jg_app.writing_posts`              | `portfolio.writing_posts`                   | Move with policies, indexes, triggers, Admin APIs, Portfolio readers, and contracts. |
| `activity_tracker_activities`       | `studio.activity_tracker_activities`        | Keep the feature-qualified name.                                                     |
| `activity_tracker_entries`          | `studio.activity_tracker_entries`           | Keep the feature-qualified name and enforce activity/user consistency.               |
| `currency_calculator_calculations`  | `studio.currency_calculations`              | Shorten without losing meaning.                                                      |
| `currency_calculator_denominations` | `studio.currency_calculation_denominations` | Name the parent relationship explicitly.                                             |
| `file_manager_files`                | `studio.file_entries`                       | Represent both files and directories without colliding with Storage objects.         |
| `file_manager_type_categories`      | `studio.file_type_categories`               | Remove the redundant manager prefix.                                                 |
| `game_hub_sessions`                 | `studio.game_sessions`                      | Remove the UI-surface term from the domain table.                                    |
| `game_hub_session_participants`     | `studio.game_session_participants`          | Preserve the session relationship.                                                   |
| `game_hub_session_moves`            | `studio.game_session_moves`                 | Preserve ordered action ownership.                                                   |
| `game_hub_session_results`          | `studio.game_session_results`               | Preserve the one-result-per-session rule.                                            |
| `game_hub_typing_speed_results`     | `studio.typing_test_results`                | Move the single-user capability out of the online-game aggregate name.               |
| `scratchpad_entries`                | `studio.scratchpad_entries`                 | Keep the accepted product vocabulary.                                                |
| `tool_favorites`                    | `studio.tool_favorites`                     | Keep.                                                                                |
| `tool_history`                      | `studio.tool_history`                       | Keep.                                                                                |
| `game_hub_session_status`           | `studio.game_session_status`                | Rename with the aggregate.                                                           |
| `record_game_hub_action()`          | `studio.record_game_action()`               | Keep as a trusted transactional command and bind it to an authorized actor.          |

Table, constraint, index, trigger, policy, function, RPC, TypeScript contract,
test, and Realtime names must move together. Historical applied migrations are
not edited.

## Required structural corrections

The cutover is also a data-integrity and authorization correction:

- Make owner and required parent foreign keys non-null where the application
  already requires them.
- Prevent an Activity Tracker entry from naming one user's `user_id` while
  referencing another user's activity, using a composite invariant or a
  parent-derived owner.
- Remove `ist_timestamp` text and use the canonical timezone-aware creation
  timestamp; locale rendering belongs in the client.
- Add non-negative and range constraints for calculation quantities, file
  sizes/counts, typing metrics, and other values that currently rely on UI
  validation.
- Keep the currently consumed file deletion fields temporarily, but enforce
  their equivalence and the partial unique index for active file paths.
- Remove file version fields that are not backed by a real version aggregate;
  do not preserve placeholder capability in the schema.
- Bind client-callable RPCs to `auth.uid()` rather than accepting a caller-
  supplied `p_user_id`. Keep privileged multi-row commands server-only.
- Prevent game participants from directly rewriting authoritative session
  state. Ordered game transitions go through the transactional command.
- Define participant visibility consistently so joined players can read the
  participant rows required by the game UI without exposing unrelated rooms.
- Index every foreign key and every subject, product, capability, membership,
  status, and resource column used by RLS.

## Grants, RLS, and function hardening

The predecessor snapshots contained broad schema defaults and object grants.
Several Studio tables granted DML to `anon`, and several file functions were
callable by `anon` while accepting a user ID. `soft_delete_file` was also a
`SECURITY DEFINER` function without an internal `auth.uid()` equality check.
These contracts must not be reintroduced.

The current rules are:

1. Revoke broad default privileges before creating application objects.
2. Grant only the operation each role requires; RLS and grants are separate
   controls.
3. Enable RLS on every table in an exposed schema and use both `USING` and
   `WITH CHECK` for ownership-preserving updates.
4. Do not grant Studio persistence to `anon`; public browser-local tools do not
   need database DML.
5. Keep security-definer authorization helpers outside exposed schemas, with a
   fixed empty `search_path`, explicit caller checks, and revoked public
   execution.
6. Require current database membership/capability state for revocation-
   sensitive actions. JWT claims may be navigation hints but are not the sole
   authority because they remain stale until refresh.
7. Step an enrolled factor up to AAL2 before privileged operations. Making MFA
   enrollment mandatory for every access administrator remains a separate
   policy decision and must not be implied by the database role alone.

Supabase documents the distinction between Data API grants and RLS in
[Securing your API](https://supabase.com/docs/guides/api/securing-your-api) and
recommends keeping security-definer helpers outside exposed schemas in [Row
Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Storage and Realtime

The current buckets are `studio-files`, `portfolio-assets`, and
`profile-avatars`.

- `portfolio-assets` and `profile-avatars` retain their explicit ownership.
- `studio-files` is the private Studio object boundary. File-object upload,
  move, copy, and deletion use the Storage API. The empty predecessor
  `private-files` bucket has been removed.
- Rebuild Storage policies against user ownership plus the relevant IAM
  product capability. A service-role upload has no automatic user owner and
  therefore needs explicit application ownership validation.
- Do not create a Shaamil attachment bucket during this normalization.

`studio.scratchpad_entries` is explicitly included in `supabase_realtime`.
Historical Messenger tables remain removed. Retained client subscriptions use
the `studio` schema name.

Existing Studio delivery may continue with bounded Postgres Changes. New
Shaamil messaging should use private Broadcast plus durable cursor
reconciliation; Supabase recommends Broadcast for scalability and security in
[Subscribing to database changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes).

## Evolution contract

- Use reviewed forward migrations; never edit applied history or restore the
  retired schema names as compatibility aliases.
- Coordinate schema/API contract changes with every consuming client. A
  database rename is not an application deployment.
- Refresh every affected canonical schema snapshot after a hosted apply.
- Recheck grants, RLS, function ACLs, publication membership, Storage policy,
  and operation-level capability behavior.
- Use a reviewed forward fix if hosted verification fails.
- `pnpm test:db:linked` performs hosted writes and requires explicit
  authorization.

Shaamil schema creation remains a separate reviewed migration tied to an
approved backend milestone.
