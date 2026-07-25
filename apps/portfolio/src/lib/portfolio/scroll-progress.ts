export function calculateScrollProgress(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
) {
  const scrollableDistance = scrollHeight - clientHeight;
  if (scrollableDistance <= 0) return 0;

  return Math.min(1, Math.max(0, scrollTop / scrollableDistance));
}
