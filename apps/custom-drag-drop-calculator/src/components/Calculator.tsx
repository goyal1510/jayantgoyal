'use client';

import { useState } from "react";
import { useCalculatorStore } from "@/store/useCalculatorStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Display from "./Display";

const Calculator: React.FC = () => {
  const { components } = useCalculatorStore();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const handleClick = (label: string) => {
    try {
      if (label === "=") {
        // Basic calculation
        const result = Function(`"use strict"; return (${input})`)();
        const calculation = `${input} = ${result}`;
        setHistory(prev => [calculation, ...prev.slice(0, 4)]);
        setInput(result.toString());
      } 
      else if (label === "C") {
        setInput('');
        setHistory([]);
      }
      else if (label === "CE") {
        setInput('');
      }
      else if (label === "<") {
        setInput(prev => prev.slice(0, -1));
      }
      else if (label === "±") {
        setInput(prev => {
          if (prev === '' || prev === '0') return '0';
          if (prev.startsWith('-')) return prev.slice(1);
          return '-' + prev;
        });
      }
      else {
        setInput((prev) => prev + label);
      }
    } catch {
      setInput("Error");
    }
  };

  const getButtonVariant = (label: string) => {
    if (label === "=") return "default";
    if (["C", "<", "CE"].includes(label)) return "destructive";
    if (["+", "-", "*", "/", "%"].includes(label)) return "secondary";
    if (["±"].includes(label)) return "outline";
    return "outline";
  };

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
            <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
            <path d="M12 18h.01" />
          </svg>
          <span>Your Calculator</span>
        </CardTitle>
        <CardDescription>
          Your custom calculator will appear here
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col space-y-4">
          <Display value={input} className="flex-shrink-0" />
          
          {components.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
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
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                  <path d="M12 18h.01" />
                </svg>
                <p className="text-sm">Add components to build</p>
                <p className="text-xs">your calculator</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-4 gap-2">
                {components.map((component, index) => (
                  <Button
                    key={index}
                    variant={getButtonVariant(component.label)}
                    size="lg"
                    className="h-12 text-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                    onClick={() => handleClick(component.label)}
                  >
                    {component.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="flex-shrink-0">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Calculations</h4>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {history.map((calc, index) => (
                  <div key={index} className="text-xs text-muted-foreground font-mono bg-muted/50 p-1 rounded">
                    {calc}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Calculator;
