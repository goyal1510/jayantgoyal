import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authorizeAndGetClientMock, revalidateMock } = vi.hoisted(() => ({
  authorizeAndGetClientMock: vi.fn(),
  revalidateMock: vi.fn(),
}));

vi.mock("./helpers", async () => {
  const { NextResponse } = await import("next/server");
  const {
    PORTFOLIO_ADMIN_SELECT_COLUMNS,
    PORTFOLIO_TABLES,
    validatePortfolioWriteInput,
  } = await import("@jayantgoyal/portfolio-contracts");

  function validateTable(table: string) {
    if (
      !PORTFOLIO_TABLES.includes(table as (typeof PORTFOLIO_TABLES)[number])
    ) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }
    return null;
  }

  function validatePortfolioRequestBody(
    table: string,
    body: unknown,
    operation: "create" | "update",
  ) {
    const errors = validatePortfolioWriteInput(table, body, operation);
    return errors.length === 0
      ? null
      : NextResponse.json(
          { error: "Invalid Portfolio payload", fields: errors },
          { status: 400 },
        );
  }

  function preparePortfolioMutationPayload(
    table: string,
    body: unknown,
    operation: "create" | "update",
  ) {
    if (
      table !== "hero" ||
      operation !== "create" ||
      typeof body !== "object" ||
      body === null
    ) {
      return body;
    }

    const input = body as Record<string, unknown>;
    return {
      ...input,
      name: "Jayant",
      display_name: "Jayant",
      seo_title: `Jayant | ${input.role}`,
    };
  }

  return {
    ALLOWED_TABLES: PORTFOLIO_TABLES,
    TABLES_WITH_SORT_ORDER: [
      "education",
      "experience",
      "skill_categories",
      "skills",
      "work",
      "certificates",
      "nav_items",
    ],
    validateTable,
    getPortfolioAdminSelectColumns: (table: string) =>
      PORTFOLIO_ADMIN_SELECT_COLUMNS[
        table as keyof typeof PORTFOLIO_ADMIN_SELECT_COLUMNS
      ],
    validatePortfolioRequestBody,
    preparePortfolioMutationPayload,
    authorizeAndGetClient: authorizeAndGetClientMock,
    revalidatePortfolioPublicContent: revalidateMock,
  };
});

import { DELETE, GET, POST, PUT } from "./route";

type QueryResult = { data?: unknown; error?: { message: string } | null };

function makeClient({
  result = { data: { id: "row-1" }, error: null },
  operations = [],
}: {
  result?: QueryResult;
  operations?: Array<Record<string, unknown>>;
} = {}) {
  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn((payload: unknown) => {
      operations.push({ operation: "insert", payload });
      return builder;
    }),
    update: vi.fn((payload: unknown) => {
      operations.push({ operation: "update", payload });
      return builder;
    }),
    delete: vi.fn(() => {
      operations.push({ operation: "delete" });
      return builder;
    }),
    eq: vi.fn((column: string, value: string) => {
      operations.push({ operation: "eq", column, value });
      return builder;
    }),
    order: vi.fn((column: string, options: unknown) => {
      operations.push({ operation: "order", column, options });
      return Promise.resolve(result);
    }),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: QueryResult) => unknown) =>
      Promise.resolve(result).then(resolve),
  };

  return {
    schema: vi.fn(() => ({ from: vi.fn(() => builder) })),
    builder,
    operations,
  };
}

function routeParams(table: string) {
  return { params: Promise.resolve({ table }) };
}

function request(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(`https://admin.example.test${url}`, init);
}

