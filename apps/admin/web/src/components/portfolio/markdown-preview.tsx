"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="min-h-72 rounded-xl border bg-muted/20 p-4 text-sm leading-6">
      {content.trim() ? (
        <div className="space-y-4 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_img]:max-h-56 [&_img]:rounded-lg [&_img]:object-contain [&_li]:ml-5 [&_li]:list-disc [&_ol]:space-y-1 [&_p]:text-muted-foreground [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-foreground [&_pre]:p-3 [&_pre]:text-background [&_ul]:space-y-1">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-muted-foreground">Markdown preview will appear here.</p>
      )}
    </div>
  );
}
