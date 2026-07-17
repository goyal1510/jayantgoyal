"use client";

import { cn } from "@repo/ui/lib/utils";

interface DisplayProps {
  value: string;
  className?: string;
}

function Display({ value, className }: DisplayProps) {
  return (
    <div
      className={cn(
        "flex min-h-[80px] items-center justify-end rounded-2xl border border-[#fff8ef]/15 bg-black/25 p-4 font-mono text-3xl shadow-inner shadow-black/30",
        className,
      )}
    >
      <span className="break-all text-right text-[#fff8ef]">
        {value || "0"}
      </span>
    </div>
  );
}

export default Display;
