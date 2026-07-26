import type { Metadata } from "next";

import { ContactSection } from "@/components/editorial/contact-section";
import { EditorialSubpageHeader } from "@/components/editorial/subpage-header";
import { getEditorialPortfolioData } from "@/lib/portfolio/editorial-server";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { sectionContent } = await getEditorialPortfolioData();
  return buildPublicPageMetadata({
    title: "Contact",
    description: sectionContent.contact.description,
    pathname: "/contact",
  });
}

export default async function ContactPage() {
  const portfolio = await getEditorialPortfolioData();

  return (
    <main className="editorial-page">
      <EditorialSubpageHeader
        brandLabel={portfolio.profile.displayName}
        navigation={portfolio.navigation}
      />
      <ContactSection
        profile={portfolio.profile}
        content={portfolio.sectionContent.contact}
      />
    </main>
  );
}
