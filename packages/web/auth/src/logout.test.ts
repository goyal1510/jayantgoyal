import { describe, expect, it, vi } from "vitest";

import { signOutSession } from "./logout";

describe("signOutSession", () => {
  it("terminates only the current session by default", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });

    await signOutSession({ auth: { signOut } });

    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("uses global scope only when the caller explicitly requests it", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });

    await signOutSession({ auth: { signOut } }, "global");

    expect(signOut).toHaveBeenCalledWith({ scope: "global" });
  });
});
