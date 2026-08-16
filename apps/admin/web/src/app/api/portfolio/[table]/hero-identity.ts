import { PERSON_IDENTITY } from "@jayantgoyal/identity";

/** Inject fixed identity columns only when creating the singleton hero row. */
export function preparePortfolioMutationPayload(
  table: string,
  body: unknown,
  operation: "create" | "update",
): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {};
  }

  const input = body as Record<string, unknown>;
  if (table !== "hero" || operation !== "create") return input;
  const role =
    typeof input.role === "string" ? input.role : "Software Engineer";

  return {
    ...input,
    name: PERSON_IDENTITY.displayName,
    display_name: PERSON_IDENTITY.displayName,
    seo_title: `${PERSON_IDENTITY.displayName} | ${role}`,
  };
}
