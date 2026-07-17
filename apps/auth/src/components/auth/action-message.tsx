import type { AuthActionState } from "@/lib/auth/action-support";

export function ActionMessage({ state }: { state: AuthActionState }) {
  if (!state.error && !state.success) return null;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={
        state.error
          ? "text-destructive text-sm"
          : "text-sm text-green-600 dark:text-green-400"
      }
    >
      {state.error ?? state.success}
    </p>
  );
}
