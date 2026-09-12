"use client";

import { useEffect, useId, useState } from "react";

type MermaidState =
  | { status: "loading" }
  | { status: "ready"; svg: string }
  | { status: "error"; message: string };

type MermaidApi = (typeof import("mermaid"))["default"];

let mermaidPromise: Promise<MermaidApi> | null = null;

/** Load and configure the renderer once, even when an article has many diagrams. */
function loadMermaid(): Promise<MermaidApi> {
  mermaidPromise ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        background: "#f4f0e8",
        primaryColor: "#f4f0e8",
        primaryTextColor: "#151515",
        primaryBorderColor: "#151515",
        lineColor: "#e8502a",
        secondaryColor: "#ebe5da",
        tertiaryColor: "#ffffff",
        fontFamily: "var(--font-sans), sans-serif",
      },
    });
    return mermaid;
  });

  return mermaidPromise;
}

/** Render a Mermaid code fence as an accessible, responsive article diagram. */
export function MermaidDiagram({ source }: { source: string }) {
  const reactId = useId();
  const [state, setState] = useState<MermaidState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const diagramId = `article-diagram-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

    async function renderDiagram() {
      try {
        const mermaid = await loadMermaid();
        const rendered = await mermaid.render(diagramId, source);

        if (active) {
          setState({ status: "ready", svg: rendered.svg });
        }
      } catch (error) {
        if (active) {
          setState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Unable to render diagram",
          });
        }
      }
    }

    setState({ status: "loading" });
    void renderDiagram();

    return () => {
      active = false;
    };
  }, [reactId, source]);

  if (state.status === "loading") {
    return (
      <div className="editorial-prose__diagram" aria-live="polite">
        Drawing architecture diagram…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="editorial-prose__diagram" role="alert">
        This diagram could not be rendered. {state.message}
      </div>
    );
  }

  return (
    <div
      className="editorial-prose__diagram"
      role="img"
      aria-label="Architecture diagram"
      dangerouslySetInnerHTML={{ __html: state.svg }}
    />
  );
}
