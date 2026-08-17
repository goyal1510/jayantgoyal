import { NextResponse } from "next/server";
import {
  validateTable,
  authorizeAndGetClient,
  getWritingAdminSelectColumns,
  validateWritingRequestBody,
  revalidateWritingPublicContent,
  TABLES_WITH_SORT_ORDER,
} from "./helpers";
import { ADMIN_CAPABILITIES } from "@/lib/access";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  try {
    const { table } = await params;

    const tableError = validateTable(table);
    if (tableError) return tableError;

    const auth = await authorizeAndGetClient(ADMIN_CAPABILITIES.portfolioRead);
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    let data;
    let error;

    if (id) {
      const result = await auth.client
        .schema("portfolio")
        .from(table)
        .select(getWritingAdminSelectColumns())
        .eq("id", id)
        .single();
      data = result.data;
      error = result.error;
    } else if (TABLES_WITH_SORT_ORDER.includes(table)) {
      const result = await auth.client
        .schema("portfolio")
        .from(table)
        .select(getWritingAdminSelectColumns())
        .order("sort_order", { ascending: true });
      data = result.data;
      error = result.error;
    } else {
      const result = await auth.client
        .schema("portfolio")
        .from(table)
        .select(getWritingAdminSelectColumns());
      data = result.data;
      error = result.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching Writing data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  try {
    const { table } = await params;

    const tableError = validateTable(table);
    if (tableError) return tableError;

    const auth = await authorizeAndGetClient(
      ADMIN_CAPABILITIES.portfolioCreate,
    );
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const payloadError = validateWritingRequestBody(body, "create");
    if (payloadError) return payloadError;

    const { data, error } = await auth.client
      .schema("portfolio")
      .from(table)
      .insert(body)
      .select(getWritingAdminSelectColumns())
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateWritingPublicContent();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error creating Writing data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  try {
    const { table } = await params;

    const tableError = validateTable(table);
    if (tableError) return tableError;

    const auth = await authorizeAndGetClient(
      ADMIN_CAPABILITIES.portfolioUpdate,
    );
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required for update" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const payloadError = validateWritingRequestBody(body, "update");
    if (payloadError) return payloadError;

    const { data, error } = await auth.client
      .schema("portfolio")
      .from(table)
      .update(body)
      .eq("id", id)
      .select(getWritingAdminSelectColumns())
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateWritingPublicContent();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error updating Writing data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  try {
    const { table } = await params;

    const tableError = validateTable(table);
    if (tableError) return tableError;

    const auth = await authorizeAndGetClient(
      ADMIN_CAPABILITIES.portfolioDelete,
    );
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required for delete" },
        { status: 400 },
      );
    }

    const { error } = await auth.client
      .schema("portfolio")
      .from(table)
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateWritingPublicContent();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Writing data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
