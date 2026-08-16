import { NextResponse } from "next/server";
import {
  validateTable,
  authorizeAndGetClient,
  getPortfolioAdminSelectColumns,
  preparePortfolioMutationPayload,
  validatePortfolioRequestBody,
  revalidatePortfolioPublicContent,
  TABLES_WITH_SORT_ORDER,
} from "./helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  try {
    const { table } = await params;

    const tableError = validateTable(table);
    if (tableError) return tableError;

    const auth = await authorizeAndGetClient();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    let data;
    let error;

    if (id) {
      const result = await auth.client
        .schema("portfolio")
        .from(table)
        .select(getPortfolioAdminSelectColumns(table))
        .eq("id", id)
        .single();
      data = result.data;
      error = result.error;
    } else if (TABLES_WITH_SORT_ORDER.includes(table)) {
      const result = await auth.client
        .schema("portfolio")
        .from(table)
        .select(getPortfolioAdminSelectColumns(table))
        .order("sort_order", { ascending: true });
      data = result.data;
      error = result.error;
    } else {
      const result = await auth.client
        .schema("portfolio")
        .from(table)
        .select(getPortfolioAdminSelectColumns(table));
      data = result.data;
      error = result.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
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

    const auth = await authorizeAndGetClient();
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const payloadError = validatePortfolioRequestBody(table, body, "create");
    if (payloadError) return payloadError;

    const payload = preparePortfolioMutationPayload(table, body, "create");
    const { data, error } = await auth.client
      .schema("portfolio")
      .from(table)
      .insert(payload)
      .select(getPortfolioAdminSelectColumns(table))
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePortfolioPublicContent();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error creating portfolio data:", error);
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

    const auth = await authorizeAndGetClient();
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
    const payloadError = validatePortfolioRequestBody(table, body, "update");
    if (payloadError) return payloadError;

    const { data, error } = await auth.client
      .schema("portfolio")
      .from(table)
      .update(body)
      .eq("id", id)
      .select(getPortfolioAdminSelectColumns(table))
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePortfolioPublicContent();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error updating portfolio data:", error);
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

    const auth = await authorizeAndGetClient();
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

    revalidatePortfolioPublicContent();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting portfolio data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
