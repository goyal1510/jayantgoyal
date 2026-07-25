begin;

create or replace function portfolio.is_project_case_study_shape(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    value is not null
    and pg_catalog.jsonb_typeof(value) = 'object'
    and pg_catalog.jsonb_typeof(value -> 'problem') = 'string'
    and pg_catalog.jsonb_typeof(value -> 'solution') = 'string'
    and pg_catalog.jsonb_typeof(value -> 'architecture') = 'string'
    and pg_catalog.jsonb_typeof(value -> 'security') = 'string'
    and pg_catalog.jsonb_typeof(value -> 'tradeoffs') = 'string'
    and pg_catalog.jsonb_typeof(value -> 'outcome') = 'string'
    and pg_catalog.jsonb_typeof(value -> 'next_improvement') = 'string'
    and pg_catalog.jsonb_typeof(value -> 'decisions') = 'array'
    and not exists (
      select 1
      from pg_catalog.jsonb_array_elements(value -> 'decisions') as decision
      where pg_catalog.jsonb_typeof(decision) <> 'object'
        or pg_catalog.jsonb_typeof(decision -> 'title') <> 'string'
        or pg_catalog.jsonb_typeof(decision -> 'detail') <> 'string'
    );
$$;

create or replace function portfolio.is_complete_project_case_study(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when not portfolio.is_project_case_study_shape(value) then false
    else
      pg_catalog.btrim(value ->> 'problem') <> ''
      and pg_catalog.btrim(value ->> 'solution') <> ''
      and pg_catalog.btrim(value ->> 'architecture') <> ''
      and pg_catalog.btrim(value ->> 'security') <> ''
      and pg_catalog.btrim(value ->> 'tradeoffs') <> ''
      and pg_catalog.btrim(value ->> 'outcome') <> ''
      and pg_catalog.btrim(value ->> 'next_improvement') <> ''
      and pg_catalog.jsonb_array_length(value -> 'decisions') >= 2
      and not exists (
        select 1
        from pg_catalog.jsonb_array_elements(value -> 'decisions') as decision
        where pg_catalog.btrim(decision ->> 'title') = ''
          or pg_catalog.btrim(decision ->> 'detail') = ''
      )
  end;
$$;

revoke all
  on function portfolio.is_project_case_study_shape(jsonb)
  from public;
revoke all
  on function portfolio.is_complete_project_case_study(jsonb)
  from public;
grant execute
  on function portfolio.is_project_case_study_shape(jsonb)
  to authenticated, service_role;
grant execute
  on function portfolio.is_complete_project_case_study(jsonb)
  to authenticated, service_role;

alter table portfolio.projects
  add column case_study jsonb,
  add column case_study_published boolean not null default false;

alter table portfolio.projects
  add constraint projects_case_study_shape_check check (
    case_study is null
    or portfolio.is_project_case_study_shape(case_study)
  ),
  add constraint projects_case_study_publication_check check (
    not case_study_published
    or portfolio.is_complete_project_case_study(case_study)
  );

update portfolio.projects
set
  case_study = jsonb_build_object(
    'problem',
    'Developers repeatedly leave their workflow for small encoding, formatting, validation, and generation tasks. A pile of one-off pages would be difficult to discover, keep consistent, and extend.',
    'solution',
    'I built one searchable catalog of 87 browser-first utilities with category browsing, favorites, recent usage, consistent interaction patterns, and a direct route for every tool.',
    'architecture',
    'A typed registry is the source of truth for each tool''s identity, category, route, metadata, and discovery behavior. Next.js renders the catalog and individual tools, Zustand provides immediate local persistence, and authenticated users synchronize favorites and history through a schema-scoped Supabase API.',
    'decisions',
    jsonb_build_array(
      jsonb_build_object(
        'title',
        'Treat the registry as a product API',
        'detail',
        'Central typed metadata keeps catalog navigation, route lookup, usage validation, inventory counts, and SEO content aligned as new utilities are added.'
      ),
      jsonb_build_object(
        'title',
        'Keep usage local-first and sync optional',
        'detail',
        'Tools remain immediately useful without an account. Zustand stores favorites and history locally, while authenticated users can synchronize the same workflow across sessions.'
      ),
      jsonb_build_object(
        'title',
        'Share the shell, not every implementation',
        'detail',
        'Discovery, metadata, and common interactions are reused, while parsing, conversion, validation, and cryptographic behavior remain isolated where their correctness requirements differ.'
      )
    ),
    'security',
    'The usage API authenticates the caller and validates every submitted tool ID against the canonical registry before reading or writing synchronized state. Tool inputs stay in the browser where the operation does not require a server boundary.',
    'tradeoffs',
    'A broad catalog increases consistency pressure and can hide weak individual tools. Shared metadata contracts and registry tests reduce drift, but complex utilities still need focused fixtures and domain-specific review.',
    'outcome',
    'The result is an extensible utility platform rather than a folder of unrelated demos: one discovery system, one interaction language, and a predictable path for adding the next tool.',
    'next_improvement',
    'Add stronger per-tool fixtures, explicit privacy and execution labels, and product analytics that connect search intent to successful tool use without collecting sensitive inputs.'
  ),
  case_study_published = true
where slug = 'tech-tools';

update portfolio.projects
set
  case_study = jsonb_build_object(
    'problem',
    'A private file product must keep object bytes secure while still making folders, search, uploads, previews, moves, copies, and recovery understandable to the user.',
    'solution',
    'I built an authenticated cloud workspace with hierarchical folders, direct uploads, signed previews, search, conflict handling, move and copy operations, soft deletion, and restoration.',
    'architecture',
    'PostgreSQL stores user-owned file metadata, parent relationships, paths, versions, and deletion state while a private Supabase Storage bucket holds object bytes. Next.js route handlers issue short-lived signed upload and read URLs, and a two-step completion route verifies the uploaded object before creating its metadata record.',
    'decisions',
    jsonb_build_array(
      jsonb_build_object(
        'title',
        'Separate storage identity from display paths',
        'detail',
        'Object keys are generated beneath the user boundary while human-readable names and hierarchy live in PostgreSQL, so renaming and organization do not require exposing predictable public object URLs.'
      ),
      jsonb_build_object(
        'title',
        'Upload directly through short-lived grants',
        'detail',
        'The server validates size, MIME type, destination, and conflicts, then returns a two-minute signed upload URL so file bytes do not pass through the application server.'
      ),
      jsonb_build_object(
        'title',
        'Prefer recoverable deletion',
        'detail',
        'Metadata records carry deletion state and timestamps, allowing restore workflows while ordinary queries and the directory tree exclude deleted items.'
      )
    ),
    'security',
    'Every file route resolves the authenticated user, binds metadata queries to that user ID, and relies on row-level security for database isolation. Private objects are delivered with short-lived signed URLs. Canonical storage-policy capture remains a tracked hardening item.',
    'tradeoffs',
    'The two-step signed upload keeps large bytes off the app server but creates partial-failure paths between object storage and metadata. The completion route verifies the object and rolls it back if metadata creation fails; overwrite, move, and copy workflows still need stronger transaction boundaries.',
    'outcome',
    'The product demonstrates a complete private-file workflow common to SaaS products: hierarchical data, direct object transfer, authenticated retrieval, conflict resolution, and recoverable operations.',
    'next_improvement',
    'Capture private-bucket policies in the canonical schema, make metadata and storage mutations idempotent, add background orphan cleanup, and introduce integration tests for cross-user isolation.'
  ),
  case_study_published = true
where slug = 'file-manager';

update portfolio.projects
set
  case_study = jsonb_build_object(
    'problem',
    'Online games repeat the same hard problems—room identity, participants, turns, moves, results, reconnectable state, and realtime updates—even though each game has different rules.',
    'solution',
    'I built a shared session platform used across nine games, combining reusable room and participant infrastructure with game-specific server validation and interfaces.',
    'architecture',
    'PostgreSQL separates sessions, participants, moves, and results. Next.js route handlers normalize room codes, load the current session bundle, validate membership and game rules, then persist state. Online room clients subscribe to Supabase Postgres Changes for session, move, and result updates.',
    'decisions',
    jsonb_build_array(
      jsonb_build_object(
        'title',
        'Share the session model, specialize the rules',
        'detail',
        'A common relational backbone handles rooms, participants, move order, and results while dedicated endpoints keep Chess, Wordle, Ludo, Memory Match, and other rule systems explicit.'
      ),
      jsonb_build_object(
        'title',
        'Make the server authoritative',
        'detail',
        'Clients submit an intended move or action; route handlers verify identity, participation, turn state, and game legality before appending the accepted state.'
      ),
      jsonb_build_object(
        'title',
        'Use realtime as delivery, not authority',
        'detail',
        'Postgres Changes refreshes connected rooms quickly, but durable session, participant, move, and result rows remain the source of truth for reloads and reconnects.'
      )
    ),
    'security',
    'Authenticated identity is checked at the route boundary, room codes are normalized, participant membership is verified, and schema-scoped row-level policies protect persisted game data. Game-specific handlers reject actions that do not match the current state.',
    'tradeoffs',
    'Per-game endpoints keep complex rules readable but repeat some orchestration. Several move and result writes are currently sequential rather than transactional, leaving a known concurrency and partial-write risk under simultaneous actions.',
    'outcome',
    'The result is a reusable realtime product foundation rather than nine isolated games, demonstrating domain modeling, server-authoritative validation, persistent state, and live collaboration.',
    'next_improvement',
    'Move accepted actions into transactional database functions with optimistic version checks and idempotency keys, then add adversarial concurrency tests for simultaneous moves and reconnects.'
  ),
  case_study_published = true
where slug = 'game-hub';

commit;
