import { NextRequest, NextResponse } from "next/server";
import {
  authorizeCommerceAdmin,
  commerceAdminErrorResponse,
} from "../../../helpers";

const MAX_RESULTS = 25;
const SEARCH_LIMIT = 80;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DeliveryFileRow = {
  id: string;
  bucket_id: string | null;
  storage_path: string | null;
  display_name: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  mime_type: string | null;
  size_bytes: number;
  updated_at: string;
};

function normalizeSearch(value: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, SEARCH_LIMIT).toLowerCase();
}

function fileMatchesSearch(file: DeliveryFileRow, query: string) {
  if (!query) return true;

  return [
    file.display_name,
    file.file_name,
    file.file_path,
    file.file_type,
    file.mime_type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeCommerceAdmin();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json({ error: "Order id is invalid." }, { status: 400 });
    }

    const searchQuery = normalizeSearch(request.nextUrl.searchParams.get("q"));

    const { data: order, error: orderError } = await auth.client
      .from("commerce_orders")
      .select("id,user_id")
      .eq("id", id)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: "Unable to load order." }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data, error } = await auth.client
      .from("file_manager_files")
      .select(
        "id,bucket_id,storage_path,display_name,file_name,file_path,file_type,mime_type,size_bytes,updated_at"
      )
      .eq("user_id", order.user_id)
      .eq("is_directory", false)
      .eq("is_deleted", false)
      .not("storage_path", "is", null)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: "Unable to load buyer files." }, { status: 500 });
    }

    const files = ((data ?? []) as DeliveryFileRow[])
      .filter((file) => file.storage_path && fileMatchesSearch(file, searchQuery))
      .slice(0, MAX_RESULTS)
      .map((file) => ({
        id: file.id,
        bucket_id: file.bucket_id ?? "private-files",
        storage_path: file.storage_path,
        display_name: file.display_name,
        file_name: file.file_name,
        file_path: file.file_path,
        file_type: file.file_type,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
        updated_at: file.updated_at,
      }));

    return NextResponse.json({
      files,
      count: files.length,
      query: searchQuery,
    });
  } catch (error) {
    return commerceAdminErrorResponse(error);
  }
}
