import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@repo/ui/badge";

import { getPublishedBlogPosts } from "@/lib/blog/queries";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const revalidate = 300;

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Blog",
  description:
    "Writing by Jayant Goyal about product engineering, web development, and practical software delivery.",
  pathname: "/blog",
});

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 space-y-3">
        <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          Notes from the workbench
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
        <p className="max-w-2xl text-muted-foreground">
          Practical notes on building, shipping, and maintaining software.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <h2 className="font-semibold">No published posts yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Check back soon for new writing.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {posts.map((post, index) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className={`group block p-5 transition-colors hover:bg-accent/60 sm:p-6 ${
                index !== posts.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <h2 className="text-lg font-semibold group-hover:text-primary">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {post.excerpt}
                    </p>
                  )}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {post.published_at && (
                  <time
                    dateTime={post.published_at}
                    className="shrink-0 text-xs text-muted-foreground tabular-nums"
                  >
                    {new Date(post.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
