"use client";

import { useEffect, useState } from "react";

import Calculator from "@/components/custom-calculator/Calculator";
import ComponentLibrary from "@/components/custom-calculator/ComponentLibrary";
import DragDropContainer from "@/components/custom-calculator/DragDropContainer";
import DragDropProvider from "@/components/custom-calculator/DragDropProvider";
import { useCalculatorStore } from "@/lib/custom-calculator/useCalculatorStore";
import { Blocks } from "lucide-react";
import { WorkspaceHeader } from "@jayant/web-ui/workspace-header";

function CalculatorApp() {
  return (
    <DragDropProvider>
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
        <WorkspaceHeader
          icon={Blocks}
          title="Calculator Builder"
          description="Choose the keys you need, review the selected layout, and use the calculator as you build it."
          tone="sand"
        />
        <main>
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[270px_minmax(0,0.78fr)_minmax(360px,1.22fr)]">
            <ComponentLibrary />
            <DragDropContainer />
            <Calculator />
          </div>
        </main>
      </div>
    </DragDropProvider>
  );
}

export default function CustomCalculatorClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    useCalculatorStore.persist.rehydrate();
  }, []);

  if (!isClient) {
    return (
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
        <WorkspaceHeader
          icon={Blocks}
          title="Calculator Builder"
          description="Choose the keys you need, review the selected layout, and use the calculator as you build it."
          tone="sand"
        />
        <main>
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[270px_minmax(0,0.78fr)_minmax(360px,1.22fr)]">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[420px] animate-pulse rounded-[1.75rem] border border-border/80 bg-muted/30"
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return <CalculatorApp />;
}
