"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";

import type { BlogPost } from "@/lib/blog/queries";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-8 mb-4 text-3xl font-bold">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-8 mb-3 border-b pb-2 text-2xl font-semibold">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-2 text-xl font-semibold">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-4 mb-2 text-lg font-medium">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mb-4 leading-7 text-muted-foreground">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-4 hover:text-primary/80"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-1.5 pl-6 text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-1.5 pl-6 text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-primary/30 pl-4 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) =>
    className ? (
      <code className="my-4 block overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm leading-relaxed">
        {children}
      </code>
    ) : (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
        {children}
      </code>
    ),
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-8 border-border" />,
  img: ({ src, alt }) => (
    <img src={src} alt={alt ?? ""} className="my-6 max-w-full rounded-lg" />
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border bg-muted px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-3 py-2">{children}</td>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
};

export function BlogContent({ post }: { post: BlogPost }) {
  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/blog">← All posts</Link>
      </Button>

      <div className="overflow-hidden rounded-xl border bg-card">
        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            className="max-h-96 w-full object-cover"
          />
        )}
        <header className="border-b p-5 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {post.published_at && (
              <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            )}
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </header>
        <div className="p-5 sm:p-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
