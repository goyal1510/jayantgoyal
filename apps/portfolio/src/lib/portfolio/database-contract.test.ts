import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATION_SUFFIX = "_harden_portfolio_foundation.sql";
const CONTENT_MIGRATION_SUFFIX = "_reposition_portfolio_content.sql";
const NAVIGATION_MIGRATION_SUFFIX = "_refine_primary_navigation.sql";
const CASE_STUDY_MIGRATION_SUFFIX = "_add_project_case_studies.sql";
const OPPORTUNITY_MIGRATION_SUFFIX = "_qualify_portfolio_opportunities.sql";
const PRESENTATION_MIGRATION_SUFFIX = "_transactional_section_presentation.sql";
const RATE_LIMIT_MIGRATION_SUFFIX = "_persist_contact_rate_limits.sql";
const STORAGE_MIGRATION_SUFFIX = "_harden_private_file_storage.sql";
const GAME_ACTION_MIGRATION_SUFFIX = "_transactional_game_actions.sql";
const GAME_CONFLICT_MIGRATION_SUFFIX = "_fix_game_action_conflict_code.sql";
const NAMING_MIGRATION_SUFFIX = "_rename_portfolio_work_writing_activity.sql";

async function readMigrationBySuffix(suffix: string) {
  const migrationsDirectory = resolve(process.cwd(), "supabase/migrations");
  const migrationFiles = (await readdir(migrationsDirectory)).sort();
  const migrationFile = migrationFiles.find((file) => file.endsWith(suffix));

  expect(migrationFile).toBeDefined();
  if (!migrationFile) throw new Error(`Migration missing: ${suffix}`);

  return readFile(resolve(migrationsDirectory, migrationFile), "utf8");
}

async function readFoundationMigration() {
  const migrationsDirectory = resolve(process.cwd(), "supabase/migrations");
  const migrationFiles = (await readdir(migrationsDirectory)).sort();
  const migrationIndex = migrationFiles.findIndex((file) =>
    file.endsWith(MIGRATION_SUFFIX),
  );

  expect(migrationIndex).toBeGreaterThanOrEqual(0);

  const migrationFile = migrationFiles[migrationIndex];
  if (!migrationFile) throw new Error("Portfolio foundation migration missing");

  const foundationSql = await readFile(
    resolve(migrationsDirectory, migrationFile),
    "utf8",
  );
  const laterSql = (
    await Promise.all(
      migrationFiles
        .slice(migrationIndex + 1)
        .map((file) => readFile(resolve(migrationsDirectory, file), "utf8")),
    )
  ).join("\n");

  return { foundationSql, laterSql };
}

