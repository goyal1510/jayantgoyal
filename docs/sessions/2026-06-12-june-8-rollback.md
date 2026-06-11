# 2026-06-12 June 8 Rollback

## Scope

- Roll back code changes introduced from June 8, 2026 onward.
- Restore the repository tree to the last main commit before the June 8 app/product work: `99e86fb`.
- Add a reverse Supabase migration for additive June 8/9 schema objects.

## Notes

- Current rollback target is `99e86fb` (`Merge pull request #27 from goyal1510/feature/web/online-game-rooms`).
- The rollback removes commerce/store/admin-commerce surfaces, new account purchase flows, new tools workspace surfaces, bulk/share/star file manager additions, real conversation messenger additions, custom calculator templates, game start/time-control updates, and related docs from the code tree.
- Added `20260612013000_rollback_june_8_app_changes.sql` to drop additive commerce, messenger conversation, file share/star, saved tool item, calculator template, analytics, and email-event database objects from June 8/9 work.
- The reverse DB migration avoids older April/May historical migration records because those files appear to have been added as migration-history tracking, not as new June 8 feature schema.
- Kept two post-anchor compatibility fixes required by the current toolchain: Supabase MFA Admin API now exposes `factors`/`id`, and the blog markdown renderer keeps plain `<img>` with an ESLint disable because this app avoids `next/image` for external URLs.
- Applied `20260612013000_rollback_june_8_app_changes.sql` to remote Supabase project `orwfvyditlguqvxvztkw` from a temporary workdir. Verification returned `removed_objects_remaining = 0`, `removed_columns_remaining = 0`, and `legacy_tables_present = 2`.
