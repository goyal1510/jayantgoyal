# Operational runbooks

These runbooks are current safe response procedures. They are not incident
history and should not contain secret values, personal data, screenshots, or
archived QA evidence.

## Local setup or build failure

1. Confirm Node 22+ and the pnpm version pinned in root `package.json`.
2. Run `pnpm install --frozen-lockfile` when validating a clean dependency
   state; do not edit the lockfile to hide an install failure.
3. Confirm the command uses the workspace name/path from the repository
   inventory.
4. Run `pnpm check:architecture`, `pnpm check-types`, and the failing workspace
   build separately to isolate ownership, types, or bundling.
5. Check only the client's `.env.example` names; do not print `.env.local`.
6. Remove generated caches only when their exact location and recoverability
   are understood; never delete the repository/worktree broadly.

## Quality workflow failure

1. Identify the exact failed command and commit from GitHub Actions.
2. Reproduce the command in a clean/current worktree.
3. If architecture/docs checks fail, correct the ownership or documented
   inventory rather than weakening the checker without a reviewed reason.
4. If dead-code fails, confirm whether the export/dependency is a real manual
   entry point before adding an ignore.
5. If build fails after types pass, inspect framework configuration, generated
   routes, environment availability, and bundle output.
6. Rerun the focused failure, then the full required gate set.

## Production deployment failure

1. Confirm which client project and source commit failed.
2. Check whether the ignored-build step selected or skipped the project.
3. Compare the Vercel root directory and build command with the deployment
   guide.
4. Check missing variable names only; never copy values into logs/chat.
5. If the source is bad, revert the responsible commit and deploy the coherent
   repository state. If the build was transient, redeploy the same revision.
6. Verify GitHub Quality, deployment `Ready`, and representative canonical
   routes after recovery.

## Auth entry or return failure

1. Record the product origin, requested relative path, environment class, and
   safe error code—never the session/callback code.
2. Confirm Auth, Studio/Admin, and Supabase variables are present in the
   correct projects.
3. Verify `NEXT_PUBLIC_AUTH_SESSION_MODE`, hostname, secure/local cookie
   behavior, and exact Preview return-origin allowlist.
4. Check whether the callback is canonical or an intended compatibility alias.
5. Test `/welcome` to a simple protected Studio route, then Admin admission for
   an authorized account.
6. Do not broaden origin matching or disable MFA/capability checks to restore
   access.

## Portfolio content failure

1. Determine whether the failure is a Supabase query, missing required
   singleton, contract validation, or rendering error.
2. Check `portfolio` RLS and selected columns against
   `@jayantgoyal/portfolio-contracts` and the current snapshot.
3. Confirm `hero`, `about`, and `contact` singleton records exist without
   printing their content.
4. Validate Admin writes and revalidation only after authorization.
5. Do not introduce a static duplicate content fallback; restore the canonical
   data/contract or revert the incompatible change.

## Contact delivery failure

1. Check whether the API returned validation, rate limit, configuration,
   database limiter, or provider delivery class.
2. Verify variable presence in Portfolio only, without displaying values.
3. Verify `portfolio.consume_contact_rate_limit` exists and is callable.
4. Check Resend provider state and sender authorization.
5. Keep fail-closed rate limiting. Do not log the full enquiry to diagnose
   delivery.

## Studio workspace data failure

1. Identify the capability and current user-owned table/bucket.
2. Confirm the request passed current Studio membership, MFA, recovery, and
   versioned terms policy.
3. Verify the API selects `studio` explicitly and handles its Supabase error.
4. Check RLS/object ownership before considering elevated access.
5. For File Manager, reconcile metadata and Storage object state using only
   authorized paths; do not list other users' objects.
6. For games, inspect session status, membership, move number, and turn owner
   before retrying an action.

## Provider feature failure

1. Limit the blast radius to the owning feature.
2. Classify missing configuration, authentication/scope, validation, rate
   limit/quota, provider outage, and unexpected response.
3. Use the defined cached/fallback/unavailable response.
4. Rotate a credential when compromise—not ordinary expiry/failure—is
   suspected.
5. Verify the feature after recovery and ensure unrelated product routes remain
   healthy.

## Suspected credential exposure

1. Revoke or rotate the credential at Supabase/provider/Vercel immediately.
2. Identify only the consuming clients from the environment reference.
3. Remove the exposure from current source/config and inspect Git history.
4. Treat a committed secret as exposed even after deletion from the latest
   revision.
5. Redeploy affected clients with rotated values and verify safe behavior.
6. Review logs for misuse while avoiding further dissemination of the value.

## Database migration check or drift

1. Verify the authenticated Supabase account, project name, and reference.
2. Run `pnpm db:migrations:check` and inspect both local and remote versions.
3. Stop on unexplained local-only/remote-only drift; do not repair history or
   run blanket migration up.
4. Review proposed SQL and use the dedicated disposable migration workflow only
   after approval.
5. After apply, refresh/review every affected canonical schema snapshot, remove
   pooler URL state, run database/application tests, and update the schema
   catalog.

## Direct-to-main shipping

1. Work in the approved worktree, not the protected source clone.
2. Fetch `origin/main` and verify it is an ancestor of the branch.
3. Run relevant full validation, production build for app changes, and a
   security/secrets/generated-artifact review.
4. Stage explicit paths, review the staged diff, and create cohesive
   conventional commits.
5. Fetch and verify base freshness again, then push the reviewed commit to
   `main` as explicitly authorized for this repository.
6. Verify GitHub Quality, affected Vercel projects, and production smoke routes.