describe("Portfolio database foundation migration", () => {
  it("removes the caller-controlled session RPCs without reintroducing them", async () => {
    const { foundationSql, laterSql } = await readFoundationMigration();

    expect(foundationSql).toContain(
      "drop function if exists jg_account.list_user_sessions(uuid);",
    );
    expect(foundationSql).toContain(
      "drop function if exists jg_account.revoke_other_sessions(uuid, uuid);",
    );
    expect(foundationSql).toContain(
      "drop function if exists jg_account.revoke_session(uuid, uuid);",
    );
    expect(laterSql).not.toMatch(
      /create\s+(?:or\s+replace\s+)?function\s+jg_account\.(?:list_user_sessions|revoke_other_sessions|revoke_session)/i,
    );
  });

  it("keeps hidden-section copy available to the complete typed CMS contract", async () => {
    const { foundationSql } = await readFoundationMigration();

    expect(foundationSql).toMatch(
      /create policy "Public read access"\s+on portfolio\.section_content\s+for select\s+to anon, authenticated\s+using \(true\);/i,
    );
  });

  it("adds Resume to the managed public navigation contract", async () => {
    const { foundationSql } = await readFoundationMigration();

    expect(foundationSql).toContain("'resume'");
    expect(foundationSql).toContain("'Resume'");
  });

  it("keeps public positioning claims aligned with the implementation", async () => {
    const contentSql = await readMigrationBySuffix(CONTENT_MIGRATION_SUFFIX);

    expect(contentSql).toContain(
      "I build ambitious SaaS products from first question to production.",
    );
    expect(contentSql).toContain("87 generators, converters");
    expect(contentSql).toContain("'Sync Scratchpad'");
    expect(contentSql).toContain(
      "payments, order processing, and administration remain future work",
    );
    expect(contentSql).toMatch(
      /'currency-calculator'[\s\S]+?7,\s+false[\s\S]+?'weather'[\s\S]+?8,\s+false/,
    );
  });

  it("keeps the primary navigation focused on high-intent destinations", async () => {
    const navigationSql = await readMigrationBySuffix(
      NAVIGATION_MIGRATION_SUFFIX,
    );

    expect(navigationSql).toContain("where section_id = 'resume';");
    expect(navigationSql).toContain("section_id in ('skills', 'experience', 'activity')");
    expect(navigationSql).toMatch(
      /where section_id = 'resume';[\s\S]+?commit;/,
    );
  });

  it("publishes complete case studies through a validated CMS contract", async () => {
    const caseStudySql = await readMigrationBySuffix(
      CASE_STUDY_MIGRATION_SUFFIX,
    );

    expect(caseStudySql).toContain("add column case_study jsonb");
    expect(caseStudySql).toContain(
      "add column case_study_published boolean not null default false",
    );
    expect(caseStudySql).toContain(
      "portfolio.is_complete_project_case_study(case_study)",
    );
    expect(caseStudySql).toMatch(
      /where slug = 'tech-tools';[\s\S]+?where slug = 'file-manager';[\s\S]+?where slug = 'game-hub';/,
    );
  });

  it("keeps current CMS vocabulary aligned with public destinations", async () => {
    const destinationsSql = await readMigrationBySuffix(NAMING_MIGRATION_SUFFIX);

    expect(destinationsSql).toContain("when 'projects' then 'work'");
    expect(destinationsSql).toContain("when 'github' then 'activity'");
    expect(destinationsSql).toContain("when 'blog' then 'writing'");
    expect(destinationsSql).toContain("alter table portfolio.projects rename to work");
    expect(destinationsSql).toContain("alter table jg_app.blog_posts rename to writing_posts");
    expect(destinationsSql).not.toContain("JG Platform");
  });

  it("positions contact around qualified product opportunities", async () => {
    const opportunitySql = await readMigrationBySuffix(
      OPPORTUNITY_MIGRATION_SUFFIX,
    );

    expect(opportunitySql).toContain("Have a product that needs an owner?");
    expect(opportunitySql).toContain(
      "turn ambiguous briefs into secure, dependable software",
    );
    expect(opportunitySql).toContain("where section_key = 'contact'");
  });

  it("saves section copy and navigation in one database transaction", async () => {
    const presentationSql = await readMigrationBySuffix(
      PRESENTATION_MIGRATION_SUFFIX,
    );

    expect(presentationSql).toContain(
      "function portfolio.save_section_presentation",
    );
    expect(presentationSql).toContain("on conflict (section_key) do update");
    expect(presentationSql).toContain("on conflict (section_id) do update");
    expect(presentationSql).toContain("to service_role");
  });

  it("persists contact throttling without exposing raw network identifiers", async () => {
    const rateLimitSql = await readMigrationBySuffix(
      RATE_LIMIT_MIGRATION_SUFFIX,
    );

    expect(rateLimitSql).toContain(
      "create table portfolio.contact_rate_limits",
    );
    expect(rateLimitSql).toContain(
      "function portfolio.consume_contact_rate_limit",
    );
    expect(rateLimitSql).toContain("security definer");
    expect(rateLimitSql).toContain("attempts between 1 and 6");
    expect(rateLimitSql).toContain("to anon, authenticated, service_role");
  });

  it("binds private storage objects to the authenticated user's folder", async () => {
    const storageSql = await readMigrationBySuffix(STORAGE_MIGRATION_SUFFIX);

    expect(storageSql).toContain("'private-files'");
    expect(storageSql).toContain("26214400");
    expect(storageSql).toContain(
      "(storage.foldername(name))[1] = (select auth.uid()::text)",
    );
    expect(storageSql).toContain(
      'create policy "Users can read own private files"',
    );
    expect(storageSql).toContain(
      'create policy "Users can upload own private files"',
    );
    expect(storageSql).toContain(
      'create policy "Users can update own private files"',
    );
    expect(storageSql).toContain(
      'create policy "Users can delete own private files"',
    );
  });

  it("commits each online game move, result, and session update atomically", async () => {
    const gameActionSql = await readMigrationBySuffix(
      GAME_ACTION_MIGRATION_SUFFIX,
    );

    expect(gameActionSql).toContain("function jg_app.record_game_hub_action");
    expect(gameActionSql).toContain("for update");
    expect(gameActionSql).toContain(
      "Game state changed before this action was committed",
    );
    expect(gameActionSql).toContain(
      "insert into jg_app.game_hub_session_moves",
    );
    expect(gameActionSql).toContain(
      "insert into jg_app.game_hub_session_results",
    );
    expect(gameActionSql).toContain("update jg_app.game_hub_sessions");
    expect(gameActionSql).toContain("to service_role");
    expect(gameActionSql).toContain("from public, anon, authenticated");

    const conflictSql = await readMigrationBySuffix(
      GAME_CONFLICT_MIGRATION_SUFFIX,
    );
    expect(conflictSql).toContain("errcode = 'P0001'");
    expect(conflictSql).not.toContain("errcode = '40001'");
  });
});
