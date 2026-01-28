import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CertificatesList } from "./certificates-list";

export default async function CertificatesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: certificates } = await supabase
    .schema("portfolio")
    .from("certificates")
    .select("*")
    .order("sort_order", { ascending: true });

  return <CertificatesList initialData={certificates ?? []} />;
}
