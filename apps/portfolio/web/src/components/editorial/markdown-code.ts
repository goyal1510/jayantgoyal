import { Children, type ReactNode } from "react";

/** Return diagram source only when a Markdown pre block contains Mermaid code. */
export function getMermaidSource(children: ReactNode): string | null {
  const codeElement = Children.toArray(children)[0];
  const codeProps =
    codeElement && typeof codeElement === "object" && "props" in codeElement
      ? (codeElement.props as {
          children?: ReactNode;
          className?: string;
        })
      : null;

  if (codeProps?.className !== "language-mermaid") return null;
  return String(codeProps.children ?? "").replace(/\n$/, "");
}
