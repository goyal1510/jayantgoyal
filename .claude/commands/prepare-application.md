Pre-fill **every field** of a job's actual application form so the user can copy-paste straight into the form. This is the main "I'm ready to apply" workflow.

## Arguments

`$ARGUMENTS` — listing UUID (required). The listing the user wants to apply to right now.

If `$ARGUMENTS` is empty, ask the user which listing. Don't guess.

## What this does

1. Reads `docs/resume.md` (especially the **Standard Form Answers** appendix at the bottom — that's the canonical source for identity, work auth, employment history, education, demographics defaults).
2. Calls `node scripts/jobs/fetch-form.mjs <id>` to grab the live application form schema for that listing.
3. For every form field, generates the right answer (text, select-option label, file path, demographic decline, etc.).
4. Persists the full Q&A array to `jg_app.job_listings.ai_application_qa` so the admin UI shows it.
5. Bumps the listing's application status/priority appropriately and sets a `next_action_note` like "Form prepped — ready to submit".

## Steps

1. Read `docs/resume.md` end-to-end. Pay special attention to the **Standard Form Answers** section.
2. Read the listing's JD: pull `description_text` from the fetch-form output's `listing` block. Use it for "Why us / why this role" if those questions appear.
3. Run:
   ```bash
   node scripts/jobs/fetch-form.mjs $ARGUMENTS > /tmp/form-${ARGUMENTS}.json
   ```
   Parse the JSON.
4. **If `format === "fallback_html"`** (Lever, HN, manual saves, etc.):
   - Use the WebFetch tool with `apply_url` and a prompt like:
     "List every form field on this page. For each field, return JSON with: `label` (visible label), `name` (HTML name attribute or best guess), `type` (text/email/tel/textarea/select/file/checkbox/radio), `required` (boolean), `values` (array of options if select/radio, else null)."
   - Use the WebFetch result as the field list.
   - If WebFetch returns no recognizable form (page is JS-heavy or behind login), report this to the user and stop. They'll have to add fields manually via the admin UI's "Add question".
5. **For each field in the schema**, build a Q&A item:
   ```json
   {
     "question": "<field label exactly>",
     "answer": "<value or null>",
     "field_name": "<form field name>",
     "field_type": "<input_text | textarea | multi_value_single_select | input_file | ...>",
     "field_group": "main" | "location" | "demographic" | "compliance",
     "required": true|false,
     "values": [{"value":"...","label":"..."}] | null,
     "category": "form_prefill"
   }
   ```
   Answer rules:
   - **Plain text fields** (input_text, input_email, input_tel): use the matching row in resume.md's Standard Form Answers. If no clear match, draft based on JD context.
   - **Textareas**: if the field is "Cover Letter" or similar, paste the listing's `ai_cover_letter` from DB. If "Resume/CV", paste the body of resume.md (without the form-answers appendix). If a custom essay (e.g. "Tell us about a project"), draft fresh based on resume + JD, ~120-180 words, anchored to one resume bullet plus one JD detail.
   - **`multi_value_single_select`**: pick the **exact option label** from the `values` array that matches the user's profile. Common picks:
     - Country residence → label that equals or contains "India"
     - Authorized to work? → "Yes" if the role is India, "No" otherwise
     - Need sponsorship? → "No" for India roles, "Yes" for non-India
     - Plan to work remotely? → "Yes" if listing.is_remote, "No" otherwise
     - Previously employed by [this company]? → "No"
     - WhatsApp opt-in / similar comms → "Yes"
     - Demographics (gender/race/ethnicity/veteran/disability/LGBT) → the closest "Decline / Prefer not to say / I don't wish to answer" option
     - Currency → "Indian Rupees (INR)"
   - **`multi_value_multi_select`**: array of matching labels. Country list usually answer is just `["India"]`.
   - **`input_file`**: answer = `Upload: apps/jayantgoyal/public/assets/Jayant_Resume.pdf` (or for cover letter: `Upload: docs/applications/<date>/<priority>/<slug>/cover_letter.md` — convert to PDF before submit).
   - **`input_hidden`** (Longitude/Latitude): leave `answer: null`, set `note: "Auto-filled by browser geolocation"`.
   - **Required field with no good match**: set `answer: null`, `needs_answer: true`, `note: "<why no clear answer>"`. The user will see it as pending in the UI.
6. **Custom essay questions** specific to the role: if a question references the JD or asks for a specific story, draft fresh (~120-180 words). Anchor to ONE resume bullet (NeuraOak / HighRadius / portfolio) + ONE JD detail. No generic boilerplate.
7. **Persist** via save-ai-result.mjs:
   ```json
   [{
     "listing_id": "$ARGUMENTS",
     "ai_application_qa": [ ... full array of items ... ],
     "application": {
       "status": "interested",
       "priority": "high",
       "next_action_note": "Form prepped — see Application Q&A panel; ready to submit"
     }
   }]
   ```
   Pipe via `cat /tmp/payload-${ARGUMENTS}.json | node scripts/jobs/save-ai-result.mjs`.
8. **Report inline** to the user (concise):
   - One-liner: "Prepped N fields for [Company] — [Role]. M required fields, K demographics."
   - Highlight any items where `needs_answer: true` so the user knows what they still need to answer.
   - Note any fields that need manual upload (resume PDF, cover letter PDF).
   - Suggest opening `/jobs/listings`, expanding the listing, and copying field-by-field.

## File upload notes

- The current resume PDF lives at `apps/jayantgoyal/public/assets/Jayant_Resume.pdf`.
- For cover letter PDF: many forms require PDF, not text. Easiest path for now — answer says `Upload: cover_letter.md (convert to PDF: open in any markdown viewer or copy text into Google Docs and download as PDF)`. Don't try to generate a PDF in this command.

## Don'ts

- Don't fabricate experience, skills, or projects beyond what `docs/resume.md` claims.
- Don't disclose demographic info unless the user explicitly asked. Default to "Decline".
- Don't fill "Current CTC" — leave it blank with a `note` for the user to fill manually (negotiation hygiene).
- Don't fill referral name fields unless the user has provided a referral.
- Don't pre-answer questions that aren't in the form. Only the actual fields.
- Don't write a generic answer to "Why us?" — every cover-letter-style answer must reference one concrete JD detail.

## After running

Tell the user: "Open `/jobs/listings`, expand `[Title] @ [Company]`, scroll to **Application Q&A**. Copy each answer into the matching field on `<apply_url>`. Required fields are flagged. Don't forget to upload the resume PDF."
