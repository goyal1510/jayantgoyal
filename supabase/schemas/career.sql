create schema if not exists career;

revoke all on schema career from public, anon, authenticated;
grant usage on schema career to service_role;

create type career.job_source as enum (
  'wellfound',
  'linkedin',
  'career_page',
  'referral',
  'manual'
);

create type career.opportunity_status as enum (
  'discovered',
  'shortlisted',
  'preparing',
  'ready_for_review',
  'approved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
  'closed',
  'skipped'
);

create type career.application_status as enum (
  'submitted',
  'viewed',
  'in_review',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
  'unknown'
);

create type career.draft_status as enum (
  'draft',
  'ready_for_review',
  'approved',
  'submitted',
  'superseded'
);

create type career.outreach_channel as enum (
  'linkedin',
  'email',
  'wellfound',
  'other'
);

create type career.outreach_status as enum (
  'draft',
  'ready_for_review',
  'approved',
  'sent',
  'replied',
  'declined',
  'failed',
  'cancelled'
);

create type career.automation_run_kind as enum ('discovery', 'status_sync');
create type career.automation_run_status as enum (
  'running',
  'succeeded',
  'partial',
  'failed'
);

create table career.companies (
  id uuid primary key default foundation.uuid_v7(),
  name text not null unique check (char_length(btrim(name)) between 1 and 200),
  canonical_url text check (canonical_url is null or canonical_url ~ '^https://'),
  careers_url text check (careers_url is null or careers_url ~ '^https://'),
  linkedin_url text check (linkedin_url is null or linkedin_url ~ '^https://'),
  industry text,
  stage text,
  size_text text,
  headquarters text,
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index career_companies_name_key
  on career.companies (lower(btrim(name)));
create unique index career_companies_canonical_url_key
  on career.companies (canonical_url)
  where canonical_url is not null;

create table career.opportunities (
  id uuid primary key default foundation.uuid_v7(),
  company_id uuid not null references career.companies(id) on delete restrict,
  source career.job_source not null,
  external_id text,
  source_url text not null check (source_url ~ '^https://'),
  apply_url text check (apply_url is null or apply_url ~ '^https://'),
  title text not null check (char_length(btrim(title)) between 1 and 240),
  location_text text,
  work_policy text not null default 'unknown'
    check (work_policy in ('remote', 'hybrid', 'onsite', 'unknown')),
  employment_type text,
  salary_text text,
  experience_min smallint check (experience_min is null or experience_min >= 0),
  experience_max smallint check (
    experience_max is null or
    (experience_max >= 0 and (experience_min is null or experience_max >= experience_min))
  ),
  skills text[] not null default '{}',
  description_excerpt text check (
    description_excerpt is null or char_length(description_excerpt) <= 4000
  ),
  posted_at timestamptz,
  discovered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  closed_at timestamptz,
  fit_score smallint check (fit_score is null or fit_score between 0 and 100),
  fit_summary text check (fit_summary is null or char_length(fit_summary) <= 2000),
  concerns text[] not null default '{}',
  status career.opportunity_status not null default 'discovered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index career_opportunities_source_url_key
  on career.opportunities (source_url);
create unique index career_opportunities_source_external_id_key
  on career.opportunities (source, external_id)
  where external_id is not null;
create index career_opportunities_status_fit_idx
  on career.opportunities (status, fit_score desc nulls last, discovered_at desc);
create index career_opportunities_company_idx
  on career.opportunities (company_id, discovered_at desc);

create table career.application_drafts (
  id uuid primary key default foundation.uuid_v7(),
  opportunity_id uuid not null references career.opportunities(id) on delete cascade,
  revision integer not null default 1 check (revision > 0),
  status career.draft_status not null default 'draft',
  cover_note text check (cover_note is null or char_length(cover_note) <= 5000),
  question_answers jsonb not null default '[]'::jsonb
    check (jsonb_typeof(question_answers) = 'array'),
  resume_label text,
  is_current boolean not null default true,
  prepared_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, revision)
);

create unique index career_application_drafts_current_key
  on career.application_drafts (opportunity_id)
  where is_current;

create table career.applications (
  id uuid primary key default foundation.uuid_v7(),
  opportunity_id uuid not null unique references career.opportunities(id) on delete restrict,
  draft_id uuid references career.application_drafts(id) on delete set null,
  submission_channel career.job_source not null,
  external_application_id text,
  submitted_at timestamptz not null,
  status career.application_status not null default 'submitted',
  source_status_text text,
  last_checked_at timestamptz,
  last_status_change_at timestamptz not null default now(),
  reply_received_at timestamptz,
  next_action_at timestamptz,
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index career_applications_status_idx
  on career.applications (status, last_checked_at nulls first);

create table career.contacts (
  id uuid primary key default foundation.uuid_v7(),
  company_id uuid not null references career.companies(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 200),
  title text,
  profile_url text not null check (profile_url ~ '^https://'),
  public_email text,
  public_email_source_url text,
  relationship_type text not null default 'employee'
    check (relationship_type in ('employee', 'recruiter', 'hiring_manager', 'founder', 'known_contact')),
  fit_reason text check (fit_reason is null or char_length(fit_reason) <= 2000),
  confidence smallint check (confidence is null or confidence between 0 and 100),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    public_email is null or
    (public_email_source_url is not null and public_email_source_url ~ '^https://')
  )
);

create unique index career_contacts_profile_url_key
  on career.contacts (profile_url);
create index career_contacts_company_idx on career.contacts (company_id);

create table career.outreach (
  id uuid primary key default foundation.uuid_v7(),
  contact_id uuid not null references career.contacts(id) on delete restrict,
  opportunity_id uuid references career.opportunities(id) on delete set null,
  channel career.outreach_channel not null,
  message text not null check (char_length(btrim(message)) between 1 and 5000),
  status career.outreach_status not null default 'draft',
  sent_at timestamptz,
  replied_at timestamptz,
  last_checked_at timestamptz,
  provider_thread_url text check (
    provider_thread_url is null or provider_thread_url ~ '^https://'
  ),
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index career_outreach_status_idx
  on career.outreach (status, last_checked_at nulls first);
create index career_outreach_opportunity_idx on career.outreach (opportunity_id);

create table career.automation_runs (
  id uuid primary key default foundation.uuid_v7(),
  kind career.automation_run_kind not null,
  status career.automation_run_status not null default 'running',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  discovered_count integer not null default 0 check (discovered_count >= 0),
  shortlisted_count integer not null default 0 check (shortlisted_count >= 0),
  prepared_count integer not null default 0 check (prepared_count >= 0),
  submitted_count integer not null default 0 check (submitted_count >= 0),
  reply_count integer not null default 0 check (reply_count >= 0),
  error_text text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index career_automation_runs_kind_started_idx
  on career.automation_runs (kind, started_at desc);

create table career.pipeline_events (
  id uuid primary key default foundation.uuid_v7(),
  run_id uuid references career.automation_runs(id) on delete set null,
  entity_type text not null
    check (entity_type in ('company', 'opportunity', 'application', 'contact', 'outreach')),
  entity_id uuid not null,
  event_type text not null check (char_length(btrim(event_type)) between 1 and 120),
  from_status text,
  to_status text,
  detail jsonb not null default '{}'::jsonb check (jsonb_typeof(detail) = 'object'),
  occurred_at timestamptz not null default now()
);

create index career_pipeline_events_entity_idx
  on career.pipeline_events (entity_type, entity_id, occurred_at desc);

create trigger career_companies_set_updated_at
  before update on career.companies
  for each row execute function foundation.set_updated_at();
create trigger career_opportunities_set_updated_at
  before update on career.opportunities
  for each row execute function foundation.set_updated_at();
create trigger career_application_drafts_set_updated_at
  before update on career.application_drafts
  for each row execute function foundation.set_updated_at();
create trigger career_applications_set_updated_at
  before update on career.applications
  for each row execute function foundation.set_updated_at();
create trigger career_contacts_set_updated_at
  before update on career.contacts
  for each row execute function foundation.set_updated_at();
create trigger career_outreach_set_updated_at
  before update on career.outreach
  for each row execute function foundation.set_updated_at();

alter table career.companies enable row level security;
alter table career.opportunities enable row level security;
alter table career.application_drafts enable row level security;
alter table career.applications enable row level security;
alter table career.contacts enable row level security;
alter table career.outreach enable row level security;
alter table career.automation_runs enable row level security;
alter table career.pipeline_events enable row level security;

revoke all on all tables in schema career from public, anon, authenticated;
revoke all on all sequences in schema career from public, anon, authenticated;
grant all on all tables in schema career to service_role;
grant all on all sequences in schema career to service_role;

alter default privileges in schema career
  revoke all on tables from public, anon, authenticated;
alter default privileges in schema career
  revoke all on sequences from public, anon, authenticated;
alter default privileges in schema career
  grant all on tables to service_role;
alter default privileges in schema career
  grant all on sequences to service_role;
