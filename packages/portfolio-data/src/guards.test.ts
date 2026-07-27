import { describe, expect, it } from "vitest";

import {
  isPortfolioSectionKey,
  isValidLinkedInProfileUrl,
  isValidPublicUrl,
  isSkillProficiency,
  readPersonalInfo,
  readWorkCaseStudy,
  readSocialLinks,
  readStringArray,
  validatePortfolioWriteInput,
} from "./guards";
import { validatePortfolioSectionPresentationInput } from "./presentation";
import {
  PORTFOLIO_PUBLIC_NAVIGATION_KEYS,
  PORTFOLIO_SECTION_KEYS,
  PORTFOLIO_SECTION_WORKSPACES,
  PORTFOLIO_WORKSPACE_ROUTES,
} from "./sections";
import { PORTFOLIO_TABLES } from "./portfolio";
import {
  getWritingPublicationState,
  isPublicWritingPost,
  validatePortfolioWritingWriteInput,
} from "./writing";

describe("portfolio data guards", () => {
  it("recognizes canonical section and proficiency values", () => {
    expect(isPortfolioSectionKey("work")).toBe(true);
    expect(isPortfolioSectionKey("unknown")).toBe(false);
    expect(isSkillProficiency("core")).toBe(true);
    expect(isSkillProficiency("expert")).toBe(false);
  });

  it("keeps section ownership and active table registries exhaustive", () => {
    expect(PORTFOLIO_SECTION_KEYS).toHaveLength(15);
    expect(new Set(PORTFOLIO_TABLES).size).toBe(11);
    expect(Object.keys(PORTFOLIO_SECTION_WORKSPACES).sort()).toEqual(
      [...PORTFOLIO_SECTION_KEYS].sort(),
    );
    expect(Object.keys(PORTFOLIO_WORKSPACE_ROUTES)).toEqual([
      "home",
      "about",
      "skills",
      "experience",
      "activity",
      "work",
      "writing",
      "contact",
    ]);
    expect(
      PORTFOLIO_PUBLIC_NAVIGATION_KEYS.every((key) =>
        Object.hasOwn(PORTFOLIO_SECTION_WORKSPACES, key),
      ),
    ).toBe(true);
  });

  it("returns only validated string arrays", () => {
    expect(readStringArray(["Next.js", "Supabase"])).toEqual([
      "Next.js",
      "Supabase",
    ]);
    expect(readStringArray(["Next.js", 1])).toEqual([]);
  });

  it("guards structured CMS JSON fields", () => {
    expect(
      readPersonalInfo([{ label: "Location", value: "Hyderabad" }]),
    ).toEqual([{ label: "Location", value: "Hyderabad" }]);
    expect(readPersonalInfo([{ label: "Location" }])).toEqual([]);

    expect(
      readSocialLinks([
        {
          label: "GitHub",
          href: "https://github.com/goyal1510",
          icon_key: "Github",
        },
      ]),
    ).toEqual([
      {
        label: "GitHub",
        href: "https://github.com/goyal1510",
        icon_key: "Github",
      },
    ]);
    expect(
      readSocialLinks([{ label: "GitHub", href: "https://github.com" }]),
    ).toEqual([]);

    const caseStudy = {
      problem: "A repeated product problem.",
      solution: "A reusable product system.",
      architecture: "A typed application and relational backend.",
      decisions: [
        {
          title: "Boundary",
          detail: "Keep the public and private apps apart.",
        },
        { title: "Data", detail: "Use explicit schemas and ownership rules." },
      ],
      security: "Caller-bound access and row-level security.",
      tradeoffs: "More explicit contracts in exchange for safer change.",
      outcome: "A maintainable production workflow.",
      next_improvement: "Add deeper operational measurement.",
    };
    expect(readWorkCaseStudy(caseStudy)).toEqual(caseStudy);
    expect(readWorkCaseStudy({ ...caseStudy, decisions: [] })).toBeNull();
    expect(
      validatePortfolioWriteInput(
        "work",
        {
          case_study: {
            ...caseStudy,
            problem: "",
            decisions: [],
          },
          case_study_published: false,
        },
        "update",
      ),
    ).toEqual([]);
  });

  it("keeps writing publication state and public eligibility consistent", () => {
    expect(
      getWritingPublicationState({
        is_published: false,
        is_visible: true,
        published_at: null,
      }),
    ).toBe("draft");
    expect(
      getWritingPublicationState({
        is_published: true,
        is_visible: false,
        published_at: "2026-07-19T00:00:00.000Z",
      }),
    ).toBe("hidden");
    expect(
      getWritingPublicationState({
        is_published: true,
        is_visible: true,
        published_at: "2026-07-19T00:00:00.000Z",
      }),
    ).toBe("published");
    expect(
      isPublicWritingPost({
        is_published: true,
        is_visible: true,
        published_at: "2026-07-19T00:00:00.000Z",
      }),
    ).toBe(true);
    expect(
      isPublicWritingPost({
        is_published: true,
        is_visible: true,
        published_at: null,
      }),
    ).toBe(false);
  });

  it("rejects generated, unknown, and incomplete Admin write payloads", () => {
    expect(isValidPublicUrl("https://example.com/image.png")).toBe(true);
    expect(isValidPublicUrl("/uploads/image.png")).toBe(true);
    expect(isValidPublicUrl("//evil.example/image.png")).toBe(false);
    expect(isValidPublicUrl("javascript:alert(1)")).toBe(false);
    expect(
      isValidLinkedInProfileUrl("https://www.linkedin.com/company/codesyncai/"),
    ).toBe(true);
    expect(
      isValidLinkedInProfileUrl(
        "https://in.linkedin.com/in/desire-foundation-915599106/",
      ),
    ).toBe(true);
    expect(isValidLinkedInProfileUrl("https://example.com/company/acme")).toBe(
      false,
    );

    expect(
      validatePortfolioWriteInput(
        "work",
        {
          id: "generated",
          name: "Project",
          slug: "project",
          short_description: "A project",
          eyebrow: "Build",
          impact: "Impact",
          contribution: "Contribution",
          year_label: "2026",
          image_url: "https://example.com/project.png",
          image_alt: "Project screenshot",
        },
        "create",
      ),
    ).toEqual(["id is generated and cannot be written"]);

    expect(
      validatePortfolioWriteInput(
        "hero",
        { name: "Jayant", unexpected: true },
        "update",
      ),
    ).toEqual(["unexpected is not writable on hero"]);

    expect(
      validatePortfolioWriteInput(
        "contact",
        { email: "", phone: "+91", location: "India" },
        "create",
      ),
    ).toEqual(["email is required"]);

    expect(validatePortfolioWriteInput("hero", {}, "update")).toEqual([
      "Update payload cannot be empty",
    ]);

    expect(
      validatePortfolioWriteInput(
        "work",
        { live_link: "javascript:alert(1)" },
        "update",
      ),
    ).toEqual(["live_link must be a valid http(s) URL or site path"]);

    expect(
      validatePortfolioWriteInput(
        "experience",
        { company_url: "javascript:alert(1)" },
        "update",
      ),
    ).toEqual(["company_url must be a valid http(s) URL or site path"]);

    expect(
      validatePortfolioWriteInput(
        "experience",
        { company_url: "https://www.codesync.ai/" },
        "update",
      ),
    ).toEqual([]);

    expect(
      validatePortfolioWriteInput(
        "experience",
        { company_linkedin_url: "https://example.com/company/codesyncai" },
        "update",
      ),
    ).toEqual([
      "company_linkedin_url must be a valid LinkedIn company or profile URL",
    ]);

    expect(
      validatePortfolioWriteInput(
        "experience",
        {
          company_linkedin_url: "https://www.linkedin.com/company/codesyncai/",
        },
        "update",
      ),
    ).toEqual([]);

    expect(
      validatePortfolioWriteInput(
        "contact",
        {
          socials: [
            {
              label: "GitHub",
              href: "javascript:alert(1)",
              icon_key: "Github",
            },
          ],
        },
        "update",
      ),
    ).toEqual(["socials[0].href must be a valid http(s) URL or site path"]);

    expect(
      validatePortfolioWriteInput(
        "hero",
        { github_username: "not a username" },
        "update",
      ),
    ).toEqual(["github_username must be a valid GitHub username"]);
    expect(
      validatePortfolioWriteInput("work", { slug: "Not A Slug" }, "update"),
    ).toEqual(["slug must use lowercase letters, numbers, and hyphens"]);
    expect(
      validatePortfolioWriteInput(
        "contact",
        { email: "not-an-email" },
        "update",
      ),
    ).toEqual(["email must be a valid email address"]);
    expect(
      validatePortfolioWriteInput("work", { sort_order: -1 }, "update"),
    ).toEqual(["sort_order must be a non-negative integer"]);
    expect(
      validatePortfolioWriteInput(
        "work",
        { case_study_published: "yes" },
        "update",
      ),
    ).toEqual(["case_study_published must be a boolean"]);
    expect(
      validatePortfolioWriteInput(
        "work",
        { case_study_published: true },
        "create",
      ),
    ).toContain("a complete case_study is required before publication");

    expect(
      validatePortfolioWritingWriteInput(
        {
          id: "generated",
          title: "A note",
          slug: "A note",
          content: "draft",
          is_published: false,
        },
        "create",
      ),
    ).toEqual([
      "id is generated and cannot be written",
      "slug must use lowercase letters, numbers, and hyphens",
    ]);

    expect(
      validatePortfolioWritingWriteInput(
        {
          title: "A note",
          slug: "a-note",
          content: "",
          is_published: true,
          published_at: null,
        },
        "create",
      ),
    ).toEqual([
      "content is required",
      "published_at is required when publishing",
    ]);

    expect(
      validatePortfolioWritingWriteInput(
        { cover_image: "javascript:alert(1)" },
        "update",
      ),
    ).toEqual(["cover_image must be a valid http(s) URL or site path"]);
  });

  it("validates the cross-table section presentation payload", () => {
    expect(
      validatePortfolioSectionPresentationInput({
        section_key: "about",
        copy: {
          eyebrow: "About",
          headline: "A considered practice",
          accent: "",
          description: "Description",
          supporting_text: "Supporting text",
          is_visible: true,
        },
        navigation: {
          label: "About",
          note: "Profile",
          sort_order: 1,
          is_visible: true,
        },
      }),
    ).toEqual([]);

    expect(
      validatePortfolioSectionPresentationInput({
        section_key: "unknown",
        copy: {
          eyebrow: "",
          headline: "",
          accent: "",
          description: "",
          supporting_text: "",
          is_visible: true,
        },
        navigation: {
          label: "",
          note: 12,
          sort_order: -1,
          is_visible: "yes",
        },
      }),
    ).toEqual([
      "section_key must be a supported Portfolio section",
      "copy.eyebrow is required",
      "navigation.label is required",
      "navigation.note must be a string or null",
      "navigation.sort_order must be a non-negative integer",
      "navigation.is_visible must be a boolean",
    ]);

    expect(
      validatePortfolioSectionPresentationInput({
        section_key: "hero",
        copy: {
          eyebrow: "Home",
          headline: "Headline",
          accent: "",
          description: "Description",
          supporting_text: "Supporting text",
          is_visible: true,
        },
        navigation: {
          label: "Home",
          note: null,
          sort_order: 0,
          is_visible: true,
        },
      }),
    ).toContain("navigation is only supported for public navigation sections");
  });
});
