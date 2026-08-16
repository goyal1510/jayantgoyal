import { describe, expect, it } from "vitest";

import {
  profileMetadataFromIdentities,
  providerAvatarUrl,
} from "./profile";

const identity = (
  provider: string,
  data: Record<string, unknown>,
  lastSignInAt: string,
) => ({
  id: `${provider}-identity`,
  user_id: "user-id",
  identity_id: `${provider}-identity`,
  provider,
  identity_data: data,
  last_sign_in_at: lastSignInAt,
});

describe("profile identity resolution", () => {
  it("uses the most recently used provider avatar", () => {
    const user = {
      identities: [
        identity(
          "google",
          { picture: "https://google.example/avatar.png" },
          "2026-07-19T10:00:00.000Z",
        ),
        identity(
          "github",
          { avatar_url: "https://github.example/avatar.png" },
          "2026-07-19T11:00:00.000Z",
        ),
      ],
    };

    expect(providerAvatarUrl(user)).toBe("https://github.example/avatar.png");
  });

  it("extracts names from identities without using auth user metadata", () => {
    const metadata = profileMetadataFromIdentities({
      identities: [
        identity(
          "google",
          { given_name: "Jayant", family_name: "Goyal" },
          "2026-07-19T11:00:00.000Z",
        ),
      ],
    });

    expect(metadata).toEqual({ firstName: "Jayant", lastName: "Goyal" });
  });
});
