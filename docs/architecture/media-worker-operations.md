# Media Worker Operations And Recovery

The Media Converter is designed so that no durable production dependency lives
only on a developer laptop. Local Docker images and build cache are disposable;
the checked-in Dockerfile is the rebuild recipe.

## Sources Of Truth

| Concern                          | Durable source                               |
| -------------------------------- | -------------------------------------------- |
| Studio UI and API                | GitHub repository                            |
| Worker code and image recipe     | `apps/media-worker` in GitHub                |
| Python dependency versions       | `apps/media-worker/requirements.txt`         |
| Database schema                  | `supabase/migrations` and `supabase/schemas` |
| Queued jobs and temporary output | Supabase project `jayantgoyal`               |
| Studio production variables      | Vercel project `jayantgoyal-studio`          |
| Worker runtime variables         | Container hosting service                    |
| Secret recovery copy             | Owner-managed password manager               |

Generated media is intentionally temporary and is not part of disaster
recovery. Completed objects expire after the configured retention period.

## Required Worker Variables

Store values in the hosting service's encrypted runtime-variable settings. Do
not put values in Git, Docker build arguments, screenshots, logs, or variables
whose names begin with `NEXT_PUBLIC_`.

| Variable                     | Recovery source                                          |
| ---------------------------- | -------------------------------------------------------- |
| `SUPABASE_URL`               | Supabase project settings                                |
| `SUPABASE_SERVICE_ROLE_KEY`  | Supabase API settings or a rotated replacement           |
| `SUPABASE_STORAGE_URL`       | Optional; derive from `SUPABASE_URL` when omitted        |
| `MEDIA_STORAGE_BUCKET`       | Repository migration; currently `media-converter-output` |
| `MEDIA_POLL_SECONDS`         | Operational choice                                       |
| `MEDIA_RETENTION_MINUTES`    | Operational choice                                       |
| `MEDIA_MAX_DURATION_SECONDS` | Operational choice                                       |
| `MEDIA_MAX_OUTPUT_BYTES`     | Must not exceed the bucket's 512 MiB limit               |
| `YOUTUBE_COOKIES_BASE64`     | Optional encrypted owner backup; otherwise leave empty   |
| `LOG_LEVEL`                  | Operational choice; normally `INFO`                      |
| `PORT`                       | Hosting service port; normally `8080`                    |

For a constrained free container, start with one worker replica and:

```env
MEDIA_POLL_SECONDS=5
MEDIA_RETENTION_MINUTES=60
MEDIA_MAX_DURATION_SECONDS=900
MEDIA_MAX_OUTPUT_BYTES=157286400
LOG_LEVEL=INFO
PORT=8080
```

## Git-Connected Deployment

The preferred deployment builds directly from GitHub, so no Docker registry is
required.

1. Connect the personal `goyal1510/jayantgoyal` repository.
2. Select the reviewed deployment branch. Change it to `main` after the feature
   PR is merged.
3. Set the service root directory to `apps/media-worker`.
4. Build from `apps/media-worker/Dockerfile`.
5. Expose port `8080` and set the health path to `/healthz`.
6. Add the required runtime variables through the provider's secret settings.
7. Keep exactly one replica so only one consumer claims queue work.
8. Deploy, inspect logs for a successful Supabase poll, and confirm `/healthz`
   reports `workerAlive: true` with a recent `lastSuccessfulPollAt`.

Do not add a payment method or choose a paid resource when the deployment is
intended to remain zero cost. Free-provider limits can change; verify the plan
label before recreating the service.

## Laptop Reset Recovery

1. Restore the machine using the canonical setup guide in the repository's
   global `AGENTS.md` instructions.
2. Clone `goyal1510/jayantgoyal` and install the pinned workspace dependencies.
3. Pull Studio variables from the linked Vercel project:

   ```bash
   cd apps/studio
   pnpm exec vercel link --yes --project jayantgoyal-studio
   pnpm exec vercel env pull .env.local
   ```

4. Log in to Supabase, Vercel, and the worker host using the owner's account and
   recovery codes. The remote worker continues running during a laptop reset.
5. If local worker testing is needed, recreate an ignored `.env` from
   `.env.example`, restore secrets from their authoritative dashboards or the
   password manager, and rebuild:

   ```bash
   cd apps/media-worker
   docker build -t jg-media-worker .
   docker run --rm --env-file .env -p 8080:8080 jg-media-worker
   ```

6. Confirm the linked Supabase project is `jayantgoyal`
   (`orwfvyditlguqvxvztkw`) before any database operation.

Local Docker images do not sync between computers. Rebuilding them is expected
and does not affect the image already running on the hosting platform.

## Recreate Or Move The Worker

If the hosting project is deleted or a free plan is withdrawn, create one
replacement service from the same GitHub directory and variables, verify its
polling health, then delete the old service. Studio and Supabase do not need to
change because the worker initiates all queue traffic outbound.

If the replacement host sleeps, configure Studio's server-only
`MEDIA_WORKER_WAKE_URL` and `MEDIA_WORKER_WAKE_TOKEN`. Leave both unset for an
always-on host.

## Safe Decommission

1. Disable new Media Converter access in Studio or remove the owner allowlist.
2. Wait for active jobs to finish or mark them failed after review.
3. Delete the worker service and revoke or rotate the service-role credential
   it used.
4. Remove expired objects from `media-converter-output`.
5. Keep the migration history and code in Git; do not rewrite applied Supabase
   migration history merely because the worker is offline.
