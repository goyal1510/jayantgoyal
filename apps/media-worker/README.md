# Private Media Worker

Single-consumer Python worker for Studio's permission-first Media Converter. It
polls Supabase for owner-authorized jobs, uses `yt-dlp` plus FFmpeg, uploads the
result to a private Supabase Storage bucket with the TUS resumable protocol, and
removes expired objects.

The service exposes only `GET /healthz`; job creation remains behind Studio
authentication and its production owner allowlist. Do not expose the Supabase
service-role key to a browser or copy it into a `NEXT_PUBLIC_*` variable.

The complete deployment, secret recovery, laptop reset, provider migration, and
decommission procedure lives in
[`docs/architecture/media-worker-operations.md`](../../docs/architecture/media-worker-operations.md).

## Run with Docker

```bash
cp .env.example .env
docker build -t jg-media-worker .
docker run --rm --env-file .env -p 8080:8080 jg-media-worker
```

The image includes Python 3.12, FFmpeg, Deno, and the pinned `yt-dlp` release.
Deno and `yt-dlp-ejs` are required for current YouTube JavaScript challenges.

## Zero-cost hosting boundary

The worker needs long-running CPU, FFmpeg, and outbound network access. Railway
and Hugging Face Docker Spaces currently require a paid plan for this workload,
so they are not zero-cost deployment targets.

Zero-cost arrangements to evaluate are:

- Run the container on an existing Mac, PC, NAS, or home server. It processes
  jobs whenever that machine and Docker are running; no inbound port is needed.
- Use Back4app's no-card free container for a constrained private rollout. The
  current `jg-media-worker` deployment uses one 256 MB / 0.25 CPU container,
  short source limits, and a 150 MiB output ceiling. Its public `b4a.run` URL is
  temporary on the free plan, but conversion continues through outbound
  Supabase polling and does not require permanent public ingress.
- Use Northflank's free Developer Sandbox if it remains available without a
  payment method for the owner account. Stop if signup or deployment requests a
  card or paid resource.
- Run it on an Oracle Cloud **Always Free-eligible** Compute instance. Oracle's
  Always Free allocation does not expire, but account creation normally requires
  credit/debit-card identity verification. Select only resources carrying the
  `Always Free-eligible` label and do not upgrade the account.

Do not describe trial credits or a sleeping hobby tier as permanent free
hosting. Provider terms and quotas can change, so recheck the selected plan
before provisioning or recreating the service.

For either arrangement, copy `.env.example` to an untracked `.env`, set
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and keep that file readable only
by the service owner. Never copy the service-role value into source control,
build arguments, logs, or a `NEXT_PUBLIC_*` variable.

Before starting the worker, apply
`supabase/migrations/20260722120000_media_conversion_jobs.sql` to the verified
`jayantgoyal` Supabase project. Set the Supabase global Storage upload limit to
at least the desired `MEDIA_MAX_OUTPUT_BYTES`; the bucket itself is capped at
512 MB by the migration.

After deployment, inspect the logs for a successful Supabase poll and request
`GET /healthz` from the host. It should report `workerAlive: true` with a recent
`lastSuccessfulPollAt`. The worker claims authorized jobs directly from
Supabase, so it does not need a public inbound job-submission endpoint.

The initial Back4App deployment passed this check with HTTP 200, `status: ok`,
and an advancing queue-poll timestamp. The authenticated app dashboard and
recovery identifiers are documented in
[`docs/architecture/media-worker-operations.md`](../../docs/architecture/media-worker-operations.md).

Outputs expire after 60 minutes by default. The worker claims expired jobs,
deletes their Storage objects through the Storage API, and then removes their
database records.

## Test

```bash
python -m unittest discover -s tests -v
```
