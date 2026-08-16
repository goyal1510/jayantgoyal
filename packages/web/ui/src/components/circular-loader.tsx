"use client";

const COLORS = ["#06b6d4", "#a855f7", "#f59e0b", "#ec4899", "#22c55e", "#3b82f6", "#ef4444"];

/** Shared branded loading treatment for the product applications. */
export function CircularLoader() {
  const letters = ["J", "A", "Y", "A", "N", "T", "G", "O", "Y", "A", "L"];
  const totalChars = letters.length;

  const size = 155;
  const r = size / 2 - 8;
  const circumference = 2 * Math.PI * r;
  const totalArc = circumference * 0.95;
  const segments = 80;
  const step = totalArc / segments;

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <style>{`
        @keyframes comet-color {
          ${COLORS.map((c, i) => `${(i / COLORS.length) * 100}% { stroke: ${c}; }`).join("\n")}
          100% { stroke: ${COLORS[0]}; }
        }
      `}</style>
      <div className="relative flex items-center justify-center" style={{ width: 155, height: 155 }}>
        <svg
          className="absolute animate-[spin_6s_linear_infinite_reverse]"
          width={size}
          height={size}
          aria-hidden="true"
        >
          {Array.from({ length: segments }, (_, i) => {
            const t = i / (segments - 1);
            const offset = -i * step;
            const overlap = step * 2;
            const opacity = (1 - t) ** 1.5;
            const width = 1 + 5 * (1 - t);
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth={width}
                strokeDasharray={`${overlap} ${circumference - overlap}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                opacity={opacity}
                style={{ animation: `comet-color ${COLORS.length * 2}s linear infinite` }}
              />
            );
          })}
        </svg>

        <div className="relative h-28 w-28 animate-[spin_8s_linear_infinite]" aria-hidden="true">
          {letters.map((char, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-0 inline-block origin-[0_56px] text-xs font-semibold tracking-widest uppercase"
              style={{ transform: `rotate(${(360 / totalChars) * i}deg)` }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
