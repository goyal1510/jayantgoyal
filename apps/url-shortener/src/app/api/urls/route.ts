import { NextResponse } from "next/server";
import {
  checkAdminAccess,
  getAdminClient,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/api-helpers";

const RESERVED_SLUGS = ["admin", "login", "api", "auth", "not-found"];
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// GET - List all short URLs
export async function GET() {
  try {
    const authCheck = await checkAdminAccess();
    if (!authCheck.authorized) {
      return unauthorizedResponse(authCheck.error, authCheck.status);
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return serverErrorResponse();
    }

    const { data, error } = await adminClient
      .schema("url_shortener")
      .from("short_urls")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching URLs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new short URL
export async function POST(request: Request) {
  try {
    const authCheck = await checkAdminAccess();
    if (!authCheck.authorized) {
      return unauthorizedResponse(authCheck.error, authCheck.status);
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return serverErrorResponse();
    }

    const body = await request.json();
    const { slug, target_url, title, is_active } = body;

    if (!slug || !target_url) {
      return NextResponse.json(
        { error: "Slug and target URL are required" },
        { status: 400 }
      );
    }

    if (!SLUG_REGEX.test(slug)) {
      return NextResponse.json(
        {
          error:
            "Slug must be lowercase alphanumeric with hyphens (e.g. my-link)",
        },
        { status: 400 }
      );
    }

    if (RESERVED_SLUGS.includes(slug)) {
      return NextResponse.json(
        { error: `"${slug}" is a reserved slug and cannot be used` },
        { status: 400 }
      );
    }

    const { data, error } = await adminClient
      .schema("url_shortener")
      .from("short_urls")
      .insert({
        slug,
        target_url,
        title: title || null,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A URL with this slug already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error creating URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
