import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SchemaClient = ReturnType<ReturnType<typeof createClient>["schema"]>;

export type JobsClient = {
  from: SchemaClient["from"];
};

export async function authorizeAndGetClient(): Promise<
  | { error: NextResponse }
  | { client: JobsClient }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .schema("jg_account")
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return { error: NextResponse.json({ error: "Server config missing" }, { status: 500 }) };
  }

  const raw = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Schema-bound facade so callers can do `client.from('job_listings')`.
  const schemaClient = raw.schema("jg_app");
  const client: JobsClient = { from: schemaClient.from.bind(schemaClient) };

  return { client };
}
