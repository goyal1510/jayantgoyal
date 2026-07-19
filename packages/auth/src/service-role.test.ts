import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

import { createSupabaseServiceRoleClient } from "./service-role";

describe("createSupabaseServiceRoleClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project-ref.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "synthetic-service-role-key");
    createClientMock.mockReturnValue({ kind: "service-role-client" });
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("creates a non-persisted service-role client from server configuration", () => {
    expect(createSupabaseServiceRoleClient()).toEqual({
      kind: "service-role-client",
    });
    expect(createClientMock).toHaveBeenCalledWith(
      "https://project-ref.supabase.co",
      "synthetic-service-role-key",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  });

  it("fails closed when service-role configuration is incomplete", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    expect(() => createSupabaseServiceRoleClient()).toThrow(
      "Missing Supabase service role configuration.",
    );
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
