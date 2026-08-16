"use client";

import { useState } from "react";
import { useCalculatorStore } from "@/lib/custom-calculator/useCalculatorStore";
import { Button } from "@jayantgoyal/web-ui/button";
import Display from "./Display";
import { Calculator as CalculatorIcon, History } from "lucide-react";

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
        setHistory((prev) => [calculation, ...prev.slice(0, 4)]);
        setInput(result.toString());
      } else if (label === "C") {
        setInput("");
        setHistory([]);
      } else if (label === "CE") {
        setInput("");
      } else if (label === "<") {
        setInput((prev) => prev.slice(0, -1));
      } else if (label === "±") {
        setInput((prev) => {
          if (prev === "" || prev === "0") return "0";
          if (prev.startsWith("-")) return prev.slice(1);
          return "-" + prev;
        });
      } else {
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
    <section className="flex min-h-[440px] flex-col overflow-hidden rounded-[1.75rem] border border-border/80 bg-card xl:h-[620px]">
      <div className="border-b border-border/70 p-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-[-0.03em]">
          <CalculatorIcon className="size-5" />
          Live calculator
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The preview updates with your selected keys.
        </p>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-1 flex-col space-y-4 rounded-[2rem] border border-[#211512] bg-[#211512] p-4 text-[#fff8ef] shadow-lg shadow-black/10 sm:p-5">
          <Display value={input} className="flex-shrink-0" />

          {components.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[#fff8ef]/25 bg-[#fff8ef]/5">
              <div className="text-center text-[#fff8ef]/60">
                <CalculatorIcon className="mx-auto mb-3 size-10 opacity-60" />
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
                    className="h-12 rounded-xl text-lg font-medium transition-transform hover:-translate-y-0.5"
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
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-[#fff8ef]/70">
                <History className="size-4" />
                Recent calculations
              </h4>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {history.map((calc, index) => (
                  <div
                    key={index}
                    className="rounded-lg bg-[#fff8ef]/10 p-2 font-mono text-xs text-[#fff8ef]/75"
                  >
                    {calc}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Calculator;
