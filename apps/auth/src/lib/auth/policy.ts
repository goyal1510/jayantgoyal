const PROTECTED_PREFIXES = ["/account", "/logout", "/mfa"] as const;

export function isProtectedAuthPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function requiresAccountMfaStepUp({
  pathname,
  hasUser,
  currentLevel,
  nextLevel,
}: {
  pathname: string;
  hasUser: boolean;
  currentLevel: string | null | undefined;
  nextLevel: string | null | undefined;
}): boolean {
  return (
    hasUser &&
    pathname.startsWith("/account/") &&
    nextLevel === "aal2" &&
    currentLevel !== "aal2"
  );
}

export function hasRecentSignIn(
  lastSignInAt: string | null | undefined,
  now = Date.now(),
  maximumAgeMs = 10 * 60 * 1000,
): boolean {
  if (!lastSignInAt) return false;
  const timestamp = Date.parse(lastSignInAt);
  return (
    Number.isFinite(timestamp) &&
    now - timestamp >= 0 &&
    now - timestamp <= maximumAgeMs
  );
}
