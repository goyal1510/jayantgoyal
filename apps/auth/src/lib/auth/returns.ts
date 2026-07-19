import { safeReturnTarget } from "@repo/auth/redirects";
import { applicationOrigin } from "@repo/platform";

export const AUTH_ORIGIN = applicationOrigin(
  "auth",
  process.env.NEXT_PUBLIC_SITE_URL,
);

const LOCAL_APPLICATION_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  "http://127.0.0.1:3003",
] as const;

function configuredReturnOrigins(): string[] {
  return (process.env.NEXT_PUBLIC_AUTH_RETURN_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function authReturnOrigins(): string[] {
  return [
    applicationOrigin("portfolio", process.env.NEXT_PUBLIC_PORTFOLIO_URL),
    applicationOrigin("studio", process.env.NEXT_PUBLIC_STUDIO_URL),
    applicationOrigin("admin", process.env.NEXT_PUBLIC_ADMIN_URL),
    applicationOrigin("auth", process.env.NEXT_PUBLIC_SITE_URL),
    ...LOCAL_APPLICATION_ORIGINS,
    ...configuredReturnOrigins(),
  ];
}

export function resolveAuthReturnTarget(
  value: string | null | undefined,
  requestOrigin = AUTH_ORIGIN,
  fallback = "/account/security",
): string {
  return safeReturnTarget(value, {
    requestOrigin,
    allowedOrigins: authReturnOrigins(),
    fallback,
  });
}

export function buildSignedOutLoginUrl({
  value,
  requestOrigin = AUTH_ORIGIN,
}: {
  value: string | null | undefined;
  requestOrigin?: string;
}): string {
  const returnTo = resolveAuthReturnTarget(value, requestOrigin, "/welcome");
  const login = new URL("/welcome", `${requestOrigin}/`);
  login.searchParams.set("signed_out", "true");
  if (returnTo !== "/welcome") login.searchParams.set("return_to", returnTo);
  return login.toString();
}
