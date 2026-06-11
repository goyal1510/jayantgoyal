"use client";

/* eslint-disable @next/next/no-img-element */

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@repo/ui/badge";
import type { BlogPost } from "@/lib/blog/queries";

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-2xl font-semibold mt-8 mb-3 pb-2 border-b">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-2">{children}</h3>,
  h4: ({ children }) => <h4 className="text-lg font-medium mt-4 mb-2">{children}</h4>,
  p: ({ children }) => <p className="leading-7 mb-4 text-muted-foreground">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1.5 text-muted-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-muted-foreground">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4">{children}</blockquote>
  ),
  code: ({ children, className }) => {
    const isInline = !className;
    if (isInline) {
      return <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">{children}</code>;
    }
    return (
      <code className="block rounded-lg bg-muted p-4 text-sm font-mono overflow-x-auto my-4 leading-relaxed">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="rounded-lg bg-muted p-4 overflow-x-auto my-4">{children}</pre>,
  hr: () => <hr className="my-8 border-border" />,
  img: ({ src, alt }) => (
    <img src={src} alt={alt ?? ""} className="rounded-lg my-6 max-w-full" />
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-border bg-muted px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
};

export function BlogContent({ post }: { post: BlogPost }) {
  return (
    <article className="flex flex-col h-[calc(100vh-8rem)] rounded-lg border">
      {/* Header — fixed */}
      <div className="shrink-0 border-b p-4 sm:p-6">
        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            className="mb-4 max-h-64 w-full rounded-lg object-cover"
          />
        )}
        <h1 className="mb-2 text-xl sm:text-2xl font-bold">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {post.published_at && (
            <time dateTime={post.published_at} className="shrink-0">
              {new Date(post.published_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
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
        </div>
      </div>

      {/* Content — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
