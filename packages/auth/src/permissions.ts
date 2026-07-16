export type AuthLevel = string | null | undefined;

export function isAdminRole(
  role: string | null | undefined,
): role is "admin" | "super_admin" {
  return role === "admin" || role === "super_admin";
}

export function requiresMfaStepUp(
  currentLevel: AuthLevel,
  nextLevel: AuthLevel,
  hasVerifiedFactor: boolean,
): boolean {
  return currentLevel === "aal1" && nextLevel === "aal2" && hasVerifiedFactor;
}
