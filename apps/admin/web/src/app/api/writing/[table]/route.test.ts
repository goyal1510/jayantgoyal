import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authorizeAndGetClientMock, revalidateMock } = vi.hoisted(() => ({
  authorizeAndGetClientMock: vi.fn(),
  revalidateMock: vi.fn(),
}));

vi.mock("./helpers", async () => {
  const { NextResponse } = await import("next/server");
  const { validatePortfolioWritingWriteInput } = await import(
    "@jayantgoyal/portfolio-contracts"
  );

  function validateTable(table: string) {
    return table === "writing_posts"
      ? null
      : NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  function validateWritingRequestBody(
    body: unknown,
    operation: "create" | "update",
  ) {
    const fields = validatePortfolioWritingWriteInput(body, operation);
    return fields.length === 0
      ? null
      : NextResponse.json(
          { error: "Invalid writing payload", fields },
          { status: 400 },
        );
  }

  return {
    validateTable,
    authorizeAndGetClient: authorizeAndGetClientMock,
    getWritingAdminSelectColumns: () =>
      "id, title, slug, excerpt, content, cover_image, tags, is_visible, is_published, published_at, created_at, updated_at",
    validateWritingRequestBody,
    revalidateWritingPublicContent: revalidateMock,
    TABLES_WITH_SORT_ORDER: [],
  };
});

import { GET, POST, PUT } from "./route";

function request(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(`https://admin.example.test${url}`, init);
}

function routeParams(table = "writing_posts") {
  return { params: Promise.resolve({ table }) };
}

function requireResponse(response: Response | undefined): Response {
  if (!response) throw new Error("Route handler returned no response");
  return response;
}

function makeClient({
  result = { data: { id: "post-1" }, error: null },
}: {
  result?: { data?: unknown; error?: { message: string } | null };
} = {}) {
  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    order: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(resolve),
  };

  return {
    schema: vi.fn(() => ({ from: vi.fn(() => builder) })),
    builder,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Admin Writing CMS route contract", () => {
  it("does not revalidate public pages on a read", async () => {
    const client = makeClient({ result: { data: [], error: null } });
    authorizeAndGetClientMock.mockResolvedValue({ client });

    const response = requireResponse(
      await GET(request("/api/writing/writing_posts"), routeParams()),
    );

    expect(response.status).toBe(200);
    expect(authorizeAndGetClientMock).toHaveBeenCalledWith(
      "portfolio.content.read",
    );
    expect(client.schema).toHaveBeenCalledWith("portfolio");
    expect(revalidateMock).not.toHaveBeenCalled();
  });

  it("rejects publishing without content and a publication timestamp", async () => {
    const client = makeClient();
    authorizeAndGetClientMock.mockResolvedValue({ client });

    const response = requireResponse(
      await POST(
        request("/api/writing/writing_posts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: "Draft",
            slug: "draft",
            content: "",
            is_visible: true,
            is_published: true,
            published_at: null,
          }),
        }),
        routeParams(),
      ),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).fields).toEqual([
      "content is required",
      "published_at is required when publishing",
    ]);
    expect(client.builder.insert).not.toHaveBeenCalled();
  });

  it("revalidates the public Portfolio after a successful writing update", async () => {
    const client = makeClient();
    authorizeAndGetClientMock.mockResolvedValue({ client });

    const response = requireResponse(
      await PUT(
        request("/api/writing/writing_posts?id=post-1", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: "Updated note" }),
        }),
        routeParams(),
      ),
    );

    expect(response.status).toBe(200);
    expect(authorizeAndGetClientMock).toHaveBeenCalledWith(
      "portfolio.content.update",
    );
    expect(client.builder.update).toHaveBeenCalledWith({
      title: "Updated note",
    });
    expect(revalidateMock).toHaveBeenCalledOnce();
  });
});
