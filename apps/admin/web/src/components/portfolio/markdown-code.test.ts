import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { getMermaidSource } from "./markdown-code";

describe("getMermaidSource", () => {
  it("extracts Mermaid source from a Mermaid code fence", () => {
    const code = createElement(
      "code",
      { className: "language-mermaid" },
      "flowchart LR\n  A --> B\n",
    );

    expect(getMermaidSource(code)).toBe("flowchart LR\n  A --> B");
  });

  it("leaves ordinary code blocks unchanged", () => {
    const code = createElement(
      "code",
      { className: "language-typescript" },
      "const value = true;",
    );

    expect(getMermaidSource(code)).toBeNull();
  });
});
