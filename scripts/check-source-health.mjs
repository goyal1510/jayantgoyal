import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const SOFT_LINE_LIMIT = 400;
const HARD_LINE_LIMIT = 500;
const SOURCE_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".js",
  ".jsx",
  ".mjs",
  ".scss",
  ".ts",
  ".tsx",
]);

/** Return the final extension used to classify an authored source file. */
function sourceExtension(file) {
  const dot = file.lastIndexOf(".");
  return dot === -1 ? "" : file.slice(dot);
}

/** Count physical lines consistently, without treating a final newline as code. */
function physicalLineCount(file) {
  const content = readFileSync(file, "utf8");
  if (content.length === 0) return 0;
  return content.endsWith("\n")
    ? content.slice(0, -1).split(/\r?\n/).length
    : content.split(/\r?\n/).length;
}

/** List tracked and untracked authored files while respecting Git ignore rules. */
function sourceFiles() {
  return execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean)
    .filter((file) => existsSync(file))
    .filter((file) => SOURCE_EXTENSIONS.has(sourceExtension(file)))
    .filter((file) => !file.endsWith(".d.ts"));
}

const results = sourceFiles()
  .map((file) => ({ file, lines: physicalLineCount(file) }))
  .filter(({ lines }) => lines > SOFT_LINE_LIMIT)
  .sort((left, right) => right.lines - left.lines);

const failures = results.filter(({ lines }) => lines > HARD_LINE_LIMIT);
const warnings = results.filter(({ lines }) => lines <= HARD_LINE_LIMIT);

warnings.forEach(({ file, lines }) => {
  console.warn(`WARN ${file}: ${lines} lines; split before it exceeds 500.`);
});

failures.forEach(({ file, lines }) => {
  console.error(
    `FAIL ${file}: ${lines} lines; authored source must be <= 500.`,
  );
});

if (failures.length > 0) {
  console.error(
    `Source health failed with ${failures.length} file(s) over ${HARD_LINE_LIMIT} lines.`,
  );
  process.exit(1);
}

console.log(
  `Source health passed: no authored source file exceeds ${HARD_LINE_LIMIT} lines (${warnings.length} warning(s) over ${SOFT_LINE_LIMIT}).`,
);
