import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const pageParam = Number(url.searchParams.get("page")) || 1;
  const pageSizeParam = Number(url.searchParams.get("pageSize")) || 20;

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, 50)
      : 20;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const {
    data: results,
    error,
    count,
  } = await supabase
    .schema("studio")
    .from("typing_test_results")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching typing test results:", error);
    return NextResponse.json(
      { error: error.message || "Unable to fetch results." },
      { status: 500 },
    );
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    items: results ?? [],
    total,
    page,
    pageSize,
    totalPages,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    wpm,
    accuracy,
    duration_seconds,
    total_characters,
    correct_characters,
    text_length,
  } = body ?? {};

  if (
    typeof wpm !== "number" ||
    typeof accuracy !== "number" ||
    typeof duration_seconds !== "number" ||
    typeof total_characters !== "number" ||
    typeof correct_characters !== "number" ||
    typeof text_length !== "number"
  ) {
    return NextResponse.json(
      { error: "All fields are required and must be numbers." },
      { status: 400 },
    );
  }

  const { data: result, error } = await supabase
    .schema("studio")
    .from("typing_test_results")
    .insert({
      user_id: user.id,
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy * 100) / 100,
      duration_seconds: Math.round(duration_seconds),
      total_characters,
      correct_characters,
      text_length,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving typing test result:", error);
    return NextResponse.json(
      { error: error.message || "Unable to save result." },
      { status: 500 },
    );
  }

  return NextResponse.json({ result });
}
