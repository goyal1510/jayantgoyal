import { createToolReference } from "./create-tool-reference";
import type { ToolReferenceRegistry } from "./types";

export const codeDevToolReferences = {
  "/tools/code-dev-tools/git-cheatsheet": createToolReference(
    "/tools/code-dev-tools/git-cheatsheet",
    {
      summary:
        "Browse commonly used Git commands for repository setup, daily changes, branches, history, remotes, and recovery workflows.",
      useCases: [
        "Recall syntax during everyday Git work.",
        "Find a starting command before consulting detailed documentation.",
      ],
      examples: [
        "Look up how to create and switch branches.",
        "Review commands for inspecting commits and working-tree changes.",
      ],
      considerations:
        "Understand a command's effect before running it, especially reset, clean, rebase, force-push, and history-rewriting operations.",
    },
  ),
  "/tools/code-dev-tools/regex-tester": createToolReference(
    "/tools/code-dev-tools/regex-tester",
    {
      summary:
        "Test a regular expression against sample text before using it in validation, search, parsing, or transformation code.",
      useCases: [
        "Debug form-validation patterns.",
        "Experiment with capture groups and flags against representative text.",
      ],
      examples: [
        "Test a date pattern against valid and invalid samples.",
        "Inspect capture groups in a log-line parser.",
      ],
      considerations:
        "Regex syntax and behavior vary by engine, flags, escaping, and multiline rules. Test in the same runtime and avoid catastrophic backtracking.",
    },
  ),
  "/tools/code-dev-tools/regex-cheatsheet": createToolReference(
    "/tools/code-dev-tools/regex-cheatsheet",
    {
      summary:
        "Review JavaScript regular-expression syntax for character classes, groups, anchors, quantifiers, assertions, and replacement patterns.",
      useCases: [
        "Recall syntax while writing a pattern.",
        "Compare similar tokens before updating validation code.",
      ],
      examples: [
        "Look up the difference between greedy and lazy quantifiers.",
        "Find syntax for named groups or word boundaries.",
      ],
      considerations:
        "Cheatsheet examples are concise and may not cover runtime support, Unicode behavior, escaping layers, or performance implications.",
    },
  ),
  "/tools/code-dev-tools/chmod-calculator": createToolReference(
    "/tools/code-dev-tools/chmod-calculator",
    {
      summary:
        "Translate Unix read, write, and execute permissions between symbolic controls, octal notation, and chmod command examples.",
      useCases: [
        "Understand a copied permission mode.",
        "Draft permissions for a local script or directory.",
      ],
      examples: [
        "Convert rwxr-xr-x into 755.",
        "Build a chmod command for an executable script.",
      ],
      considerations:
        "Ownership, groups, ACLs, umask, special bits, and directory semantics also affect access. Avoid overly broad modes such as 777 without a clear reason.",
    },
  ),
  "/tools/code-dev-tools/docker-converter": createToolReference(
    "/tools/code-dev-tools/docker-converter",
    {
      summary:
        "Translate a docker run command into a Docker Compose starting point for repeatable local services and development environments.",
      useCases: [
        "Convert an exploratory container command into versioned configuration.",
        "Make ports, volumes, environment variables, and restart behavior easier to review.",
      ],
      examples: [
        "Convert a database docker run command into a Compose service.",
        "Translate volume and port flags into YAML fields.",
      ],
      considerations:
        "Review quoting, secrets, networks, health checks, dependencies, platform settings, and unsupported flags before relying on generated Compose output.",
    },
  ),
  "/tools/code-dev-tools/http-status-codes": createToolReference(
    "/tools/code-dev-tools/http-status-codes",
    {
      summary:
        "Look up standard HTTP response codes, names, and meanings while designing APIs, debugging requests, and documenting error handling.",
      useCases: [
        "Choose an appropriate API response status.",
        "Interpret a status found in browser or server logs.",
      ],
      examples: [
        "Compare 401 Unauthorized with 403 Forbidden.",
        "Review when 204 No Content is appropriate.",
      ],
      considerations:
        "A status code alone does not describe the full response contract. Check the current HTTP specification, headers, method semantics, and application error body.",
    },
  ),
  "/tools/code-dev-tools/json-diff": createToolReference(
    "/tools/code-dev-tools/json-diff",
    {
      summary:
        "Compare two JSON values and identify structural or value differences in API responses, configuration, fixtures, and snapshots.",
      useCases: [
        "Review changes between response versions.",
        "Debug a failing JSON fixture or configuration update.",
      ],
      examples: [
        "Compare staging and local API samples.",
        "Find changed keys in two configuration objects.",
      ],
      considerations:
        "Decide whether array ordering, key ordering, numeric representation, and missing-versus-null values should be treated as meaningful differences.",
    },
  ),
  "/tools/code-dev-tools/crontab-generator": createToolReference(
    "/tools/code-dev-tools/crontab-generator",
    {
      summary:
        "Build and validate five-field cron expressions while reading a plain-language description of the resulting recurring schedule.",
      useCases: [
        "Draft schedules for scripts and background jobs.",
        "Check a cron expression before adding it to infrastructure or CI.",
      ],
      examples: [
        "Create 0 9 * * 1 for Monday at 9:00.",
        "Use */15 * * * * for a task that runs every fifteen minutes.",
      ],
      considerations:
        "Cron implementations, timezones, daylight-saving behavior, supported extensions, and execution environments vary. Test in the target scheduler.",
    },
  ),
  "/tools/code-dev-tools/keycode-info": createToolReference(
    "/tools/code-dev-tools/keycode-info",
    {
      summary:
        "Inspect browser keyboard-event values such as key, code, location, and active modifiers while implementing shortcuts and input handling.",
      useCases: [
        "Debug a keyboard shortcut in a web application.",
        "Compare physical key codes with produced character values.",
      ],
      examples: [
        "Inspect the event for Enter or Escape.",
        "Check modifier values for a platform shortcut.",
      ],
      considerations:
        "Keyboard layouts, input methods, browser behavior, accessibility tools, and deprecated keyCode values can differ. Prefer modern key and code fields appropriately.",
    },
  ),
} satisfies ToolReferenceRegistry;
