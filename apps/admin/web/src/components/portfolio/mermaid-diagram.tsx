"use client";

import { useEffect, useId, useState } from "react";

type MermaidState =
  | { status: "loading" }
  | { status: "ready"; svg: string }
  | { status: "error"; message: string };

type MermaidApi = (typeof import("mermaid"))["default"];

let mermaidPromise: Promise<MermaidApi> | null = null;

/** Load the preview renderer once while keeping it out of the initial Admin bundle. */
function loadMermaid(): Promise<MermaidApi> {
  mermaidPromise ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        background: "#ffffff",
        primaryColor: "#f4f4f5",
        primaryTextColor: "#18181b",
        primaryBorderColor: "#a1a1aa",
        lineColor: "#ea580c",
        secondaryColor: "#fff7ed",
        tertiaryColor: "#ffffff",
      },
    });
    return mermaid;
  });

  return mermaidPromise;
}

/** Render a Mermaid Markdown fence exactly as it will appear on Portfolio. */
export function MermaidDiagram({ source }: { source: string }) {
  const reactId = useId();
  const [state, setState] = useState<MermaidState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const diagramId = `admin-diagram-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

    async function renderDiagram() {
      try {
        const mermaid = await loadMermaid();
        const rendered = await mermaid.render(diagramId, source);

        if (active) setState({ status: "ready", svg: rendered.svg });
      } catch (error) {
        if (active) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Unable to render diagram",
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
      <div className="rounded-lg border bg-background p-6 text-muted-foreground">
        Drawing diagram…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-destructive">
        Diagram error: {state.message}
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border bg-background p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      role="img"
      aria-label="Markdown diagram preview"
      dangerouslySetInnerHTML={{ __html: state.svg }}
    />
  );
}
