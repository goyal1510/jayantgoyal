import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@repo/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { getPublishedBlogPosts } from "@/lib/blog/queries";

export const metadata: Metadata = {
  title: "Blog",
  description: "Blog posts by Jayant Goyal — thoughts on web development, tech, and more.",
};

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
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <h1 className="text-3xl font-bold">Blog</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group">
            <Card className="h-full transition-colors group-hover:border-foreground/20">
              {post.cover_image && (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="h-48 w-full rounded-t-lg object-cover"
                />
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                {post.published_at && (
                  <CardDescription>
                    {new Date(post.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>
                )}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
