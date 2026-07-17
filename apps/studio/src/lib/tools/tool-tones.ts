export const TOOL_TONES = [
  "border-[#d93328] bg-[#ff5a4f] text-[#211512]",
  "border-[#bdc4a3] bg-[#d9ddc3] text-[#211512] dark:border-[#4b594b] dark:bg-[#29312a] dark:text-[#fff8ef]",
  "border-[#cfc0e4] bg-[#e8dcf5] text-[#211512] dark:border-[#5c5068] dark:bg-[#2f2938] dark:text-[#fff8ef]",
  "border-[#ddcfbb] bg-[#f2e2c8] text-[#211512] dark:border-[#5e554c] dark:bg-[#332d28] dark:text-[#fff8ef]",
  "border-border/80 bg-card text-card-foreground dark:bg-[#202124] dark:text-[#fff8ef]",
] as const;

export function getToolToneIndex(toolId: string, catalogIndex: number) {
  let hash = 0;

  for (const character of toolId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return (hash + catalogIndex) % TOOL_TONES.length;
}

export function getToolTone(toolId: string, catalogIndex: number) {
  return TOOL_TONES[getToolToneIndex(toolId, catalogIndex)];
}
