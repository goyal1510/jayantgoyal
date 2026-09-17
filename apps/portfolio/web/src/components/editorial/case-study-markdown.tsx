"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { getMermaidSource } from "@/components/editorial/markdown-code";
import { MermaidDiagram } from "@/components/editorial/mermaid-diagram";

const markdownComponents: Components = {
  p: ({ children }) => <p>{children}</p>,
  ul: ({ children }) => <ul>{children}</ul>,
  ol: ({ children }) => <ol>{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong>{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  a: ({ href, children }) => {
    const isExternal = href?.startsWith("http");
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
  code: ({ children, className }) => (
    <code className={className}>{children}</code>
  ),
  pre: ({ children }) => {
    const mermaidSource = getMermaidSource(children);
    if (mermaidSource !== null) {
      return <MermaidDiagram source={mermaidSource} />;
    }

    return <pre>{children}</pre>;
  },
};

/** Render case-study body copy, including Mermaid architecture fences. */
export function CaseStudyMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}
