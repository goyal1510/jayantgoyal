const FEATURED_WORK_LIMIT = 4;

export function getFeaturedWork<T>(work: T[]): T[] {
  return work.slice(0, FEATURED_WORK_LIMIT);
}
