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

function request(body: unknown) {
  return new NextRequest(
    "https://admin.example.test/api/portfolio/section-presentation",
    {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    },
  );
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

function makeRpcClient(result: {
  data: unknown;
  error: { message: string } | null;
}) {
  const rpc = vi.fn().mockResolvedValue(result);
  const schema = vi.fn(() => ({ rpc }));
  return { client: { schema }, schema, rpc };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Admin section presentation route", () => {
  it("rejects malformed presentation payloads before authorization", async () => {
    const response = requireResponse(
      await PUT(request({ section_key: "unknown" })),
    );

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

  it("saves copy and navigation through one transactional RPC", async () => {
    const saved = {
      sectionContent: { id: "copy-1", section_key: "about", ...validCopy },
      navigation: {
        id: "nav-1",
        section_id: "about",
        ...validNavigation,
      },
    };
    const rpcClient = makeRpcClient({ data: saved, error: null });
    authorizeAndGetClientMock.mockResolvedValue({
      client: rpcClient.client,
    });

    const response = requireResponse(
      await PUT(
        request({
          section_key: "about",
          copy: validCopy,
          navigation: validNavigation,
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: saved });
    expect(authorizeAndGetClientMock).toHaveBeenCalledWith(
      "portfolio.content.update",
    );
    expect(rpcClient.schema).toHaveBeenCalledWith("portfolio");
    expect(rpcClient.rpc).toHaveBeenCalledWith("save_section_presentation", {
      p_section_key: "about",
      p_copy: validCopy,
      p_navigation: validNavigation,
    });
    expect(revalidateMock).toHaveBeenCalledOnce();
  });

  it("passes null navigation without creating a second write path", async () => {
    const saved = {
      sectionContent: { id: "copy-1", section_key: "hero", ...validCopy },
      navigation: null,
    };
    const rpcClient = makeRpcClient({ data: saved, error: null });
    authorizeAndGetClientMock.mockResolvedValue({
      client: rpcClient.client,
    });

    const response = requireResponse(
      await PUT(
        request({
          section_key: "hero",
          copy: validCopy,
          navigation: null,
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(rpcClient.rpc).toHaveBeenCalledWith("save_section_presentation", {
      p_section_key: "hero",
      p_copy: validCopy,
      p_navigation: null,
    });
  });

  it("does not revalidate when the transaction fails", async () => {
    const rpcClient = makeRpcClient({
      data: null,
      error: { message: "transaction failed" },
    });
    authorizeAndGetClientMock.mockResolvedValue({
      client: rpcClient.client,
    });

    const response = requireResponse(
      await PUT(
        request({
          section_key: "about",
          copy: validCopy,
          navigation: validNavigation,
        }),
      ),
    );

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe("transaction failed");
    expect(revalidateMock).not.toHaveBeenCalled();
  });
});
