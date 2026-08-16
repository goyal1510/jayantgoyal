import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowUpRight } from "lucide-react";

import { EditorialSubpageHeader } from "@/components/editorial/subpage-header";
import { formatEditorialDate } from "@/lib/writing/date";
import { getPublishedWritingPosts } from "@/lib/writing/queries";
import { getPortfolioShellData } from "@/lib/portfolio/editorial-server";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { sectionContent } = await getPortfolioShellData();
  const content = sectionContent.writing;

  return buildPublicPageMetadata({
    title: "Writing",
    description: content.description,
    pathname: "/writing",
  });
}

export default async function WritingPage() {
  const [posts, shell] = await Promise.all([
    getPublishedWritingPosts(),
    getPortfolioShellData(),
  ]);
  const content = shell.sectionContent.writing;
  if (!content.isVisible) notFound();

  return (
    <main className="editorial-page">
      <EditorialSubpageHeader
        brandLabel={shell.brandLabel}
        navigation={shell.navigation}
      />
      <section className="shell editorial-page-hero">
        <div>
          <h1>{content.headline}</h1>
          <p>{content.description}</p>
        </div>
      </section>

      <section className="shell editorial-writing-index" aria-label="Articles">
        {posts.length === 0 ? (
          <div className="editorial-writing-index__empty">
            <h2>{content.supportingText}</h2>
          </div>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/writing/${post.slug}`}
              className="editorial-writing-row"
            >
              <time dateTime={post.published_at ?? undefined}>
                {formatEditorialDate(post.published_at, "short") ?? "Published"}
              </time>
              <div>
                <h2>{post.title}</h2>
                {post.excerpt ? <p>{post.excerpt}</p> : null}
                <ul aria-label="Topics">
                  {post.tags.slice(0, 4).map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>
              <ArrowUpRight aria-hidden="true" />
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
