# Code quality

Maintainability is enforced through small, reviewable modules and executable
checks. These rules apply to authored TypeScript, JavaScript, JSX/TSX, CSS, and
SCSS files tracked by Git or present as non-ignored worktree files.

## Size and responsibility

- A source file must not exceed **500 physical lines**.
- Files from **401 through 500 lines** pass with a warning and should be split
  before feature work makes them larger.
- Prefer files below 400 lines and components or workflows below 300 lines.
- Split by responsibility, ownership, or lifecycle. Do not cut a cohesive unit
  into arbitrary numbered code fragments solely to satisfy the counter.
- Generated artifacts, lockfiles, SQL migrations, and schema snapshots are not
  authored source modules and follow their own review rules.

`pnpm check:source-health` enforces the hard limit and reports the warning
range. Existing warning-range files are refactoring candidates, not permission
to add unrelated responsibilities.

## Dead code and public surfaces

- Remove unused helpers, imports, exports, files, feature scaffolding, stale
  branches, and obsolete TODO paths in the same change that makes them dead.
- Do not add speculative implementations for possible future products or
  capabilities.
- ESLint rejects unused locals and imports. `pnpm check:dead-code` uses Knip to
  detect unused files, exports, types, and dependencies across workspaces.
- An exception must represent a real non-import entry point, generated
  convention, or manually invoked operation and must be narrowly configured in
  `knip.json` with an explanatory ownership reason in this documentation or the
  adjacent code.

## Function documentation

Exported functions and non-trivial internal functions must explain their
responsibility when the name and types do not fully communicate it. Document
side effects, authorization assumptions, external I/O, mutation, error
behavior, and unusual invariants. Comments should explain **why or what the
contract guarantees**, not restate a TypeScript signature.

Small local callbacks, obvious accessors, and declarative React components do
not need ceremonial comments. Prefer clearer naming and smaller functions over
commenting confusing code.

## General engineering rules

- Keep one direction of dependency: clients depend on packages, never on other
  clients.
- Validate external input and handle every provider/database error.
- Keep secrets and privileged clients server-only; authorize before elevated
  access.
- Add or update tests for changed behavior, including failure and authorization
  paths where relevant.
- Avoid duplicated sources of truth; use registries, contracts, and schema
  snapshots already owned by the system.
- Update central documentation when behavior, structure, ownership, commands,
  or operations change.
