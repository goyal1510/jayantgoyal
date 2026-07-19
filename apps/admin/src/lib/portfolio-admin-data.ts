/** Intentional boundary for Supabase's dynamic schema/select inference. */
export function castPortfolioRecord<T>(value: unknown): T {
  return value as T;
}
