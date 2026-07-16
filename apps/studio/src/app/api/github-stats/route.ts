import { NextResponse, type NextRequest } from "next/server"

const GITHUB_API = "https://api.github.com"

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { Accept: "application/vnd.github.v3+json" }
  const token = process.env.GITHUB_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

/**
 * Proxy GitHub API calls through the server to use GITHUB_TOKEN.
 * Query params:
 *   ?path=/users/goyal1510
 *   ?path=/users/goyal1510/repos&per_page=100&page=1&sort=updated
 *   ?path=/repos/owner/repo/languages
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const path = searchParams.get("path")

  if (!path) {
    return NextResponse.json({ error: "Missing 'path' parameter" }, { status: 400 })
  }

  // Only allow specific GitHub API paths
  const allowedPrefixes = ["/users/", "/repos/"]
  if (!allowedPrefixes.some((p) => path.startsWith(p))) {
    return NextResponse.json({ error: "Forbidden path" }, { status: 403 })
  }

  // Forward remaining query params (per_page, page, sort, etc.)
  const forwardParams = new URLSearchParams()
  for (const [key, value] of searchParams.entries()) {
    if (key !== "path") forwardParams.set(key, value)
  }

  const queryString = forwardParams.toString()
  const url = `${GITHUB_API}${path}${queryString ? `?${queryString}` : ""}`

  const res = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 300 }, // Cache for 5 minutes
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }

  return NextResponse.json(data)
}
