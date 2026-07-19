import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SectionEditorialPanel } from "@/components/portfolio/section-editorial-panel";
import { PortfolioWorkspaceHeader } from "@/components/portfolio/portfolio-workspace-header";
import { loadContactWorkspace } from "@/lib/portfolio-workspace";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const supabase = await createSupabaseServerClient();

  const { contact, editorial } = await loadContactWorkspace(supabase);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PortfolioWorkspaceHeader workspace="contact" />
      <SectionEditorialPanel sectionKey="contact" {...editorial} />
      <ContactForm
        initialData={contact}
      />
    </div>
  );
}
