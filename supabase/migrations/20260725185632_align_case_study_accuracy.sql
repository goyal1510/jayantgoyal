begin;

update portfolio.work
set case_study = jsonb_set(
  jsonb_set(
    case_study,
    '{security}',
    to_jsonb('Every file route resolves the authenticated user, binds metadata queries to that user ID, and relies on row-level security for database isolation. Private objects are delivered with short-lived signed URLs, and the private bucket policies enforce the same user boundary.'::text),
    false
  ),
  '{next_improvement}',
  to_jsonb('Make metadata and storage mutations idempotent, add background orphan cleanup, and introduce integration tests for cross-user isolation.'::text),
  false
)
where slug = 'file-manager'
  and case_study is not null;

update portfolio.work
set case_study = jsonb_set(
  jsonb_set(
    jsonb_set(
      case_study,
      '{architecture}',
      to_jsonb('PostgreSQL separates sessions, participants, moves, and results. Next.js route handlers normalize room codes, validate membership and game rules, then call a transactional Supabase RPC that locks the session row and rejects stale move numbers before persisting state. Online room clients subscribe to Supabase Postgres Changes for session, move, and result updates.'::text),
      false
    ),
    '{tradeoffs}',
    to_jsonb('Per-game endpoints keep complex rules readable but repeat some orchestration. The shared transactional RPC serializes accepted actions and rejects stale move numbers; per-game rule coverage and reconnect edge cases still benefit from more adversarial tests.'::text),
    false
  ),
  '{next_improvement}',
  to_jsonb('Expand adversarial concurrency tests for simultaneous moves and reconnects, and add idempotency keys for safe retries.'::text),
  false
)
where slug = 'game-hub'
  and case_study is not null;

commit;
