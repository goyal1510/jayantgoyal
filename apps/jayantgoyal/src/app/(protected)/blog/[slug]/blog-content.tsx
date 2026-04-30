"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@repo/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { BlogPost } from "@/lib/blog/queries";

export function BlogContent({ post }: { post: BlogPost }) {
  return (
    <article className="mx-auto max-w-3xl p-4">
      <Link
        href="/blog"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Blog
      </Link>

      {post.cover_image && (
        /* eslint-disable-next-line @next/next/no-img-element -- external URL, next/image proxy unsupported */
        <img
          src={post.cover_image}
          alt={post.title}
          className="mb-6 max-h-96 w-full rounded-lg object-cover"
        />
      )}

      <h1 className="mb-2 text-3xl font-bold">{post.title}</h1>

      <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
        {post.published_at && (
          <time dateTime={post.published_at}>
            {new Date(post.published_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}
        {post.tags.length > 0 && (
          <div className="flex gap-1">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
