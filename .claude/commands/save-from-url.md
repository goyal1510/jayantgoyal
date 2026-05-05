Capture a job from any URL (LinkedIn, custom careers page, anything) into `jg_app.job_listings` so it joins the pipeline.

## Arguments

`$ARGUMENTS` is the URL of the job posting.

## Steps

1. Use the `WebFetch` tool with the URL and a prompt like:
   "Extract the following fields as JSON: title, company, location, is_remote (boolean — usually true if 'remote' in posting), salary_text (raw), tags (array of stack/role keywords), description_text (plain text, ~1500 chars max), posted_at (ISO 8601 if shown). Return only JSON."
2. Validate the extracted JSON has at least `title`, `company`, `apply_url` (= input URL).
3. Ensure the manual `job_sources` row exists. If not, create one:
   ```bash
   node -e "import('./scripts/jobs/lib/supabase.mjs').then(async ({select, upsert}) => {
     const existing = await select('job_sources', \"kind=eq.lever&label=eq.manual-saves&select=id\");
     if (!existing || existing.length === 0) {
       await upsert('job_sources', [{kind:'lever', label:'manual-saves', config:{manual:true,name:'Manual saves'}, is_active:false}], {onConflict:'kind,label'});
     }
   })"
   ```
   (Using `kind: 'lever'` only because we need a valid enum value; the `is_active:false` keeps the cron from touching it. The label `manual-saves` is the convention.)
4. Insert the listing:
   ```bash
   node -e "import('./scripts/jobs/lib/supabase.mjs').then(async ({select, upsert}) => {
     const src = await select('job_sources', \"kind=eq.lever&label=eq.manual-saves&select=id\");
     await upsert('job_listings', [{
       source_id: src[0].id,
       external_id: '<sha256 of URL or use URL itself, max 200 chars>',
       title: '<title>',
       company: '<company>',
       location: '<location>',
       is_remote: <bool>,
       is_india: <true if India keywords detected, else false>,
       salary_text: '<salary>',
       description_text: '<description>',
       apply_url: '<URL>',
       tags: <tags>,
       posted_at: '<iso or null>',
       raw: { manual: true, source_url: '<URL>' }
     }], {onConflict:'source_id,external_id'});
   })"
   ```
5. Take the new listing's id (re-query if needed) and immediately run the scoring portion of `/apply-job <id>` so the user sees the AI verdict in the same turn.
6. Confirm in chat: "Saved as listing `<id>`, score `<n>`, see `<file path>`."

## When to use

- User found a job on LinkedIn or another portal we don't ingest
- User wants a single one-off opportunity tracked in their pipeline
