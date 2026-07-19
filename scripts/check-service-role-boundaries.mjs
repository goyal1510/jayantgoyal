import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sourceRoots = ["apps/admin/src", "apps/studio/src", "apps/portfolio/src"];
const clientDirective = /^\s*["']use client["'];?/m;
const serviceRolePattern =
  /SUPABASE_SERVICE_ROLE_KEY|createSupabaseAdminClient|supabase\/admin|@repo\/auth\/service-role/;
const violations = [];

function walk(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

for (const sourceRoot of sourceRoots) {
  for (const file of walk(join(root, sourceRoot))) {
    const source = readFileSync(file, "utf8");

    if (clientDirective.test(source) && serviceRolePattern.test(source)) {
      violations.push(`${file}: client modules cannot access service-role Supabase code`);
    }

    if (sourceRoot === "apps/portfolio/src" && /SUPABASE_SERVICE_ROLE_KEY/.test(source)) {
      violations.push(`${file}: Portfolio cannot reference the service-role credential`);
    }
  }
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("Service-role boundaries are clean: credentials remain server-only and Portfolio-free.");
