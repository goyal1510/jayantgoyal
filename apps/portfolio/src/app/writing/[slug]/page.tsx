import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { formatAppPageTitle } from "@repo/brand";

import { getWritingPostBySlug, getPublishedWritingPosts } from "@/lib/writing/queries";
import { getPortfolioShellData } from "@/lib/portfolio/editorial-server";
import { DEFAULT_OG_IMAGE, PERSON_NAME, SITE_URL } from "@/lib/seo/config";

import { WritingContent } from "./writing-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getWritingPostBySlug(slug);

  if (!post) return { title: "Post Not Found" };

  const url = `${SITE_URL}/writing/${slug}`;
  const description = post.excerpt ?? undefined;
  const socialTitle = formatAppPageTitle("portfolio", post.title);

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: socialTitle,
      description,
      url,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      images: post.cover_image
        ? [{ url: post.cover_image }]
        : [{ url: DEFAULT_OG_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [post.cover_image ?? DEFAULT_OG_IMAGE],
    },
  };
}

export default async function WritingPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, publishedPosts, shell] = await Promise.all([
    getWritingPostBySlug(slug),
    getPublishedWritingPosts(),
    getPortfolioShellData(),
  ]);

  if (!post) notFound();
  if (!shell.sectionContent.article.isVisible) notFound();

  const currentIndex = publishedPosts.findIndex(
    (publishedPost) => publishedPost.slug === post.slug,
  );
  const nextPost =
    currentIndex >= 0 ? (publishedPosts[currentIndex + 1] ?? null) : null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: PERSON_NAME, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/writing/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <WritingContent
        post={post}
        nextPost={nextPost}
        brandLabel={shell.brandLabel}
        navigation={shell.navigation}
        profileName={shell.profile.name}
        profileRole={shell.profile.role}
        articleContent={shell.sectionContent.article}
      />
    </>
  );
}
