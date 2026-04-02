Ship the current changes to the main branch.

## Steps

1. Run `git status` to see all modified and untracked files.
2. Run `git diff` to review staged and unstaged changes.
3. Run `git log --oneline -5` to match existing commit message style.
4. Stage only the relevant files by name — never use `git add -A` or `git add .`.
5. Write a concise commit message summarizing the "why" not the "what". Follow the existing commit style from the log.
6. Commit under the user's name — do NOT add any Co-Authored-By lines.
7. Push to `origin main`.
8. Confirm success with the commit hash.

## Rules

- Never commit files that contain secrets (`.env`, credentials, etc.).
- If there are no changes to commit, say so and stop.
- Always show the user what will be committed before committing.
- Use a HEREDOC for the commit message to preserve formatting.
