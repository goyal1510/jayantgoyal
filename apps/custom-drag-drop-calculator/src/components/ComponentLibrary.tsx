'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CalculatorButton from "@/components/CalculatorButton";

const ComponentLibrary: React.FC = () => {
  const components = [
    { group: "Numbers", items: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."], defaultExpanded: true },
    { group: "Basic Operators", items: ["+", "-", "*", "/", "%"], defaultExpanded: true },
    { group: "Functions", items: ["=", "C", "<", "CE", "±"], defaultExpanded: true },
    { group: "Brackets", items: ["(", ")"], defaultExpanded: true },
  ];

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    components.reduce((acc, section) => {
      acc[section.group] = section.defaultExpanded;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleSection = (groupName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
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
            <path d="M12 2v20M2 12h20" />
          </svg>
          <span>Components</span>
        </CardTitle>
        <CardDescription>
          Drag components below or click to add them to your calculator
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {components.map((section) => (
            <div key={section.group} className="rounded-lg border border-white/10 bg-muted/20">
              <button
                onClick={() => toggleSection(section.group)}
                className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors duration-200 hover:bg-muted/50"
              >
                <h4 className="text-sm font-medium text-foreground">
                  {section.group}
                </h4>
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${
                    expandedSections[section.group] ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
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
                        className=""
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComponentLibrary;
