import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import {
  checkCapability,
  checkProductAccess,
  listMyCapabilities,
} from "./authorization";

function createClient(result: {
  data: unknown;
  error: { message: string } | null;
}) {
  const rpc = vi.fn().mockResolvedValue(result);
  const schema = vi.fn().mockReturnValue({ rpc });

  return {
    client: { schema } as unknown as SupabaseClient,
    rpc,
    schema,
  };
}

describe("IAM authorization helpers", () => {
  it("evaluates a live dot-based capability in the IAM schema", async () => {
    const { client, rpc, schema } = createClient({ data: true, error: null });

    await expect(checkCapability(client, "admin.users.read")).resolves.toEqual({
      allowed: true,
      error: null,
    });
    expect(schema).toHaveBeenCalledWith("iam");
    expect(rpc).toHaveBeenCalledWith("has_capability", {
      p_capability_key: "admin.users.read",
    });
  });

  it("fails closed when capability evaluation returns an error", async () => {
    const { client } = createClient({
      data: true,
      error: { message: "authorization unavailable" },
    });

    await expect(
      checkCapability(client, "admin.users.delete"),
    ).resolves.toEqual({
      allowed: false,
      error: "authorization unavailable",
    });
  });

  it("keeps product entry separate from operation capabilities", async () => {
    const { client, rpc } = createClient({ data: false, error: null });

    await expect(checkProductAccess(client, "studio")).resolves.toEqual({
      allowed: false,
      error: null,
    });
    expect(rpc).toHaveBeenCalledWith("has_product_access", {
      p_product_key: "studio",
    });
  });

  it("returns the current capability set for authorized UI shaping", async () => {
    const { client } = createClient({
      data: [
        { capability_key: "admin.console.enter" },
        { capability_key: "portfolio.content.read" },
      ],
      error: null,
    });

    await expect(listMyCapabilities(client)).resolves.toEqual({
      capabilities: ["admin.console.enter", "portfolio.content.read"],
      error: null,
    });
  });
});
