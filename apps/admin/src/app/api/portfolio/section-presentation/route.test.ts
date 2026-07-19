import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authorizeAndGetClientMock, revalidateMock } = vi.hoisted(() => ({
  authorizeAndGetClientMock: vi.fn(),
  revalidateMock: vi.fn(),
}));

vi.mock("../[table]/helpers", () => ({
  authorizeAndGetClient: authorizeAndGetClientMock,
  revalidatePortfolioPublicContent: revalidateMock,
}));

import { PUT } from "./route";

type QueryResult = { data?: unknown; error?: { message: string } | null };

function makeClient({
  maybeSingleResults = [],
  singleResults = [],
  rollbackResult = { data: null, error: null },
}: {
  maybeSingleResults?: QueryResult[];
  singleResults?: QueryResult[];
  rollbackResult?: QueryResult;
} = {}) {
  const operations: Array<Record<string, unknown>> = [];
  const maybeSingleQueue = [...maybeSingleResults];
  const singleQueue = [...singleResults];
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
    maybeSingle: vi.fn(() =>
      Promise.resolve(maybeSingleQueue.shift() ?? { data: null, error: null }),
    ),
    single: vi.fn(() =>
      Promise.resolve(singleQueue.shift() ?? { data: null, error: null }),
    ),
    then: (resolve: (value: QueryResult) => unknown) =>
      Promise.resolve(rollbackResult).then(resolve),
  };

  return {
    client: {
      schema: vi.fn(() => ({ from: vi.fn(() => builder) })),
    },
    builder,
    operations,
  };
}

function request(body: unknown) {
  return new NextRequest("https://admin.example.test/api/portfolio/section-presentation", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function requireResponse(response: Response | undefined): Response {
  if (!response) throw new Error("Route handler returned no response");
  return response;
}

const validCopy = {
  eyebrow: "About",
  headline: "A considered practice",
  accent: "practice",
  description: "Description",
  supporting_text: "Supporting text",
  is_visible: true,
};

const validNavigation = {
  label: "About",
  note: "Story",
  sort_order: 1,
  is_visible: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Admin section presentation route", () => {
  it("rejects malformed presentation payloads before authorization", async () => {
    const response = requireResponse(await PUT(request({ section_key: "unknown" })));

    expect(response.status).toBe(400);
    expect((await response.json()).fields).toEqual(
      expect.arrayContaining([
        "section_key must be a supported Portfolio section",
        "copy is required",
        "navigation is required",
      ]),
    );
    expect(authorizeAndGetClientMock).not.toHaveBeenCalled();
  });

  it("updates existing copy and navigation rows in the Portfolio schema", async () => {
    const copyRow = { id: "copy-1", section_key: "about", ...validCopy };
    const navigationRow = {
      id: "nav-1",
      section_id: "about",
      ...validNavigation,
    };
    const client = makeClient({
      maybeSingleResults: [{ data: copyRow, error: null }, { data: navigationRow, error: null }],
      singleResults: [{ data: copyRow, error: null }, { data: navigationRow, error: null }],
    });
    authorizeAndGetClientMock.mockResolvedValue({ client: client.client });

    const response = requireResponse(await PUT(
      request({ section_key: "about", copy: validCopy, navigation: validNavigation }),
    ));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { sectionContent: copyRow, navigation: navigationRow },
    });
    expect(client.client.schema).toHaveBeenCalledWith("portfolio");
    expect(client.operations).toContainEqual({
      operation: "update",
      payload: validCopy,
    });
    expect(client.operations).toContainEqual({
      operation: "update",
      payload: { section_id: "about", ...validNavigation },
    });
    expect(revalidateMock).toHaveBeenCalledOnce();
  });

  it("creates section copy without inventing a navigation row", async () => {
    const copyRow = { id: "copy-1", section_key: "hero", ...validCopy };
    const client = makeClient({
      maybeSingleResults: [{ data: null, error: null }, { data: null, error: null }],
      singleResults: [{ data: copyRow, error: null }],
    });
    authorizeAndGetClientMock.mockResolvedValue({ client: client.client });

    const response = requireResponse(await PUT(
      request({ section_key: "hero", copy: validCopy, navigation: null }),
    ));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { sectionContent: copyRow, navigation: null },
    });
    expect(client.operations).toContainEqual({
      operation: "insert",
      payload: { section_key: "hero", ...validCopy },
    });
    expect(client.operations.some((operation) => operation.operation === "update" && operation.payload && "section_id" in (operation.payload as object))).toBe(false);
    expect(revalidateMock).toHaveBeenCalledOnce();
  });

  it("rolls back an updated copy when navigation fails", async () => {
    const existingCopy = { id: "copy-1", section_key: "about", ...validCopy };
    const existingNavigation = { id: "nav-1", section_id: "about", ...validNavigation };
    const savedCopy = { ...existingCopy, headline: "Updated headline" };
    const client = makeClient({
      maybeSingleResults: [
        { data: existingCopy, error: null },
        { data: existingNavigation, error: null },
      ],
      singleResults: [
        { data: savedCopy, error: null },
        { data: null, error: { message: "navigation write failed" } },
      ],
    });
    authorizeAndGetClientMock.mockResolvedValue({ client: client.client });

    const response = requireResponse(await PUT(
      request({
        section_key: "about",
        copy: { ...validCopy, headline: "Updated headline" },
        navigation: validNavigation,
      }),
    ));

    expect(response.status).toBe(500);
    expect((await response.json()).error).toContain("section copy was rolled back");
    expect(client.operations).toContainEqual({
      operation: "update",
      payload: {
        eyebrow: existingCopy.eyebrow,
        headline: existingCopy.headline,
        accent: existingCopy.accent,
        description: existingCopy.description,
        supporting_text: existingCopy.supporting_text,
        is_visible: existingCopy.is_visible,
      },
    });
    expect(revalidateMock).not.toHaveBeenCalled();
  });
});
