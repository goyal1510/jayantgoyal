"use client";

import { useState } from "react";
import CalculatorButton from "@/components/custom-calculator/CalculatorButton";
import { ChevronRight, Shapes } from "lucide-react";

const ComponentLibrary: React.FC = () => {
  const components = [
    {
      group: "Numbers",
      items: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."],
      defaultExpanded: true,
    },
    {
      group: "Basic Operators",
      items: ["+", "-", "*", "/", "%"],
      defaultExpanded: true,
    },
    {
      group: "Functions",
      items: ["=", "C", "<", "CE", "±"],
      defaultExpanded: true,
    },
    { group: "Brackets", items: ["(", ")"], defaultExpanded: true },
  ];

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(
    components.reduce(
      (acc, section) => {
        acc[section.group] = section.defaultExpanded;
        return acc;
      },
      {} as Record<string, boolean>,
    ),
  );

  const toggleSection = (groupName: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  return (
    <section className="flex min-h-[440px] flex-col overflow-hidden rounded-[1.75rem] border border-border/80 bg-card xl:h-[620px]">
      <div className="border-b border-border/70 p-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-[-0.03em]">
          <Shapes className="size-5" />
          Key library
        </h2>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Click a key or drag it into the selection.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {components.map((section) => (
            <div
              key={section.group}
              className="overflow-hidden rounded-xl border border-border/70"
            >
              <button
                type="button"
                onClick={() => toggleSection(section.group)}
                className="flex w-full cursor-pointer items-center justify-between p-3 text-left transition-colors hover:bg-muted/40"
              >
                <h4 className="text-sm font-medium text-foreground">
                  {section.group}
                </h4>
                <ChevronRight
                  className={`h-4 w-4 transition-transform duration-200 ${
                    expandedSections[section.group] ? "rotate-90" : ""
                  }`}
                />
              </button>

              {expandedSections[section.group] && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-5 gap-2">
                    {section.items.map((label) => (
                      <CalculatorButton
                        key={label}
                        label={label}
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-lg shadow-none"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComponentLibrary;
