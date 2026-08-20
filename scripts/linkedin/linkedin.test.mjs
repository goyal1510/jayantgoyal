import { describe, expect, it, vi } from "vitest";

import { parseContentOptions } from "./manage.mjs";
import { parsePostArguments } from "./post.mjs";
import { linkedinPostUrl } from "./lib/history.mjs";
import { localPostLedgerPayload, publishedLedgerPatch } from "./lib/ledger.mjs";
import { deleteFromLinkedIn, publishToLinkedIn } from "./lib/linkedin-api.mjs";

describe("LinkedIn command parsing", () => {
  it("parses a saved Writing announcement plan", () => {
    expect(
      parseContentOptions([
        "A useful lesson",
        "--writing",
        "one-app-to-four-surfaces",
        "--topic",
        "Build in public",
        "--schedule",
        "2026-08-24T10:00:00+05:30",
      ]),
    ).toEqual({
      content: "A useful lesson",
      articleUrl: "https://jayantgoyal.com/writing/one-app-to-four-surfaces",
      writingSlug: "one-app-to-four-surfaces",
      topic: "Build in public",
      scheduledFor: "2026-08-24T10:00:00+05:30",
    });
  });

  it("keeps record publication separate from ad hoc content", () => {
    expect(parsePostArguments(["--record", "record-id"])).toEqual({
      content: "",
      articleUrl: "",
      writingSlug: "",
      recordId: "record-id",
    });
  });
});

describe("LinkedIn ledger mapping", () => {
  const legacyPost = {
    id: "urn:li:share:12345",
    text: "Original post",
    url: "https://jayantgoyal.com/writing/example",
    writingSlug: "example",
    createdAt: "2026-08-20T04:00:00.000Z",
  };

  it("maps active local history to a published record", () => {
    expect(localPostLedgerPayload(legacyPost)).toEqual({
      status: "published",
      topic: null,
      content: "Original post",
      article_url: "https://jayantgoyal.com/writing/example",
      writing_slug: "example",
      linkedin_post_urn: "urn:li:share:12345",
      linkedin_post_url:
        "https://www.linkedin.com/feed/update/urn:li:share:12345/",
      published_at: "2026-08-20T04:00:00.000Z",
      deleted_at: null,
      publication_error: null,
    });
  });

  it("distinguishes deleted records from replaced records", () => {
    expect(
      localPostLedgerPayload({
        ...legacyPost,
        deleted: true,
        deletedAt: "2026-08-20T05:00:00.000Z",
        editedTo: "urn:li:share:67890",
      }).status,
    ).toBe("replaced");
  });

  it("builds a complete publication state", () => {
    expect(
      publishedLedgerPatch("urn:li:share:67890", "2026-08-20T06:00:00.000Z"),
    ).toEqual({
      status: "published",
      linkedin_post_urn: "urn:li:share:67890",
      linkedin_post_url:
        "https://www.linkedin.com/feed/update/urn:li:share:67890/",
      published_at: "2026-08-20T06:00:00.000Z",
      deleted_at: null,
      publication_error: null,
    });
    expect(linkedinPostUrl("urn:li:share:67890")).toContain(
      "urn:li:share:67890",
    );
  });
});

describe("LinkedIn API boundaries", () => {
  it("publishes with the member identity and requested article", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "urn:li:share:12345" }), {
        status: 201,
      }),
    );
    await expect(
      publishToLinkedIn(
        {
          accessToken: "token",
          personId: "person",
          content: "Hello",
          articleUrl: "https://jayantgoyal.com/writing/example",
        },
        fetchImplementation,
      ),
    ).resolves.toBe("urn:li:share:12345");
    const [, request] = fetchImplementation.mock.calls[0];
    const body = JSON.parse(request.body);
    expect(body.author).toBe("urn:li:person:person");
    expect(
      body.specificContent["com.linkedin.ugc.ShareContent"].media[0]
        .originalUrl,
    ).toBe("https://jayantgoyal.com/writing/example");
  });

  it("treats an already-absent post as a successful deletion", async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 404 }));
    await expect(
      deleteFromLinkedIn(
        { accessToken: "token", postUrn: "urn:li:share:12345" },
        fetchImplementation,
      ),
    ).resolves.toBeUndefined();
  });
});
