Fix a GitHub issue for this repository.

## Arguments
$ARGUMENTS should be a GitHub issue number.

## Steps

1. Run `gh auth switch --user goyal1510` then `gh issue view $ARGUMENTS` to read the issue details.
2. Understand the problem described in the issue.
3. Explore the relevant code to find the root cause.
4. Implement the fix following project conventions from CLAUDE.md.
5. Run `pnpm check-types --filter jg` and `pnpm lint` to verify.
6. Summarize what was changed and why.
