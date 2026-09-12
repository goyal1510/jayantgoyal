import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { getMermaidSource } from "./markdown-code";

describe("getMermaidSource", () => {
  it("extracts Mermaid source and removes the Markdown trailing newline", () => {
    const code = createElement(
      "code",
      { className: "language-mermaid" },
      "flowchart LR\n  A --> B\n",
    );

    expect(getMermaidSource(code)).toBe("flowchart LR\n  A --> B");
  });

  it("leaves ordinary fenced code to the default renderer", () => {
    const code = createElement(
      "code",
      { className: "language-typescript" },
      "const visible = true;\n",
    );

    expect(getMermaidSource(code)).toBeNull();
  });

  it("ignores non-code children", () => {
    expect(getMermaidSource("plain text")).toBeNull();
  });
});
