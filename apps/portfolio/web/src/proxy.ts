import { NextResponse, type NextRequest } from "next/server";

const MARKDOWN_EXEMPT_PREFIXES = [
  "/api/",
  "/.well-known/",
  "/_next/",
  "/assets/",
  "/images/",
  "/documents/",
];

function wantsMarkdown(request: NextRequest) {
  return request.headers.get("accept")?.includes("text/markdown") === true;
}

function isMarkdownExempt(pathname: string) {
  return (
    pathname === "/llms.txt" ||
    pathname === "/auth.md" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/agent/") ||
    MARKDOWN_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|pdf|ico)$).*)",
  ],
};

export default function proxy(request: NextRequest) {
  if (wantsMarkdown(request) && !isMarkdownExempt(request.nextUrl.pathname)) {
    return NextResponse.rewrite(new URL("/llms.txt", request.url));
  }

  return NextResponse.next();
}
