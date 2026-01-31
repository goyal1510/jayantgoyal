import { NextResponse } from "next/server";
import {
  checkAdminAccess,
  getAdminClient,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/api-helpers";

const RESERVED_SLUGS = ["admin", "login", "api", "auth", "not-found"];
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// PUT - Update a short URL
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    if (slug !== undefined) {
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
    }

    const updateData: Record<string, unknown> = {};
    if (slug !== undefined) updateData.slug = slug;
    if (target_url !== undefined) updateData.target_url = target_url;
    if (title !== undefined) updateData.title = title || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await adminClient
      .schema("url_shortener")
      .from("short_urls")
      .update(updateData)
      .eq("id", id)
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
    console.error("Error updating URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a short URL
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authCheck = await checkAdminAccess();
    if (!authCheck.authorized) {
      return unauthorizedResponse(authCheck.error, authCheck.status);
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return serverErrorResponse();
    }

    const { error } = await adminClient
      .schema("url_shortener")
      .from("short_urls")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
