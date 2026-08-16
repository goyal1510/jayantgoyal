import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/portfolio-admin-data", () => ({
  castPortfolioRecord: (value: unknown) => value,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import {
  loadActivityWorkspace,
  loadAboutWorkspace,
  loadContactWorkspace,
  loadExperienceWorkspace,
  loadHomeWorkspace,
  loadSkillsWorkspace,
  loadWorkWorkspace,
  loadWritingWorkspace,
} from "./portfolio-workspace";

type Dataset = Record<string, unknown>;

function makeSupabaseMock({
  rows = {},
  errors = {},
}: {
  rows?: Dataset;
  errors?: Record<string, string>;
} = {}) {
  return {
    schema: vi.fn((schema: string) => ({
      from: vi.fn((table: string) => {
        const key = `${schema}.${table}`;
        const queryRows = rows[key];
        const queryError = errors[key]
          ? { message: errors[key] }
          : null;
        let filter: { column: string; value: unknown } | null = null;

        const query = {
          select: vi.fn(() => query),
          eq: vi.fn((column: string, value: unknown) => {
            filter = { column, value };
            return query;
          }),
          order: vi.fn(() => query),
          maybeSingle: vi.fn(async () => {
            if (queryError) return { data: null, error: queryError };
            const matchingRows = Array.isArray(queryRows)
              ? queryRows.filter((row) => {
                  if (!filter || typeof row !== "object" || row === null) {
                    return true;
                  }
                  return (
                    (row as Record<string, unknown>)[filter.column] ===
                    filter.value
                  );
                })
              : [];
            return { data: matchingRows[0] ?? null, error: null };
          }),
          then: (resolve: (value: unknown) => unknown) => {
            if (queryError) {
              return Promise.resolve({ data: null, error: queryError }).then(
                resolve,
              );
            }
            return Promise.resolve({
              data: Array.isArray(queryRows) ? queryRows : [],
              error: null,
            }).then(resolve);
          },
        };

        return query;
      }),
    })),
  };
}

const editorialRows = [
  {
    section_key: "hero",
    eyebrow: "Home",
    is_visible: true,
  },
  {
    section_key: "resume",
    eyebrow: "Resume",
    is_visible: true,
  },
  {
    section_key: "about",
    eyebrow: "About",
    is_visible: true,
  },
  {
    section_key: "education",
    eyebrow: "Education",
    is_visible: true,
  },
  {
    section_key: "skills",
    eyebrow: "Skills",
    is_visible: true,
  },
  {
    section_key: "work",
    eyebrow: "Work",
    is_visible: true,
  },
  {
    section_key: "writing",
    eyebrow: "Writing",
    is_visible: true,
  },
  {
    section_key: "article",
    eyebrow: "Article",
    is_visible: true,
  },
];

describe("Portfolio CMS workspace loaders", () => {
  it("loads Home from hero and resume presentation rows without fallback data", async () => {
    const supabase = makeSupabaseMock({
      rows: {
        "portfolio.hero": [{ id: "hero-1", display_name: "Jayant" }],
        "portfolio.section_content": editorialRows,
        "portfolio.nav_items": [],
      },
    });

    const result = await loadHomeWorkspace(supabase as never);

    expect(result.hero).toEqual({ id: "hero-1", display_name: "Jayant" });
    expect(result.editorial.sectionContent?.section_key).toBe("hero");
    expect(result.editorialBySection.resume?.sectionContent?.section_key).toBe(
      "resume",
    );
  });

  it("joins About education rows and Skills rows from their canonical tables", async () => {
    const supabase = makeSupabaseMock({
      rows: {
        "portfolio.about": [{ id: "about-1", headline: "About" }],
        "portfolio.education": [{ id: "education-1", school: "University" }],
        "portfolio.skill_categories": [{ id: "category-1", title: "Frontend" }],
        "portfolio.skills": [
          { id: "skill-1", category_id: "category-1", name: "React" },
        ],
        "portfolio.section_content": editorialRows,
        "portfolio.nav_items": [],
      },
    });

    const about = await loadAboutWorkspace(supabase as never);
    const skills = await loadSkillsWorkspace(supabase as never);

    expect(about.education).toHaveLength(1);
    expect(about.editorialBySection.education?.sectionContent?.section_key).toBe(
      "education",
    );
    expect(skills.categories[0]?.skills).toEqual([
      { id: "skill-1", category_id: "category-1", name: "React" },
    ]);
  });

  it("loads Work and Writing from their owning presentation contexts", async () => {
    const supabase = makeSupabaseMock({
      rows: {
        "portfolio.work": [{ id: "project-1", name: "Signal" }],
        "portfolio.section_content": editorialRows,
        "portfolio.nav_items": [],
        "jg_app.writing_posts": [{ id: "post-1", slug: "hello" }],
      },
    });

    const work = await loadWorkWorkspace(supabase as never);
    const writing = await loadWritingWorkspace(supabase as never);

    expect(work.work).toEqual([{ id: "project-1", name: "Signal" }]);
    expect(work.editorial.sectionContent?.section_key).toBe("work");
    expect(writing.posts).toEqual([{ id: "post-1", slug: "hello" }]);
    expect(writing.editorialBySection.article?.sectionContent?.section_key).toBe(
      "article",
    );
  });

  it("loads Experience, GitHub, and Contact from their owning records", async () => {
    const supabase = makeSupabaseMock({
      rows: {
        "portfolio.experience": [{ id: "experience-1", company: "Studio" }],
        "portfolio.certificates": [{ id: "certificate-1", name: "AWS" }],
        "portfolio.hero": [{ id: "hero-1", github_username: "goyal1510" }],
        "portfolio.contact": [{ id: "contact-1", email: "hello@example.com" }],
        "portfolio.section_content": [
          ...editorialRows,
          { section_key: "experience", eyebrow: "Experience", is_visible: true },
          { section_key: "credentials", eyebrow: "Credentials", is_visible: true },
          { section_key: "activity", eyebrow: "GitHub", is_visible: true },
          { section_key: "contact", eyebrow: "Contact", is_visible: true },
        ],
        "portfolio.nav_items": [],
      },
    });

    const experience = await loadExperienceWorkspace(supabase as never);
    const activity = await loadActivityWorkspace(supabase as never);
    const contact = await loadContactWorkspace(supabase as never);

    expect(experience.experience).toEqual([
      { id: "experience-1", company: "Studio" },
    ]);
    expect(experience.certificates).toEqual([
      { id: "certificate-1", name: "AWS" },
    ]);
    expect(experience.editorialBySection.credentials?.sectionContent?.section_key).toBe(
      "credentials",
    );
    expect(activity.hero).toEqual({
      id: "hero-1",
      github_username: "goyal1510",
    });
    expect(activity.editorial.sectionContent?.section_key).toBe("activity");
    expect(contact.contact).toEqual({
      id: "contact-1",
      email: "hello@example.com",
    });
    expect(contact.editorial.sectionContent?.section_key).toBe("contact");
  });

  it("surfaces database read errors instead of silently falling back", async () => {
    const supabase = makeSupabaseMock({
      rows: {
        "portfolio.section_content": editorialRows,
        "portfolio.nav_items": [],
      },
      errors: { "portfolio.work": "Work unavailable" },
    });

    await expect(loadWorkWorkspace(supabase as never)).rejects.toThrow(
      "Unable to load Work: Work unavailable",
    );
  });
});
