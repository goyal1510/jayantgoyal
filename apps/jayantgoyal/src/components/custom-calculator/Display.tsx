'use client';

import { cn } from "@/lib/utils";

interface DisplayProps {
  value: string;
  className?: string;
}

const Display: React.FC<DisplayProps> = ({ value, className }) => {
  return (
    <div className={cn(
      "flex min-h-[80px] items-center justify-end rounded-lg border border-white/10 bg-gradient-to-r from-slate-900/80 to-slate-800/70 p-4 text-2xl font-mono shadow-inner shadow-black/30 transition-all duration-200",
      "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      className
    )}>
      <span className="text-foreground break-all text-right">
        {value || "0"}
      </span>
    </div>
  );
};

export default Display;
