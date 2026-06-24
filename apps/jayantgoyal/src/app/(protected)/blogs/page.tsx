import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@repo/ui/badge";
import { getPublishedBlogPosts } from "@/lib/blog/queries";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Blog",
  description: "Blog posts by Jayant on web development, tech, and more.",
  pathname: "/blogs",
});

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();

  if (posts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground text-lg">No posts yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="rounded-lg border">
        {posts.map((post, i) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent ${i !== posts.length - 1 ? "border-b" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{post.title}</p>
              {post.excerpt && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">{post.excerpt}</p>
              )}
            </div>
            {post.tags.length > 0 && (
              <div className="hidden sm:flex shrink-0 gap-1">
                {post.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
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
          </Link>
        ))}
      </div>
    </div>
  );
}
