import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PLATFORM_SESSION_COOKIE_DOMAIN,
  PLATFORM_SESSION_COOKIE_NAME,
} from "./cookies";

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

import { createSupabaseRequestClient } from "./server";

function createClient({
  userId = "test-user",
  session = {
    access_token: "synthetic-access-token",
    refresh_token: "synthetic-refresh-token",
  },
}: {
  userId?: string | null;
  session?: { access_token: string; refresh_token: string } | null;
} = {}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
      setSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  };
}

const responseCookies = { set: vi.fn() };
const responseHeaders = { set: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createSupabaseRequestClient session selection", () => {
  it("keeps the installed default storage contract in legacy mode", async () => {
    const legacyClient = createClient();
    createServerClientMock.mockReturnValue(legacyClient);

    const result = await createSupabaseRequestClient({
      supabaseUrl: "https://project-ref.supabase.co",
      supabaseAnonKey: "synthetic-anon-key",
      requestCookies: { getAll: () => [] },
      responseCookies,
      responseHeaders,
      hostname: "studio.jayantgoyal.com",
      sessionMode: "legacy",
    });

    expect(result).toBe(legacyClient);
    expect(createServerClientMock).toHaveBeenCalledOnce();
    expect(createServerClientMock.mock.calls[0]?.[2]).not.toHaveProperty(
      "cookieOptions",
    );
  });

  it("uses the approved parent-domain options in platform mode", async () => {
    const platformClient = createClient();
    createServerClientMock.mockReturnValue(platformClient);

    const result = await createSupabaseRequestClient({
      supabaseUrl: "https://project-ref.supabase.co",
      supabaseAnonKey: "synthetic-anon-key",
      requestCookies: { getAll: () => [] },
      responseCookies,
      responseHeaders,
      hostname: "admin.jayantgoyal.com",
      sessionMode: "platform",
    });

    expect(result).toBe(platformClient);
    expect(createServerClientMock.mock.calls[0]?.[2]?.cookieOptions).toEqual({
      name: PLATFORM_SESSION_COOKIE_NAME,
      domain: PLATFORM_SESSION_COOKIE_DOMAIN,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it("does not consult legacy state when a platform chunk exists", async () => {
    const platformClient = createClient();
    createServerClientMock.mockReturnValue(platformClient);

    const result = await createSupabaseRequestClient({
      supabaseUrl: "https://project-ref.supabase.co",
      supabaseAnonKey: "synthetic-anon-key",
      requestCookies: {
        getAll: () => [
          { name: "sb-project-ref-auth-token", value: "legacy" },
          { name: `${PLATFORM_SESSION_COOKIE_NAME}.0`, value: "platform" },
        ],
      },
      responseCookies,
      responseHeaders,
      hostname: "studio.jayantgoyal.com",
      sessionMode: "compatibility",
    });

    expect(result).toBe(platformClient);
    expect(createServerClientMock).toHaveBeenCalledOnce();
  });

  it("promotes a validated legacy-only request to the platform client", async () => {
    const platformClient = createClient();
    const legacyClient = createClient();
    createServerClientMock
      .mockReturnValueOnce(platformClient)
      .mockReturnValueOnce(legacyClient);

    const result = await createSupabaseRequestClient({
      supabaseUrl: "https://project-ref.supabase.co",
      supabaseAnonKey: "synthetic-anon-key",
      requestCookies: {
        getAll: () => [
          { name: "sb-project-ref-auth-token.0", value: "synthetic" },
        ],
      },
      responseCookies,
      responseHeaders,
      hostname: "studio.jayantgoyal.com",
      sessionMode: "compatibility",
    });

    expect(result).toBe(platformClient);
    expect(legacyClient.auth.getUser).toHaveBeenCalledOnce();
    expect(platformClient.auth.setSession).toHaveBeenCalledWith({
      access_token: "synthetic-access-token",
      refresh_token: "synthetic-refresh-token",
    });
    expect(platformClient.auth.getUser).toHaveBeenCalledOnce();
  });

  it("keeps concurrent Studio/Admin promotions isolated when one transfer loses a refresh race", async () => {
    let releasePromotions!: () => void;
    let startedPromotions = 0;
    const bothPromotionsStarted = new Promise<void>((resolve) => {
      releasePromotions = resolve;
    });
    const concurrentGetUser = vi.fn(async () => {
      startedPromotions += 1;
      if (startedPromotions === 2) releasePromotions();
      await bothPromotionsStarted;
      return { data: { user: { id: "shared-user" } }, error: null };
    });

    const studioPlatformClient = createClient({ userId: "shared-user" });
    const studioLegacyClient = createClient({ userId: "shared-user" });
    studioLegacyClient.auth.getUser = concurrentGetUser;

    const adminPlatformClient = createClient({ userId: "shared-user" });
    adminPlatformClient.auth.setSession.mockResolvedValue({
      data: {},
      error: { message: "synthetic refresh collision" },
    });
    const adminLegacyClient = createClient({ userId: "shared-user" });
    adminLegacyClient.auth.getUser = concurrentGetUser;

    createServerClientMock
      .mockReturnValueOnce(studioPlatformClient)
      .mockReturnValueOnce(studioLegacyClient)
      .mockReturnValueOnce(adminPlatformClient)
      .mockReturnValueOnce(adminLegacyClient);

    const legacyCookie = [
      { name: "sb-project-ref-auth-token.0", value: "synthetic" },
    ];
    const [studioResult, adminResult] = await Promise.all([
      createSupabaseRequestClient({
        supabaseUrl: "https://project-ref.supabase.co",
        supabaseAnonKey: "synthetic-anon-key",
        requestCookies: { getAll: () => legacyCookie },
        responseCookies: { set: vi.fn() },
        responseHeaders: { set: vi.fn() },
        hostname: "studio.jayantgoyal.com",
        sessionMode: "compatibility",
      }),
      createSupabaseRequestClient({
        supabaseUrl: "https://project-ref.supabase.co",
        supabaseAnonKey: "synthetic-anon-key",
        requestCookies: { getAll: () => legacyCookie },
        responseCookies: { set: vi.fn() },
        responseHeaders: { set: vi.fn() },
        hostname: "admin.jayantgoyal.com",
        sessionMode: "compatibility",
      }),
    ]);

    expect(concurrentGetUser).toHaveBeenCalledTimes(2);
    expect(studioResult).toBe(studioPlatformClient);
    expect(adminResult).toBe(adminLegacyClient);
    expect(studioPlatformClient.auth.getUser).toHaveBeenCalledOnce();
    expect(adminPlatformClient.auth.getUser).not.toHaveBeenCalled();
  });
});
