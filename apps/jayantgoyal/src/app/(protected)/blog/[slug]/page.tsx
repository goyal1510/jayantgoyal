import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/lib/blog/queries";
import { BlogContent } from "./blog-content";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/seo/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  const url = `${SITE_URL}/blog/${slug}`;
  const description = post.excerpt ?? undefined;

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      images: post.cover_image ? [{ url: post.cover_image }] : [{ url: DEFAULT_OG_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [post.cover_image ?? DEFAULT_OG_IMAGE],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: "Jayant", url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogContent post={post} />
    </>
  );
}
