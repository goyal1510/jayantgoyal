'use client';

import { useDrop } from "react-dnd";
import { useCalculatorStore } from "@/store/useCalculatorStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalculatorComponent } from "@/types";
import { cn } from "@/lib/utils";

const DragDropContainer: React.FC = () => {
  const { components, addComponent, removeComponent, clearComponents } = useCalculatorStore();

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "COMPONENT",
    drop: (item: CalculatorComponent) => addComponent(item),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <Card className="flex min-h-[440px] flex-col border-white/10 bg-background/70 shadow-xl shadow-primary/5 backdrop-blur lg:h-[520px]">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M8 2v4l-3 3h18l-3-3V2Z" />
            <path d="M8 6h8" />
            <path d="M8 10h8" />
          </svg>
          <span>Your Components</span>
        </CardTitle>
        <CardDescription>
          Components you&apos;ve selected will appear here
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div 
          ref={drop as unknown as React.RefObject<HTMLDivElement>} 
          className={cn(
            "flex-1 border-2 border-dashed rounded-lg transition-all duration-200 flex flex-col min-h-0",
            isOver 
              ? "border-primary bg-primary/5 shadow-lg" 
              : "border-muted-foreground/25 bg-muted/50"
          )}
        >
          {components.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-12 w-12 mx-auto mb-2 opacity-50"
                >
                  <path d="M8 2v4l-3 3h18l-3-3V2Z" />
                  <path d="M8 6h8" />
                  <path d="M8 10h8" />
                </svg>
                <p className="text-sm">Drop components here</p>
                <p className="text-xs">or click them to add</p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <div className="flex-1 space-y-2 overflow-y-auto">
                {components.map((component, index) => (
                  <div 
                    key={index} 
                    className="flex flex-shrink-0 items-center justify-between rounded-lg border border-white/10 bg-card/80 p-3 shadow-sm animate-fade-in"
                  >
                    <span className="font-medium">{component.label}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeComponent(index)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {components.length > 0 && (
          <div className="mt-4 flex justify-center flex-shrink-0">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={clearComponents}
              className="transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 mr-2"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Clear All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DragDropContainer;
