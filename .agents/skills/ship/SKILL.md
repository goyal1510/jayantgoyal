---
name: ship
description: Ship current changes directly to main — stage, commit, push. No feature branches or PRs (solo development workflow).
argument-hint: [commit message hint]
user-invocable: true
allowed-tools: Bash(git *), Read, Glob, Grep
---

# Ship It — Direct to Main

Ship changes directly to `main` for this solo-development repo. No feature branches, no PRs.

## Arguments

- `$ARGUMENTS` (optional): A hint for the commit message. If not provided, infer from the changes.

## Workflow

Follow these steps **strictly in order**. Stop and report if any step fails.

### Step 1: Assess the current state

Run these commands in parallel:

```bash
git status
git diff --staged
git diff
git log --oneline -5
```

- If there are **no changes** (no staged, unstaged, or untracked files), stop and tell the user there is nothing to ship.

### Step 2: Stage files

- Review all changed/untracked files carefully.
- **Do NOT stage** files that look like secrets (`.env`, credentials, tokens) or build artifacts (`node_modules`, `.next`, `dist`). Warn the user if such files are present.
- Stage the relevant files by name (never use `git add -A` or `git add .`):
  ```bash
  git add <file1> <file2> ...
  ```

### Step 3: Commit

- Analyze the staged diff to write a commit message.
- If `$ARGUMENTS` was provided, use it as a starting point for the message.
- Match the existing commit style from `git log`.
- Write a concise message summarizing the **why** not the **what**.
- Keep the subject line under 72 characters.
- **Do NOT add any Co-Authored-By lines** — commit under the user's name only.
- Commit using a HEREDOC:
  ```bash
  git commit -m "$(cat <<'EOF'
  Subject line here
  EOF
  )"
  ```

### Step 4: Push to origin

```bash
git push origin main
```

### Step 5: Report back

Display:
- The commit hash
- A short summary of what was shipped

## Rules

- NEVER force push
- NEVER commit secrets or environment files
- NEVER amend existing commits
- NEVER skip git hooks (no `--no-verify`)
- NEVER add Co-Authored-By lines
- NEVER create feature branches or PRs — this repo ships direct to main
- Always show the user what will be committed before committing
- If there are merge conflicts, stop and ask the user for guidance
