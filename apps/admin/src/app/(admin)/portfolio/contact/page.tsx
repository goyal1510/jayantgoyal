import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ContactForm } from "./contact-form";

export default async function ContactPage() {
  const supabase = await createSupabaseServerClient();

  const { data: contact } = await supabase
    .schema("portfolio")
    .from("contact")
    .select("*")
    .single();

  return <ContactForm initialData={contact} />;
}