function requireResponse(response: Response | undefined): Response {
  if (!response) throw new Error("Route handler returned no response");
  return response;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Admin Portfolio table route contract", () => {
  it("rejects unknown tables before touching authorization or Supabase", async () => {
    const response = requireResponse(
      await GET(
        request("/api/portfolio/not-a-table"),
        routeParams("not-a-table"),
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid table" });
    expect(authorizeAndGetClientMock).not.toHaveBeenCalled();
  });

  it("returns the authorization response without creating a service client", async () => {
    authorizeAndGetClientMock.mockResolvedValue({
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = requireResponse(
      await GET(request("/api/portfolio/work"), routeParams("work")),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("rejects a malformed typed payload before mutation or revalidation", async () => {
    const operations: Array<Record<string, unknown>> = [];
    const client = makeClient({ operations });
    authorizeAndGetClientMock.mockResolvedValue({ client });

    const response = requireResponse(
      await POST(
        request("/api/portfolio/work", {
          method: "POST",
          body: JSON.stringify({ name: "Missing required fields" }),
          headers: { "content-type": "application/json" },
        }),
        routeParams("work"),
      ),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Invalid Portfolio payload");
    expect(operations).toEqual([]);
    expect(revalidateMock).not.toHaveBeenCalled();
  });

  it("writes a valid project through the requested schema/table and revalidates public pages", async () => {
    const operations: Array<Record<string, unknown>> = [];
    const client = makeClient({
      operations,
      result: { data: { id: "project-1" }, error: null },
    });
    authorizeAndGetClientMock.mockResolvedValue({ client });
    const payload = {
      name: "Signal",
      slug: "signal",
      eyebrow: "Product system",
      short_description: "A focused workspace.",
      impact: "Made a complex workflow easier to understand.",
      contribution: "Product direction and implementation.",
      year_label: "2026",
      image_url: "/work/signal.png",
      image_alt: "Signal workspace overview",
      tags: ["Next.js"],
      github_link: "",
      live_link: "",
      sort_order: 0,
      is_visible: true,
    };

    const response = requireResponse(
      await POST(
        request("/api/portfolio/work", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "content-type": "application/json" },
        }),
        routeParams("work"),
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { id: "project-1" } });
    expect(client.schema).toHaveBeenCalledWith("portfolio");
    expect(operations).toContainEqual({ operation: "insert", payload });
    expect(revalidateMock).toHaveBeenCalledOnce();
  });

  it("injects fixed identity fields when creating the Portfolio hero", async () => {
    const operations: Array<Record<string, unknown>> = [];
    const client = makeClient({ operations });
    authorizeAndGetClientMock.mockResolvedValue({ client });
    const payload = {
      role: "Software Engineer",
      tagline: "Reliable product systems",
      blurb: "I build dependable software.",
      headline: "Clear products from idea through delivery.",
      current_title: "Software Engineer",
      availability: "Open to thoughtful collaborations.",
      resume_url: "/resume.pdf",
      github_username: "goyal1510",
      seo_description: "Jayant builds clear and dependable digital products.",
    };

    const response = requireResponse(
      await POST(
        request("/api/portfolio/hero", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "content-type": "application/json" },
        }),
        routeParams("hero"),
      ),
    );

    expect(response.status).toBe(200);
    expect(operations).toContainEqual({
      operation: "insert",
      payload: {
        ...payload,
        name: "Jayant",
        display_name: "Jayant",
        seo_title: "Jayant | Software Engineer",
      },
    });
  });

  it("requires an id for updates and deletes", async () => {
    const client = makeClient();
    authorizeAndGetClientMock.mockResolvedValue({ client });

    const update = requireResponse(
      await PUT(
        request("/api/portfolio/work", {
          method: "PUT",
          body: JSON.stringify({ image_alt: "Updated" }),
          headers: { "content-type": "application/json" },
        }),
        routeParams("work"),
      ),
    );
    const remove = requireResponse(
      await DELETE(
        request("/api/portfolio/work", { method: "DELETE" }),
        routeParams("work"),
      ),
    );

    expect(update.status).toBe(400);
    expect(remove.status).toBe(400);
    expect(client.builder.update).not.toHaveBeenCalled();
    expect(client.builder.delete).not.toHaveBeenCalled();
  });

  it("updates and deletes a canonical row before revalidating public content", async () => {
    const operations: Array<Record<string, unknown>> = [];
    const client = makeClient({
      operations,
      result: { data: { id: "project-1" }, error: null },
    });
    authorizeAndGetClientMock.mockResolvedValue({ client });

    const update = requireResponse(
      await PUT(
        request("/api/portfolio/work?id=project-1", {
          method: "PUT",
          body: JSON.stringify({ image_alt: "Updated screenshot" }),
          headers: { "content-type": "application/json" },
        }),
        routeParams("work"),
      ),
    );
    const remove = requireResponse(
      await DELETE(
        request("/api/portfolio/work?id=project-1", {
          method: "DELETE",
        }),
        routeParams("work"),
      ),
    );

    expect(update.status).toBe(200);
    expect(remove.status).toBe(200);
    expect(operations).toContainEqual({
      operation: "update",
      payload: { image_alt: "Updated screenshot" },
    });
    expect(operations).toContainEqual({
      operation: "delete",
    });
    expect(operations).toContainEqual({
      operation: "eq",
      column: "id",
      value: "project-1",
    });
    expect(revalidateMock).toHaveBeenCalledTimes(2);
  });

  it("uses a singleton read when an id is supplied", async () => {
    const operations: Array<Record<string, unknown>> = [];
    const client = makeClient({
      operations,
      result: { data: { id: "hero-1" }, error: null },
    });
    authorizeAndGetClientMock.mockResolvedValue({ client });

    const response = requireResponse(
      await GET(request("/api/portfolio/hero?id=hero-1"), routeParams("hero")),
    );

    expect(response.status).toBe(200);
    expect(operations).toContainEqual({
      operation: "eq",
      column: "id",
      value: "hero-1",
    });
  });

  it("orders collection reads with the canonical sort field", async () => {
    const operations: Array<Record<string, unknown>> = [];
    const client = makeClient({
      operations,
      result: { data: [], error: null },
    });
    authorizeAndGetClientMock.mockResolvedValue({ client });

    const response = requireResponse(
      await GET(request("/api/portfolio/work"), routeParams("work")),
    );

    expect(response.status).toBe(200);
    expect(operations).toContainEqual({
      operation: "order",
      column: "sort_order",
      options: { ascending: true },
    });
  });
});
