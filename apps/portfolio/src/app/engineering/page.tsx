import type { Metadata } from "next";
import Link from "next/link";

import { EditorialSubpageHeader } from "@/components/editorial/subpage-header";
import { getEditorialPortfolioData } from "@/lib/portfolio/editorial-server";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { pageContent } = await getEditorialPortfolioData();
  return buildPublicPageMetadata({
    title: "Engineering",
    description: pageContent.engineering.description,
    pathname: "/engineering",
  });
}

export default async function EngineeringPage() {
  const portfolio = await getEditorialPortfolioData();
  const content = portfolio.pageContent.engineering;

  return (
    <main className="editorial-page editorial-work-page">
      <EditorialSubpageHeader
        brandLabel={portfolio.profile.displayName}
        navigation={portfolio.navigation}
      />
      <section className="shell editorial-page-hero editorial-work-hero">
        <span className="section-index">{content.eyebrow}</span>
        <div>
          <h1>{content.headline || "How I think about complete systems."}</h1>
          <p>{content.description}</p>
        </div>
      </section>
      <section className="shell capability-section">
        <div className="capability-matrix" aria-label="Engineering practices">
          {portfolio.skillGroups.map((group, index) => (
            <article className="capability-row" key={group.title}>
              <div className="capability-row__title">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{group.title}</h2>
              </div>
              <p className="skill-group__description">{group.description}</p>
              <ul>
                {group.items.map((item) => (
                  <li key={item.name} title={item.evidence}>{item.name}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="principles-strip">
          {portfolio.principles.map((principle) => (
            <article key={principle.title}>
              <h3>{principle.title}</h3>
              <p>{principle.copy}</p>
            </article>
          ))}
        </div>
        <div className="profile-actions">
          <Link href="/case-studies">Read the case studies</Link>
          <Link href="/studio">Explore Studio</Link>
        </div>
      </section>
    </main>
  );
}
