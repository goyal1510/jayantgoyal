"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { vs } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeEntryContentProps {
  content: string;
  language: string;
  isDark: boolean;
}

export function CodeEntryContent({
  content,
  language,
  isDark,
}: CodeEntryContentProps) {
  return (
    <SyntaxHighlighter
      language={language}
      style={isDark ? vscDarkPlus : vs}
      customStyle={{
        margin: 0,
        borderRadius: "0.375rem",
        fontSize: "0.875rem",
      }}
      showLineNumbers
    >
      {content}
    </SyntaxHighlighter>
  );
}
