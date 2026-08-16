"use client";

import { useDrop } from "react-dnd";
import { useCalculatorStore } from "@/lib/custom-calculator/useCalculatorStore";
import { Button } from "@jayantgoyal/web-ui/button";
import { CalculatorComponent } from "@/lib/custom-calculator/types";
import { cn } from "@jayantgoyal/web-ui/lib/utils";
import { GripVertical, MousePointerClick, Trash2, X } from "lucide-react";

function DragDropContainer() {
  const { components, addComponent, removeComponent, clearComponents } =
    useCalculatorStore();

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "COMPONENT",
    drop: (item: CalculatorComponent) => addComponent(item),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <section className="flex min-h-[440px] flex-col overflow-hidden rounded-[1.75rem] border border-border/80 bg-card xl:h-[620px]">
      <div className="flex items-start justify-between gap-3 border-b border-border/70 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-[-0.03em]">
            <MousePointerClick className="size-5" />
            Selected keys
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {components.length
              ? `${components.length} keys in the layout`
              : "Build your key set here"}
          </p>
        </div>
        {components.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearComponents}
            aria-label="Clear selected keys"
            className="size-9 rounded-lg text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div
          ref={drop as unknown as React.RefObject<HTMLDivElement>}
          className={cn(
            "flex min-h-0 flex-1 flex-col rounded-2xl border border-dashed transition-colors",
            isOver
              ? "border-primary bg-primary/10"
              : "border-border bg-muted/20",
          )}
        >
          {components.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-muted-foreground">
                <MousePointerClick className="mx-auto mb-3 size-10 opacity-40" />
                <p className="text-sm">Drop components here</p>
                <p className="text-xs">or click them to add</p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <div className="grid flex-1 auto-rows-min grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 xl:grid-cols-1">
                {components.map((component, index) => (
                  <div
                    key={`${component.label}-${index}`}
                    className="flex flex-shrink-0 items-center justify-between rounded-xl border border-border/70 bg-background p-3 animate-fade-in"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <GripVertical className="size-4 text-muted-foreground" />
                      {component.label}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeComponent(index)}
                      aria-label={`Remove ${component.label}`}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default DragDropContainer;
